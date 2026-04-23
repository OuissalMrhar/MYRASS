export const environment = {
  production: false,
  /** En dev, laisser vide pour utiliser le proxy Angular (voir proxy.conf.json). */
  apiBaseUrl: '',
  /** OAuth Google (Google Identity Services) */
  googleClientId: '',
  /** OAuth Facebook (JS SDK) */
  facebookAppId: '',
  /**
   * EmailJS : renseignez serviceId, templateId, publicKey.
   * toEmail = adresse qui reçoit les messages du formulaire Contact (variable du template EmailJS).
   */
  emailjs: {
    serviceId: '',
    templateId: '',
    publicKey: '',
    toEmail: '',
  },
};
