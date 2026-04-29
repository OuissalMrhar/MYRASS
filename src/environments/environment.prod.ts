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
    serviceId: 'service_g44qq6c',
    templateId: 'template_contact',
    partnerTemplateId: 'template_partner',
    otpTemplateId: 'template_qj78hm6',
    publicKey: 'ew6ylnM-a0b66Ajxa',
    toEmail: 'myrasscode@gmail.com',
  },
};
