/**
 * Data model for Mihrab.
 *
 * Public documents (imams, mosques) contain no phone numbers or e-mails.
 * Contact details live in separate collections (imamContacts, mosqueContacts)
 * that are protected by Firestore security rules.
 */

/** Role used by the UI. "visitor" = not signed in (or onboarding not finished). */
export type UserRole = 'visitor' | 'imam' | 'mosque' | 'admin';

/** Role stored on a user account. Admin rights come from the `admins` collection, never from here. */
export type AccountRole = 'imam' | 'mosque';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AvailabilityState = 'available_now' | 'busy_ramadan' | 'paused';

/** Firestore: users/{uid} */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'facebook' | 'password' | 'phone';
  role: AccountRole;
  /** Set to true by an admin when one of the user's mosques is approved. Only admins can change it. */
  verified?: boolean;
  createdAt: string;
  privacyAcceptedAt: string;
}

export interface ImamExperience {
  title: string;
  place: string;
  /** Years as text, e.g. '2015'. */
  from: string;
  to: string;
}
export interface ImamCertificate {
  name: string;
  issuer: string;
  year: string;
}
export interface PreferredLocation {
  country: string;
  /** City or region; empty = anywhere in the country. */
  area: string;
}
export type LanguageLevel = 'native' | 'excellent' | 'very_good' | 'good' | 'basic';
export interface ImamLanguage {
  name: string;
  level: LanguageLevel;
}
export type MaritalStatus = '' | 'single' | 'married' | 'married_children';

/** Firestore: imams/{id}. For self-registered imams the id equals the owner's uid (one profile per account). */
export interface ImamProfile {
  id: string;
  ownerUid: string;
  name: string;
  age: number;
  /** Current place of residence (city and country). */
  country: string;
  /** Nationality, e.g. «مغربي». Optional for profiles created before it existed. */
  nationality?: string;
  /** What the imam does: «إمام», «خطيب», «محفظ» and/or titles they typed. */
  titles?: string[];
  /** Current job or occupation (free text). */
  currentJob?: string;
  /** Past and present positions, as many as the imam wants. `to` empty = still in this position. */
  experiences?: ImamExperience[];
  /** Certificates, ijazas and diplomas, as many as the imam wants. */
  certificates?: ImamCertificate[];
  /** European countries (optionally a city / region in each) where the imam would like to serve. */
  preferredLocations?: PreferredLocation[];
  /** Languages with a level. The older free-text `languages` field is kept in sync for search. */
  languageList?: ImamLanguage[];
  maritalStatus?: MaritalStatus;
  /** Already lives in a European country (so no immigration procedure is needed). */
  livesInEurope?: boolean;
  hasVisa: 'yes' | 'no';
  visaDetails: string;
  hasCerts: 'yes' | 'no';
  degree: string;
  riwaya: string;
  languages: string;
  germanLevel: string;
  youtubeUrl: string;
  cvText: string;
  availabilityState: AvailabilityState;
  ramadanNote: string;
  availableAfterDate: string;
  /** Small compressed JPEG as a data URL, or '' for the default avatar. */
  photo: string;
  /** Storage paths of uploaded private documents (visible to the owner only). */
  visaFilePath?: string;
  visaFileName?: string;
  certsFilePath?: string;
  certsFileName?: string;
  approvalStatus: ApprovalStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** Firestore: imamContacts/{imamId} — readable by the owner, admins and verified mosques only. */
export interface ImamContact {
  ownerUid: string;
  phone: string;
  whatsapp: string;
  email: string;
}

/** Firestore: mosques/{id} */
export interface MosqueJob {
  id: string;
  ownerUid: string;
  mosqueName: string;
  legalName: string;
  country: string;
  city: string;
  fullAddress: string;
  lookingType: string;
  riwayaRequired: string;
  activeState: 'active' | 'closed';
  requirements: string[];
  details: string;
  salaryAndBenefits: string;
  housingProvided: boolean;
  /** Small compressed JPEG as a data URL (profile picture of the mosque), or '' for the default image. */
  photo?: string;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt?: string;
}

/** Firestore: mosqueContacts/{mosqueId} — readable by the owner, admins and imams with an approved profile. */
export interface MosqueContact {
  ownerUid: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'interview_scheduled' | 'declined';

/** Firestore: applications/{mosqueId}_{imamUid} (the id prevents duplicate applications). */
export interface Application {
  id: string;
  mosqueId: string;
  mosqueOwnerUid: string;
  mosqueName: string;
  imamId: string;
  imamUid: string;
  imamName: string;
  imamCountry: string;
  imamRiwaya: string;
  appliedAt: string;
  status: ApplicationStatus;
  note: string;
}

/** Special receiver id for messages addressed to the platform administration. */
export const ADMIN_INBOX = 'admin';

/** Firestore: messages/{id} */
export interface PlatformMessage {
  id: string;
  /** [senderUid, receiverUid] — used for querying and for security rules. */
  participants: string[];
  senderUid: string;
  senderType: 'imam' | 'mosque' | 'admin';
  senderName: string;
  receiverUid: string;
  receiverType: 'imam' | 'mosque' | 'admin';
  receiverName: string;
  subject: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  category: 'interview' | 'application' | 'admin_alert' | 'direct_inquiry';
  relatedMosqueId?: string;
  relatedImamId?: string;
}

/** Firestore: reports/{id} — only admins can read them. */
export interface ReportItem {
  id: string;
  targetType: 'imam' | 'mosque';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  reporterUid: string;
  reporterRole: 'imam' | 'mosque' | 'admin';
  reportedAt: string;
  status: 'pending' | 'reviewed';
}

/** Firestore: feedback/{id} — "contact the admin / suggestion" form, open to everyone, readable by admins only. */
export type FeedbackKind = 'message' | 'suggestion' | 'problem';
export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  name: string;
  /** Optional, so the admin can reply. */
  email: string;
  message: string;
  /** Set when the sender was signed in. */
  senderUid?: string;
  createdAt: string;
  status: 'new' | 'handled';
}

/** Files picked in the imam form, uploaded on save. */
export interface ImamFormFiles {
  /** A compressed data URL, '' to reset to the default avatar, or undefined to keep the current photo. */
  photo?: string;
  visaFile?: File | null;
  certsFile?: File | null;
}
