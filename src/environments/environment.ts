export const environment = {
  production: false,
  /** En dev, laisser vide pour utiliser le proxy Angular (voir proxy.conf.json). */
  apiBaseUrl: '',
  stripePublishableKey: '',
  /** OAuth Google (Google Identity Services) */
  googleClientId: '',
  /** OAuth Facebook (JS SDK) */
  facebookAppId: '',
  /**
   * EmailJS : renseignez serviceId, templateId, publicKey.
   * toEmail = adresse qui reçoit les messages du formulaire Contact (variable du template EmailJS).
   */
  emailjs: {
    serviceId: 'service_g44qq6c',
    templateId: '',
    otpTemplateId: 'template_qj78hm6',
    publicKey: 'ew6ylnM-a0b66Ajxa',
    toEmail: 'myrasscode@gmail.com',
  },
};
