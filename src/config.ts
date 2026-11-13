// Site-wide settings you may need to change.

/** Public contact e-mail shown in the footer ("تواصل معنا"). Leave empty to hide the link. */
export const CONTACT_EMAIL = '';

/** The statistics page and its links appear once there are at least this many approved imams + mosques. */
export const MIN_ITEMS_FOR_STATS = 5;

/**
 * Optional real photos for the two home-page cards. Put the image in public/ (e.g. public/hero-imams.jpg)
 * and write its file name here. Leave empty to use the drawn illustrations.
 * Use only photos you have the right to use (your own, or free licences such as Unsplash / Pexels).
 */
export const HERO_PHOTOS = {
  imams: 'hero-imams.jpg', // a worshipper raising hands in du'a
  mosques: 'hero-mosques.jpg', // a decorated mihrab
};

/**
 * Optional support (donations). Fill in what you want to show; the "ادعم المنصة" page and links
 * appear only when at least one method is set. Never put anything here you would not publish openly.
 */
export const SUPPORT = {
  /** e.g. 'https://paypal.me/yourname' */
  paypalUrl: '',
  bank: {
    holder: '', // account holder name
    iban: '',
    bic: '',
    bankName: '',
    /** Suggested transfer reference, e.g. 'Spende Aemmah' */
    reference: 'دعم منصة أئمة',
  },
};

export const SUPPORT_ENABLED = Boolean(SUPPORT.paypalUrl || SUPPORT.bank.iban);

/**
 * Sign-in methods shown in the login window. Each one must ALSO be enabled in
 * Firebase Console → Authentication → Sign-in method, otherwise sign-in fails.
 * Phone (SMS) requires the Blaze (pay-as-you-go) plan and costs per SMS.
 */
export const AUTH_METHODS = {
  google: true,
  facebook: true,
  email: true,
  phone: false,
};
