/**
 * Avant `ng build` sur Vercel : génère environment.prod.ts depuis les variables d’environnement.
 * Vercel → Settings → Environment Variables :
 *   MYRASS_API_BASE_URL = https://ton-api.exemple.com   (sans slash final)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');

const onVercel = process.env.VERCEL === '1';
const hasApiOverride = (process.env.MYRASS_API_BASE_URL ?? '').trim().length > 0;

/** Hors CI Vercel : sans URL explicite, on ne touche pas à environment.prod.ts (évite d’écraser le fichier en local). */
if (!onVercel && !hasApiOverride) {
  console.log('[vercel-env] ignoré — utilise environment.prod.ts tel quel (définis MYRASS_API_BASE_URL pour injecter).');
  process.exit(0);
}

const apiBase = (process.env.MYRASS_API_BASE_URL ?? '').trim().replace(/\/$/, '');
const googleClientId = (process.env.MYRASS_GOOGLE_CLIENT_ID ?? '').trim();
const facebookAppId = (process.env.MYRASS_FACEBOOK_APP_ID ?? '').trim();
const emailjs = {
  serviceId: (process.env.MYRASS_EMAILJS_SERVICE_ID ?? '').trim(),
  templateId: (process.env.MYRASS_EMAILJS_TEMPLATE_ID ?? '').trim(),
  publicKey: (process.env.MYRASS_EMAILJS_PUBLIC_KEY ?? '').trim(),
  toEmail: (process.env.MYRASS_EMAILJS_TO_EMAIL ?? '').trim(),
};

const ts = `/* Généré par scripts/vercel-env.mjs au build (Vercel ou build:vercel). */
export const environment = {
  production: true,
  apiBaseUrl: ${JSON.stringify(apiBase)},
  googleClientId: ${JSON.stringify(googleClientId)},
  facebookAppId: ${JSON.stringify(facebookAppId)},
  emailjs: {
    serviceId: ${JSON.stringify(emailjs.serviceId)},
    templateId: ${JSON.stringify(emailjs.templateId)},
    publicKey: ${JSON.stringify(emailjs.publicKey)},
    toEmail: ${JSON.stringify(emailjs.toEmail)},
  },
};
`;

fs.writeFileSync(outFile, ts, 'utf8');

if (!apiBase && onVercel) {
  console.warn(
    '[vercel-env] MYRASS_API_BASE_URL est vide : ajoute la variable dans Vercel → Environment Variables.',
  );
} else {
  console.log('[vercel-env] environment.prod.ts → apiBaseUrl =', apiBase || '(vide)');
}
