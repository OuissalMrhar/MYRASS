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

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailHtml({ site, kindLabel, rows, message }) {
  const safeSite = escapeHtml(site);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  const rowHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #ece7e2;color:#6b6158;font-size:13px;width:220px;vertical-align:top;">
            ${escapeHtml(r.label)}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #ece7e2;color:#2a1f1a;font-size:13px;vertical-align:top;">
            ${escapeHtml(r.value)}
          </td>
        </tr>
      `,
    )
    .join('');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeSite}</title>
  </head>
  <body style="margin:0;background:#f6f3ef;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ef;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #ece7e2;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:18px 22px;background:#2a1f1a;color:#fffcf1;font-family:Montserrat,Segoe UI,Arial,sans-serif;">
                <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.85;">${safeSite}</div>
                <div style="font-size:18px;font-weight:600;margin-top:6px;">${escapeHtml(kindLabel)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 22px;font-family:Montserrat,Segoe UI,Arial,sans-serif;color:#2a1f1a;">
                <p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#6b6158;">
                  Ce message a été envoyé depuis le site <strong style="color:#2a1f1a;">${safeSite}</strong>.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ece7e2;border-radius:10px;overflow:hidden;">
                  ${rowHtml}
                </table>
                <div style="margin-top:16px;padding:14px 14px;border:1px solid #ece7e2;border-radius:10px;background:#faf7f3;">
                  <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a7a6e;font-weight:700;margin-bottom:8px;">Message</div>
                  <div style="font-size:13px;line-height:1.75;color:#2a1f1a;">${safeMessage}</div>
                </div>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:#8a7a6e;">
                  Astuce : utilisez <strong>Répondre</strong> dans votre messagerie pour contacter directement l’expéditeur (Reply-To).
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 22px;background:#fffcf1;border-top:1px solid #ece7e2;font-family:Montserrat,Segoe UI,Arial,sans-serif;color:#8a7a6e;font-size:11px;line-height:1.6;">
                Email automatique — ne pas répondre à cette adresse si votre client mail ignore Reply-To.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

  const kindLabel = k === 'contact' ? 'Demande de contact' : 'Demande de partenariat';
  const html =
    k === 'contact'
      ? buildEmailHtml({
          site,
          kindLabel,
          rows: [
            { label: 'Nom complet', value: fullName },
            { label: 'Email', value: userEmail },
            { label: 'Téléphone', value: phone },
          ],
          message: msg,
        })
      : buildEmailHtml({
          site,
          kindLabel,
          rows: [
            { label: 'Type de partenariat', value: partnerType },
            { label: 'Nom complet', value: fullName },
            { label: 'Email', value: userEmail },
            { label: 'Téléphone', value: phone },
          ],
          message: msg,
        });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // Important:
  // Many mail providers block arbitrary "From". Default is your domain mailbox,
  // with Reply-To set to the user's email (so you can reply directly).
  const safeSiteLabel = site.replace(/"/g, "'") || 'Myrass';
  // If allowUserFrom=true, try to set From to user email (may be blocked by SPF/DMARC).
  // Otherwise always present as the site brand name.
  const from = allowUserFrom ? userEmail : `"${safeSiteLabel}" <${fromDomain}>`;
  const replyTo = `"${fullName.replace(/"/g, "'")}" <${userEmail}>`;

  try {
    await transporter.sendMail({
      to,
      from,
      replyTo,
      subject,
      text,
      html,
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

