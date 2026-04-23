export const environment = {
  production: true,
  /** URL publique de l'API Myrass (doit pointer vers ton backend deploye). */
  apiBaseUrl: 'https://your-backend-domain.com',
  /** OAuth Google (Google Identity Services) */
  googleClientId: '',
  /** OAuth Facebook (JS SDK) */
  facebookAppId: '',
  /** EmailJS : toEmail = destinataire des messages (variable du template). */
  emailjs: {
    serviceId: '',
    templateId: '',
    publicKey: '',
    toEmail: '',
  },
};
