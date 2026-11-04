<div dir="rtl">

# منصة أئمة | Aemmah

منصة للربط بين **الأئمة والقرّاء** و**المساجد والجمعيات الإسلامية** في أوروبا.
الإمام ينشئ ملفاً (السيرة، الرواية، التلاوة، حالة التأشيرة)، والمسجد ينشر إعلاناً، وتراجع الإدارة كل ملف وإعلان قبل نشره.

## المزايا

- تسجيل الدخول بحساب جوجل أو فيسبوك (Firebase Authentication).
- نوعان من الحسابات: **إمام** و**مسجد/جمعية**. ولا يمكن لأي مستخدم أن يمنح نفسه صلاحيات الإدارة.
- مراجعة الإدارة: لا يظهر أي ملف أو إعلان للعموم إلا بعد الموافقة عليه.
- حماية بيانات التواصل:
  - أرقام هواتف الأئمة وبريدهم محفوظة في مجموعة منفصلة لا تقرؤها إلا **المساجد الموثقة** والإدارة.
  - وثائق التأشيرة والشواهد لا يراها إلا صاحبها (والإدارة من لوحة Firebase).
- التقديم على الإعلانات، وطلبات التواصل، وعلبة رسائل داخلية.
- بلاغات تصل إلى الإدارة فقط.
- إحصائيات محسوبة من البيانات الحقيقية.
- صفحة خصوصية، وموافقة صريحة عند التسجيل، وحذف الحساب وكل البيانات بضغطة واحدة (متوافق مع GDPR).
- الخطوط مستضافة محلياً بدل Google Fonts (لأسباب تتعلق بـ GDPR).

## التقنيات

React 19 · TypeScript · Vite · Tailwind CSS 4 · Firebase (Auth, Firestore, Storage) · Recharts

## التشغيل محلياً

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # بناء نسخة الإنتاج في dist/
npm run lint     # فحص الأنواع (TypeScript)
```

## التجربة المحلية على المحاكي

```bash
VITE_FIREBASE_EMULATOR=1 npm run dev
```
يتصل التطبيق بمحاكيات Firebase (Auth على 9099، وFirestore على 8085) بدل المشروع الحقيقي. شغّل المحاكيات قبلها بـ `firebase emulators:start --only firestore,auth`.

## إعداد Firebase (مرة واحدة)

إعدادات المشروع موجودة في `src/firebase-applet-config.json`.
هذه الإعدادات **ليست سراً**: مفتاح Firebase للويب عام بطبيعته، والحماية الفعلية تأتي من ملفي `firestore.rules` و`storage.rules`.

### 1. تفعيل تسجيل الدخول
افتح Firebase Console ثم **Authentication → Sign-in method**:
- فعّل **Google**.
- فعّل **Facebook** إن أردته. يتطلب ذلك إنشاء تطبيق في [Facebook Developers](https://developers.facebook.com) ونسخ App ID وApp Secret. إن لم تفعله، احذف زر فيسبوك من `AuthOnboardingModal.tsx`.
- في **Authentication → Settings → Authorized domains** أضف النطاق الذي ستنشر عليه الموقع.

### 2. نشر قواعد الأمان (أهم خطوة)
```bash
npm install -g firebase-tools
firebase login
npm run deploy:rules
```
ينشر هذا الأمر `firestore.rules` على قاعدة البيانات المحددة في `firebase.json`، و`storage.rules` على Storage.

> ⚠️ إذا واصلت تعديل التطبيق داخل AI Studio، تأكد أنه لا يستبدل `firestore.rules` بنسخة مفتوحة.

### 3. Firebase Storage (اختياري)
يُستخدم فقط لرفع وثائق التأشيرة والشواهد. فعّله من **Storage** في Firebase Console، وقد يتطلب ذلك خطة Blaze.
بدونه يعمل كل شيء آخر، وتظهر رسالة واضحة عند محاولة رفع وثيقة.
الصور الشخصية **لا** تحتاج Storage، فهي تُصغَّر وتُحفظ داخل Firestore.

### 4. تعيين حساب المدير
لا يوجد أي بريد مكتوب في الكود. صلاحية المدير تُمنح هكذا:
1. سجّل الدخول في الموقع مرة واحدة بحسابك.
2. من **Authentication → Users** انسخ الـ **User UID** الخاص بك.
3. من **Firestore Database**، وهي القاعدة التي يبدأ اسمها بـ `ai-studio-mihrab-…`:
   - أنشئ مجموعة اسمها `admins`.
   - أنشئ داخلها وثيقة **رقمها (Document ID) هو الـ UID** الذي نسخته.
   - أضف أي حقل، مثلاً `note: "owner"`.
4. حدّث الصفحة، فتظهر لك **لوحة الإدارة**.

## النشر على الإنترنت

**النشر الحالي: GitHub Pages** على `https://hichamion.github.io/mihrab/` (وبعد إعادة تسمية المستودع إلى `aemmah`: `https://hichamion.github.io/aemmah/`).
كل دفعة (push) إلى `main` تشغّل `.github/workflows/deploy.yml`: فحص الأنواع ثم البناء ثم النشر.
التطبيق يستخدم روابط `#/...`، و`base: './'` (مسار نسبي) في `vite.config.ts`، فيعمل تحت أي اسم للمستودع.

