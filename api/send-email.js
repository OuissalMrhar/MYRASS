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
    // order-rib fields
    orderId,
    lignes,
    total,
  } = req.body || {};

  const k = clean(kind, 32);
  const site = clean(siteName || 'MYRASS', 64) || 'MYRASS';

  const fullName = clean(nomComplet, 120);
  const userEmail = clean(email, 160).toLowerCase();
  const phone = clean(telephone, 60) || 'Non renseigné';
  const msg = clean(message, 8000);
  const partnerType = clean(typePartenariat, 120);

  if (!['contact', 'partnership', 'order-rib'].includes(k)) {
    return json(res, 400, { ok: false, error: 'INVALID_KIND' });
  }

  // ── Traitement email commande + RIB ──────────────────────────
  if (k === 'order-rib') {
    if (!fullName || !isEmail(userEmail)) {
      return json(res, 400, { ok: false, error: 'INVALID_INPUT' });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromDomain = process.env.MAIL_FROM || process.env.SMTP_FROM || 'contact@myrass.com';

    // RIB configurable via variable d'environnement
    const rib            = process.env.MYRASS_RIB           || 'XX XXX XXXXX XXXXXXXXXXX XX';
    const bankName       = process.env.MYRASS_BANK_NAME      || 'Votre banque';
    const accountHolder  = process.env.MYRASS_ACCOUNT_HOLDER || 'MYRASS';
    const iban           = process.env.MYRASS_IBAN           || '';
    const swift          = process.env.MYRASS_SWIFT          || '';

    if (!host || !user || !pass) {
      return json(res, 500, { ok: false, error: 'SMTP_NOT_CONFIGURED' });
    }

    const safeOrderId    = escapeHtml(String(orderId || '—'));
    const safeLignes     = escapeHtml(String(lignes || '—'));
    const safeTotal      = escapeHtml(String(total  || '—'));
    const safeRib        = escapeHtml(rib);
    const safeBankName   = escapeHtml(bankName);
    const safeHolder     = escapeHtml(accountHolder);
    const safeIban       = iban ? `<tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;width:180px;">IBAN</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-family:monospace;">${escapeHtml(iban)}</td></tr>` : '';
    const safeSwift      = swift ? `<tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;">BIC / SWIFT</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-family:monospace;">${escapeHtml(swift)}</td></tr>` : '';

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre commande MYRASS</title></head>
<body style="margin:0;background:#f6f3ef;font-family:Montserrat,Segoe UI,Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ef;padding:24px 0;">
    <tr><td align="center">
      <table width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%;background:#fff;border:1px solid #ece7e2;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:20px 24px;background:#2a1f1a;color:#fffcf1;">
            <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.75;">MYRASS</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px;">Confirmation de commande</div>
          </td>
        </tr>
        <!-- Bonjour -->
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:14px;color:#2a1f1a;">Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
            <p style="margin:0 0 20px;font-size:13px;color:#6b6158;line-height:1.7;">
              Merci pour votre commande ! Pour la finaliser, veuillez effectuer un virement bancaire du montant exact indiqué ci-dessous.
              Votre commande sera préparée et expédiée dès réception de votre paiement.
            </p>
            <!-- Récapitulatif commande -->
            <div style="background:#faf7f3;border:1px solid #ece7e2;border-radius:8px;padding:16px;margin-bottom:20px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a7a6e;font-weight:700;margin-bottom:10px;">Récapitulatif de votre commande</div>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#6b6158;width:160px;">N° commande</td>
                  <td style="padding:6px 0;font-size:13px;color:#2a1f1a;font-weight:600;">#${safeOrderId}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#6b6158;">Articles</td>
                  <td style="padding:6px 0;font-size:13px;color:#2a1f1a;">${safeLignes}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#2a1f1a;font-weight:700;border-top:1px solid #ece7e2;padding-top:10px;">Total à payer</td>
                  <td style="padding:6px 0;font-size:16px;color:#2a1f1a;font-weight:700;border-top:1px solid #ece7e2;padding-top:10px;">${safeTotal} €</td>
                </tr>
              </table>
            </div>
            <!-- Coordonnées bancaires -->
            <div style="background:#f0f7ff;border:1px solid #c5d5e8;border-radius:8px;padding:16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#2a6ea5;font-weight:700;margin-bottom:10px;">
                Coordonnées bancaires pour le virement
              </div>
              <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d0e4f0;border-radius:6px;overflow:hidden;background:#fff;">
                <tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;width:180px;">Titulaire du compte</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-weight:600;">${safeHolder}</td></tr>
                <tr style="background:#f7fbff;"><td style="padding:8px 12px;color:#6b6158;font-size:13px;">RIB</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-family:monospace;font-weight:600;">${safeRib}</td></tr>
                ${safeIban}
                ${safeSwift}
                <tr style="background:#f7fbff;"><td style="padding:8px 12px;color:#6b6158;font-size:13px;">Banque</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;">${safeBankName}</td></tr>
                <tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;">Référence</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-weight:600;">COMMANDE #${safeOrderId}</td></tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#4a6a8a;line-height:1.6;">
                ⚠️ <strong>Important :</strong> Mentionnez impérativement la référence <strong>COMMANDE #${safeOrderId}</strong> dans le libellé de votre virement.
              </p>
            </div>
            <p style="margin:20px 0 0;font-size:13px;color:#6b6158;line-height:1.7;">
              Une question ? Répondez directement à cet email ou contactez-nous via notre site.<br/>
              <strong style="color:#2a1f1a;">L'équipe MYRASS</strong>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:14px 24px;background:#fffcf1;border-top:1px solid #ece7e2;font-size:11px;color:#9e8e84;line-height:1.6;">
            Cet email a été envoyé automatiquement suite à votre commande sur myrass.com
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const transporter = require('nodemailer').createTransport({
      host, port, secure: port === 465, auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        to: userEmail,
        from: `"MYRASS" <${fromDomain}>`,
        subject: `Votre commande MYRASS #${safeOrderId} — Instructions de virement`,
        html,
        headers: { 'X-Form-Type': 'order-rib', 'X-Order-Id': String(orderId || '') },
      });
      return json(res, 200, { ok: true });
    } catch {
      return json(res, 500, { ok: false, error: 'SEND_FAILED' });
    }
  }

  // ── Fin traitement order-rib ─────────────────────────────────

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
  const safeSiteLabel = site.replace(/"/g, "'") || 'SITE MYRASS';
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

