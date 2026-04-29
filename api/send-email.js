const nodemailer = require('nodemailer');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function clean(s, max = 4000) {
  if (s == null) return '';
  return String(s).trim().slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const {
    kind,
    siteName,
    nomComplet,
    email,
    telephone,
    message,
    typePartenariat,
  } = req.body || {};

  const k = clean(kind, 32);
  const site = clean(siteName || 'Myrass', 64) || 'Myrass';

  const fullName = clean(nomComplet, 120);
  const userEmail = clean(email, 160).toLowerCase();
  const phone = clean(telephone, 60) || 'Non renseigné';
  const msg = clean(message, 8000);
  const partnerType = clean(typePartenariat, 120);

  if (!['contact', 'partnership'].includes(k)) {
    return json(res, 400, { ok: false, error: 'INVALID_KIND' });
  }
  if (!fullName || !isEmail(userEmail) || !msg) {
    return json(res, 400, { ok: false, error: 'INVALID_INPUT' });
  }
  if (k === 'partnership' && !partnerType) {
    return json(res, 400, { ok: false, error: 'INVALID_PARTNER_TYPE' });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.MAIL_TO || process.env.SMTP_TO || 'contact@myrass.com';
  const fromDomain = process.env.MAIL_FROM || process.env.SMTP_FROM || 'contact@myrass.com';
  const allowUserFrom = (process.env.ALLOW_USER_FROM || '').toLowerCase() === 'true';

  if (!host || !user || !pass) {
    return json(res, 500, { ok: false, error: 'SMTP_NOT_CONFIGURED' });
  }

  const subject =
    k === 'contact'
      ? `Demande de contact - ${site}`
      : `Demande de partenariat - ${site}`;

  const text =
    k === 'contact'
      ? [
          `Nouveau message provenant du site ${site}`,
          '',
          `Type: Contact`,
          `Nom complet: ${fullName}`,
          `Email: ${userEmail}`,
          `Téléphone: ${phone}`,
          '',
          `Message:`,
          msg,
          '',
        ].join('\n')
      : [
          `Nouvelle demande provenant du site ${site}`,
          '',
          `Type: Partenariat`,
          `Type de partenariat: ${partnerType}`,
          `Nom complet: ${fullName}`,
          `Email: ${userEmail}`,
          `Téléphone: ${phone}`,
          '',
          `Message:`,
          msg,
          '',
        ].join('\n');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // Important:
  // Many mail providers block arbitrary "From". Default is your domain mailbox,
  // with Reply-To set to the user's email (so you can reply directly).
  const from = allowUserFrom ? userEmail : `"${fullName.replace(/"/g, "'")}" <${fromDomain}>`;

  try {
    await transporter.sendMail({
      to,
      from,
      replyTo: userEmail,
      subject,
      text,
      headers: {
        'X-Form-Type': k,
        'X-User-Email': userEmail,
      },
    });
    return json(res, 200, { ok: true });
  } catch (e) {
    return json(res, 500, { ok: false, error: 'SEND_FAILED' });
  }
};