> ملاحظة: ترويسات الأمان في `firebase.json` (مثل `X-Frame-Options`) تُطبَّق على Firebase Hosting فقط، لا على GitHub Pages.
> إذا نقلت الموقع إلى نطاق آخر، عدّل `og:url` و`og:image` و`canonical` في `index.html` و`start_url` في `public/site.webmanifest`.

**بديل: Firebase Hosting**
```bash
npm run deploy
```

**أو Vercel / Netlify:** اربطه بمستودع GitHub. أمر البناء `npm run build`، ومجلد النشر `dist` (واجعل `base` في `vite.config.ts` هو `/`).

في كل الحالات، أضف النطاق الجديد إلى **Authorized domains** في Firebase Authentication.

## نموذج البيانات (Firestore)

| المجموعة | المحتوى | من يقرأ |
|---|---|---|
| `admins/{uid}` | وثيقة فارغة تمنح صلاحية المدير | صاحبها فقط |
| `users/{uid}` | الحساب والدور (`imam` / `mosque`) و`verified` | صاحبها والإدارة |
| `imams/{uid}` | ملف الإمام العام (بدون أرقام) | الجميع بعد الموافقة |
| `imamContacts/{id}` | هاتف الإمام وواتسابه وبريده | صاحبها والإدارة والمساجد الموثقة |
| `mosques/{id}` | إعلان المسجد | الجميع بعد الموافقة |
| `mosqueContacts/{id}` | بيانات تواصل المسجد | المستخدمون المسجلون |
| `applications/{mosqueId}_{imamUid}` | طلبات الترشح | الإمام وصاحب المسجد والإدارة |
| `messages/{id}` | الرسائل | الطرفان فقط |
| `reports/{id}` | البلاغات | الإدارة فقط |

**متى يصبح حساب المسجد موثقاً؟** عندما يوافق المدير على أول إعلان له. عندها تظهر له أرقام الأئمة **المعتمدين** فقط.
ويُسحب التوثيق تلقائياً إذا رُفض أو حُذف آخر إعلان معتمد له.

## بنية المشروع

```
src/
  App.tsx                 الحالة العامة والتنقل (روابط #/...)
  firebase.ts             تهيئة Firebase
  lib/
    auth.ts               تسجيل الدخول وحالة المستخدم والمدير
    db.ts                 كل القراءة والكتابة في Firestore وStorage
    image.ts              تصغير الصور قبل الحفظ
  components/             واجهات المستخدم
  types/index.ts          أنواع البيانات
  utils/helpers.ts        دوال مساعدة (روابط آمنة، تحقق من المدخلات…)
firestore.rules           قواعد أمان قاعدة البيانات
storage.rules             قواعد أمان الملفات
firebase.json             إعدادات النشر
```

## قبل الإطلاق الرسمي

- [ ] املأ بيانات الجهة المسؤولة في `src/components/PrivacyPage.tsx` (المتغير `OPERATOR`).
- [ ] اضبط بريد التواصل `CONTACT_EMAIL` في `src/config.ts` ليظهر رابط «تواصل معنا» في الفوتر.
- [ ] راجع سياسة الخصوصية مع مختص قانوني في بلدك. في ألمانيا يلزم أيضاً **Impressum**.
- [ ] نفّذ `npm run deploy:rules` وتأكد من تطبيق القواعد.
- [ ] عيّن حساب المدير، ثم جرّب التسجيل كإمام ثم كمسجد بحسابين مختلفين.
- [ ] اختر ترخيصاً للمشروع (LICENSE) إن كان المستودع عاماً.
- [ ] أضف `hichamion.github.io` إلى **Authentication → Settings → Authorized domains**.
- [ ] فعّل **Firebase App Check** (reCAPTCHA Enterprise) للحد من الرسائل والبلاغات المزعجة الآلية.

</div>
