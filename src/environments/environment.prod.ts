export const environment = {
  production: true,
  apiBaseUrl: 'https://myrass-backend-production.up.railway.app',
  stripePublishableKey: '',
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
