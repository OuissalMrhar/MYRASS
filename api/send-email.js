const { Resend } = require('resend');

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

/* ── Template générique contact / partenariat ── */
function buildEmailHtml({ site, kindLabel, rows, message }) {
  const safeSite    = escapeHtml(site);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
  const rowHtml = rows
    .map(r => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #ece7e2;color:#6b6158;font-size:13px;width:220px;vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #ece7e2;color:#2a1f1a;font-size:13px;vertical-align:top;">${escapeHtml(r.value)}</td>
      </tr>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${safeSite}</title></head>
<body style="margin:0;background:#f6f3ef;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ef;padding:24px 0;">
    <tr><td align="center">
      <table width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border:1px solid #ece7e2;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:18px 22px;background:#2a1f1a;color:#fffcf1;font-family:Montserrat,Arial,sans-serif;">
          <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;opacity:.85;">${safeSite}</div>
          <div style="font-size:18px;font-weight:600;margin-top:6px;">${escapeHtml(kindLabel)}</div>
        </td></tr>
        <tr><td style="padding:18px 22px;font-family:Montserrat,Arial,sans-serif;color:#2a1f1a;">
          <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ece7e2;border-radius:10px;overflow:hidden;">${rowHtml}</table>
          <div style="margin-top:16px;padding:14px;border:1px solid #ece7e2;border-radius:10px;background:#faf7f3;">
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a7a6e;font-weight:700;margin-bottom:8px;">Message</div>
            <div style="font-size:13px;line-height:1.75;color:#2a1f1a;">${safeMessage}</div>
          </div>
        </td></tr>
        <tr><td style="padding:14px 22px;background:#fffcf1;border-top:1px solid #ece7e2;font-family:Montserrat,Arial,sans-serif;color:#8a7a6e;font-size:11px;">
          Email automatique — répondre à l'expéditeur via Reply-To.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ── Template commande RIB ── */
function buildRibHtml({ fullName, orderId, lignes, total, rib, iban, swift, bankName, accountHolder }) {
  const safeOrderId   = escapeHtml(String(orderId || '—'));
  const safeLignes    = escapeHtml(String(lignes  || '—'));
  const safeTotal     = escapeHtml(String(total   || '—'));
  const safeRib       = escapeHtml(rib);
  const safeBankName  = escapeHtml(bankName);
  const safeHolder    = escapeHtml(accountHolder);
  const ibanRow       = iban  ? `<tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;width:180px;">IBAN</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-family:monospace;">${escapeHtml(iban)}</td></tr>` : '';
  const swiftRow      = swift ? `<tr style="background:#f7fbff;"><td style="padding:8px 12px;color:#6b6158;font-size:13px;">BIC / SWIFT</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-family:monospace;">${escapeHtml(swift)}</td></tr>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre commande MYRASS</title></head>
<body style="margin:0;background:#f6f3ef;font-family:Montserrat,Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ef;padding:24px 0;">
    <tr><td align="center">
      <table width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%;background:#fff;border:1px solid #ece7e2;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px 24px;background:#2a1f1a;color:#fffcf1;">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.75;">MYRASS</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px;">Confirmation de commande</div>
        </td></tr>
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:14px;color:#2a1f1a;">Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin:0 0 20px;font-size:13px;color:#6b6158;line-height:1.7;">
            Merci pour votre commande ! Pour la finaliser, veuillez effectuer un virement bancaire du montant exact indiqué ci-dessous.
            Votre commande sera préparée et expédiée dès réception de votre paiement.
          </p>
          <div style="background:#faf7f3;border:1px solid #ece7e2;border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a7a6e;font-weight:700;margin-bottom:10px;">Récapitulatif de votre commande</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr><td style="padding:6px 0;font-size:13px;color:#6b6158;width:160px;">N° commande</td><td style="padding:6px 0;font-size:13px;color:#2a1f1a;font-weight:600;">#${safeOrderId}</td></tr>
              <tr><td style="padding:6px 0;font-size:13px;color:#6b6158;">Articles</td><td style="padding:6px 0;font-size:13px;color:#2a1f1a;">${safeLignes}</td></tr>
              <tr>
                <td style="padding:10px 0 6px;font-size:14px;color:#2a1f1a;font-weight:700;border-top:1px solid #ece7e2;">Total à payer</td>
                <td style="padding:10px 0 6px;font-size:16px;color:#2a1f1a;font-weight:700;border-top:1px solid #ece7e2;">${safeTotal} €</td>
              </tr>
            </table>
          </div>
          <div style="background:#f0f7ff;border:1px solid #c5d5e8;border-radius:8px;padding:16px;">
            <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#2a6ea5;font-weight:700;margin-bottom:10px;">Coordonnées bancaires pour le virement</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d0e4f0;border-radius:6px;overflow:hidden;background:#fff;">
              <tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;width:180px;">Titulaire du compte</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-weight:600;">${safeHolder}</td></tr>
              <tr style="background:#f7fbff;"><td style="padding:8px 12px;color:#6b6158;font-size:13px;">RIB</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-family:monospace;font-weight:600;">${safeRib}</td></tr>
              ${ibanRow}
              ${swiftRow}
              <tr style="background:#f7fbff;"><td style="padding:8px 12px;color:#6b6158;font-size:13px;">Banque</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;">${safeBankName}</td></tr>
              <tr><td style="padding:8px 12px;color:#6b6158;font-size:13px;">Référence virement</td><td style="padding:8px 12px;font-size:13px;color:#2a1f1a;font-weight:600;">COMMANDE #${safeOrderId}</td></tr>
            </table>
            <p style="margin:12px 0 0;font-size:12px;color:#4a6a8a;line-height:1.6;">
              ⚠️ <strong>Important :</strong> Mentionnez la référence <strong>COMMANDE #${safeOrderId}</strong> dans le libellé de votre virement.
            </p>
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#6b6158;line-height:1.7;">
            Une question ? Répondez à cet email ou contactez-nous via le site.<br/>
            <strong style="color:#2a1f1a;">L'équipe MYRASS</strong>
          </p>
        </td></tr>
        <tr><td style="padding:14px 24px;background:#fffcf1;border-top:1px solid #ece7e2;font-size:11px;color:#9e8e84;line-height:1.6;">
          Email automatique suite à votre commande sur myrass.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ── Template confirmation commande à la livraison ── */
function buildCodHtml({ fullName, orderId, lignes, total, ville, telephone }) {
  const safeOrderId   = escapeHtml(String(orderId || '—'));
  const safeVille     = escapeHtml(String(ville   || '—'));
  const safeTel       = escapeHtml(String(telephone || '—'));
  const safeTotal     = escapeHtml(String(total   || '—'));

  const lignesRows = (lignes || []).map((l, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#faf7f3'};">
      <td style="padding:10px 14px;font-size:13px;color:#2a1f1a;">${escapeHtml(l.nom)}</td>
      <td style="padding:10px 14px;font-size:13px;color:#6b6158;text-align:center;">${escapeHtml(String(l.quantite))}</td>
      <td style="padding:10px 14px;font-size:13px;color:#2a1f1a;text-align:right;font-weight:600;">${escapeHtml(String(l.sousTotal))} €</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmation de commande — MYRASS</title></head>
<body style="margin:0;background:#f6f3ef;font-family:Montserrat,Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ef;padding:24px 0;">
    <tr><td align="center">
      <table width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%;background:#fff;border:1px solid #ece7e2;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="padding:22px 26px;background:#2a1f1a;color:#fffcf1;">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.7;">MYRASS</div>
          <div style="font-size:20px;font-weight:700;margin-top:5px;">Commande confirmée ✓</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:22px 26px;">
          <p style="margin:0 0 10px;font-size:14px;color:#2a1f1a;">Bonjour <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin:0 0 22px;font-size:13px;color:#6b6158;line-height:1.7;">
            Merci pour votre commande ! Vous avez choisi le <strong>paiement à la livraison</strong>.
            Votre colis sera préparé et expédié dans les plus brefs délais.
          </p>

          <!-- Récap commande -->
          <div style="background:#faf7f3;border:1px solid #ece7e2;border-radius:8px;padding:16px 18px;margin-bottom:20px;">
            <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a7a6e;font-weight:700;margin-bottom:12px;">Récapitulatif</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ece7e2;border-radius:6px;overflow:hidden;">
              <thead>
                <tr style="background:#2a1f1a;">
                  <th style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fffcf1;text-align:left;">Produit</th>
                  <th style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fffcf1;text-align:center;">Qté</th>
                  <th style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fffcf1;text-align:right;">Sous-total</th>
                </tr>
              </thead>
              <tbody>${lignesRows}</tbody>
            </table>
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
              <tr>
                <td style="font-size:15px;font-weight:700;color:#2a1f1a;">Total à payer à la livraison</td>
                <td style="font-size:18px;font-weight:700;color:#2a1f1a;text-align:right;">${safeTotal} €</td>
              </tr>
            </table>
          </div>

          <!-- Livraison -->
          <div style="background:#f0f7ff;border:1px solid #c5d5e8;border-radius:8px;padding:16px 18px;margin-bottom:20px;">
            <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#2a6ea5;font-weight:700;margin-bottom:10px;">Informations de livraison</div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr><td style="padding:5px 0;font-size:13px;color:#6b6158;width:140px;">N° commande</td><td style="padding:5px 0;font-size:13px;color:#2a1f1a;font-weight:600;">#${safeOrderId}</td></tr>
              <tr><td style="padding:5px 0;font-size:13px;color:#6b6158;">Ville</td><td style="padding:5px 0;font-size:13px;color:#2a1f1a;">${safeVille}</td></tr>
              <tr><td style="padding:5px 0;font-size:13px;color:#6b6158;">Téléphone</td><td style="padding:5px 0;font-size:13px;color:#2a1f1a;">${safeTel}</td></tr>
              <tr><td style="padding:5px 0;font-size:13px;color:#6b6158;">Délai estimé</td><td style="padding:5px 0;font-size:13px;color:#2a1f1a;font-weight:600;">⏱ 20 jours ouvrés</td></tr>
            </table>
          </div>

          <p style="margin:0;font-size:13px;color:#6b6158;line-height:1.7;">
            Une question ? Répondez à cet email ou contactez-nous via le site.<br/>
            <strong style="color:#2a1f1a;">L'équipe MYRASS</strong>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:14px 26px;background:#fffcf1;border-top:1px solid #ece7e2;font-size:11px;color:#9e8e84;line-height:1.6;">
          Email automatique suite à votre commande sur myrass.com — Paiement à la livraison.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════════ */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json(res, 500, { ok: false, error: 'RESEND_NOT_CONFIGURED' });

  const resend = new Resend(apiKey);

  // Adresse "From" configurable — doit être un domaine vérifié sur Resend
  const fromAddress = process.env.RESEND_FROM || 'MYRASS <contact@myrass.com>';
  // Email admin pour recevoir les contacts/partenariats
  const adminEmail  = process.env.MAIL_TO || 'contact@myrass.com';

  const {
    kind, siteName,
    nomComplet, email, telephone, message, typePartenariat,
    orderId, lignes, total, ville, lignesDetail,
  } = req.body || {};

  const k         = clean(kind, 32);
  const site      = clean(siteName || 'MYRASS', 64) || 'MYRASS';
  const fullName  = clean(nomComplet, 120);
  const userEmail = clean(email, 160).toLowerCase();
  const phone     = clean(telephone, 60) || 'Non renseigné';
  const msg       = clean(message, 8000);
  const partType  = clean(typePartenariat, 120);

  if (!['contact', 'partnership', 'order-rib', 'order-cod'].includes(k)) {
    return json(res, 400, { ok: false, error: 'INVALID_KIND' });
  }

  /* ── Email commande + instructions RIB ── */
  if (k === 'order-rib') {
    if (!fullName || !isEmail(userEmail)) {
      return json(res, 400, { ok: false, error: 'INVALID_INPUT' });
    }

    const rib           = process.env.MYRASS_RIB           || 'RIB NON CONFIGURÉ';
    const iban          = process.env.MYRASS_IBAN           || '';
    const swift         = process.env.MYRASS_SWIFT          || '';
    const bankName      = process.env.MYRASS_BANK_NAME      || 'Votre banque';
    const accountHolder = process.env.MYRASS_ACCOUNT_HOLDER || 'MYRASS';

    const html = buildRibHtml({ fullName, orderId, lignes, total, rib, iban, swift, bankName, accountHolder });

    try {
      await resend.emails.send({
        from:    fromAddress,
        to:      [userEmail],
        subject: `Votre commande MYRASS #${orderId || '?'} — Instructions de virement`,
        html,
      });
      return json(res, 200, { ok: true });
    } catch (err) {
      console.error('[send-email] SEND_FAILED:', err?.message || err);
      return json(res, 500, { ok: false, error: 'SEND_FAILED', detail: err?.message || String(err) });
    }
  }

  /* ── Confirmation commande paiement à la livraison ── */
  if (k === 'order-cod') {
    if (!fullName || !isEmail(userEmail)) {
      return json(res, 400, { ok: false, error: 'INVALID_INPUT' });
    }

    const html = buildCodHtml({
      fullName,
      orderId,
      lignes: Array.isArray(lignesDetail) ? lignesDetail : [],
      total: clean(String(total || ''), 20),
      ville: clean(String(ville || ''), 100),
      telephone: clean(String(telephone || ''), 60),
    });

    try {
      await resend.emails.send({
        from:    fromAddress,
        to:      [userEmail],
        subject: `Votre commande MYRASS #${orderId || '?'} — Confirmation paiement à la livraison`,
        html,
      });
      return json(res, 200, { ok: true });
    } catch (err) {
      console.error('[send-email] SEND_FAILED:', err?.message || err);
      return json(res, 500, { ok: false, error: 'SEND_FAILED', detail: err?.message || String(err) });
    }
  }

  /* ── Contact / Partenariat — envoi à l'admin ── */
  if (!fullName || !isEmail(userEmail) || !msg) {
    return json(res, 400, { ok: false, error: 'INVALID_INPUT' });
  }
  if (k === 'partnership' && !partType) {
    return json(res, 400, { ok: false, error: 'INVALID_PARTNER_TYPE' });
  }

  const isContact  = k === 'contact';
  const kindLabel  = isContact ? 'Demande de contact' : 'Demande de partenariat';
  const subject    = isContact
    ? `Nouveau contact — ${site}`
    : `Demande de partenariat — ${site}`;

  const rows = isContact
    ? [{ label: 'Nom complet', value: fullName }, { label: 'Email', value: userEmail }, { label: 'Téléphone', value: phone }]
    : [{ label: 'Type', value: partType }, { label: 'Nom complet', value: fullName }, { label: 'Email', value: userEmail }, { label: 'Téléphone', value: phone }];

  const html = buildEmailHtml({ site, kindLabel, rows, message: msg });

  try {
    await resend.emails.send({
      from:     fromAddress,
      to:       [adminEmail],
      reply_to: `${fullName.replace(/"/g, "'")} <${userEmail}>`,
      subject,
      html,
    });
    return json(res, 200, { ok: true });
  } catch {
    return json(res, 500, { ok: false, error: 'SEND_FAILED' });
  }
};
