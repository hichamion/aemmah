#!/usr/bin/env node
/**
 * Final deletion of accounts whose owner pressed «حذف حسابي» more than GRACE_DAYS ago
 * (users/{uid}.deletionRequestedAt) and did not restore them. Run daily by
 * .github/workflows/purge-deleted-accounts.yml; it removes the same data as deleteMyData() in src/lib/db.ts,
 * then the Firebase Auth account.
 *
 * Uses the Firestore and Identity Toolkit REST APIs with an OAuth access token (no extra dependencies).
 *
 * Environment:
 *   ACCESS_TOKEN    OAuth token with the cloud-platform scope (the emulators accept "owner")
 *   PROJECT_ID      Firebase project id
 *   DATABASE_ID     Firestore database id ("(default)" or the named database)
 *   GRACE_DAYS      default 7
 *   DRY_RUN=1       only list what would be deleted
 *   FIRESTORE_BASE  default https://firestore.googleapis.com   (emulator: http://127.0.0.1:8085)
 *   AUTH_BASE       default https://identitytoolkit.googleapis.com (emulator: http://127.0.0.1:9099/identitytoolkit.googleapis.com)
 */

const env = process.env;
const TOKEN = env.ACCESS_TOKEN;
const PROJECT = env.PROJECT_ID;
const DATABASE = env.DATABASE_ID || '(default)';
const GRACE_DAYS = Number(env.GRACE_DAYS || 7);
const DRY = env.DRY_RUN === '1';
const FS = (env.FIRESTORE_BASE || 'https://firestore.googleapis.com').replace(/\/$/, '');
const AUTH = (env.AUTH_BASE || 'https://identitytoolkit.googleapis.com').replace(/\/$/, '');

if (!TOKEN || !PROJECT) {
  console.error('ACCESS_TOKEN and PROJECT_ID are required.');
  process.exit(1);
}

const ROOT = `projects/${PROJECT}/databases/${DATABASE}/documents`;
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'x-goog-user-project': PROJECT,
};

async function api(method, url, body) {
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 404 && method === 'DELETE') return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url.replace(TOKEN, '***')} → ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

/** Documents of a collection (optionally under a parent document) matching one field filter. */
async function where(collectionId, fieldPath, op, value, parent = ROOT) {
  const out = await api('POST', `${FS}/v1/${parent}:runQuery`, {
    structuredQuery: {
      from: [{ collectionId }],
      where: { fieldFilter: { field: { fieldPath }, op, value } },
    },
  });
  return (out || []).filter((r) => r.document).map((r) => r.document);
}

/** All documents of a (sub)collection, e.g. "users/{uid}/saved". */
async function list(path) {
  const docs = [];
  let pageToken = '';
  do {
    const out = await api('GET', `${FS}/v1/${ROOT}/${path}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`);
    docs.push(...(out?.documents || []));
    pageToken = out?.nextPageToken || '';
  } while (pageToken);
  return docs;
}

let deletedDocs = 0;
async function del(nameOrPath) {
  const name = nameOrPath.startsWith('projects/') ? nameOrPath : `${ROOT}/${nameOrPath}`;
  if (DRY) {
    console.log('  would delete', name.slice(ROOT.length + 1));
    return;
  }
  await api('DELETE', `${FS}/v1/${name}`);
  deletedDocs++;
}

const short = (name) => name.split('/').pop();
const str = (v) => ({ stringValue: v });

async function purgeUser(uid) {
  // Imam profile (id = uid), its contacts, recitation, private documents and counters.
  for (const kind of ['visa', 'certs']) {
    for (let n = 0; n < 4; n++) await del(`privateDocs/${uid}_${kind}/chunks/${n}`);
    await del(`privateDocs/${uid}_${kind}`);
  }
  for (const c of ['imams', 'imamContacts', 'recitations']) await del(`${c}/${uid}`);
  await del(`profileStats/imam_${uid}`);

  // Mosques of this account.
  for (const m of await where('mosques', 'ownerUid', 'EQUAL', str(uid))) {
    const id = short(m.name);
    await del(m.name);
    await del(`mosqueContacts/${id}`);
    await del(`profileStats/mosque_${id}`);
  }

  // Applications sent or received, messages sent or received.
  for (const a of await where('applications', 'imamUid', 'EQUAL', str(uid))) await del(a.name);
  for (const a of await where('applications', 'mosqueOwnerUid', 'EQUAL', str(uid))) await del(a.name);
  for (const m of await where('messages', 'participants', 'ARRAY_CONTAINS', str(uid))) await del(m.name);

  // Community: own posts (with their comments and votes), saved posts and notifications.
  for (const p of await where('posts', 'authorUid', 'EQUAL', str(uid))) {
    const path = p.name.slice(ROOT.length + 1);
    for (const sub of ['comments', 'votes', 'pollVotes']) for (const d of await list(`${path}/${sub}`)) await del(d.name);
    await del(p.name);
  }
  for (const sub of ['saved', 'notifications']) for (const d of await list(`users/${uid}/${sub}`)) await del(d.name);

  await del(`users/${uid}`);

  // Finally the sign-in account.
  if (DRY) {
    console.log('  would delete the Firebase Auth account');
  } else {
    await api('POST', `${AUTH}/v1/projects/${PROJECT}/accounts:delete`, { localId: uid }).catch((err) => {
      if (!/USER_NOT_FOUND/.test(String(err))) throw err;
    });
  }
}

const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 3600 * 1000).toISOString();
const due = await where('users', 'deletionRequestedAt', 'LESS_THAN_OR_EQUAL', str(cutoff));
console.log(`${due.length} account(s) asked for deletion before ${cutoff}${DRY ? ' (dry run)' : ''}.`);

let ok = 0;
let failed = 0;
for (const u of due) {
  const uid = short(u.name);
  console.log(`- ${uid} (requested ${u.fields?.deletionRequestedAt?.stringValue})`);
  try {
    await purgeUser(uid);
    ok++;
  } catch (err) {
    failed++;
    console.error(`  failed: ${err.message}`);
  }
}
console.log(DRY ? `Dry run: ${ok} account(s) would be deleted.` : `Done: ${ok} deleted, ${failed} failed, ${deletedDocs} documents removed.`);
if (env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(
    env.GITHUB_STEP_SUMMARY,
    `### Account deletion\n${ok} account(s) deleted for good, ${failed} failed (grace period ${GRACE_DAYS} days).\n`
  );
}
process.exit(failed ? 1 : 0);
