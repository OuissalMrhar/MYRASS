import { HttpErrorResponse } from '@angular/common/http';

function validationMessagesFromBody(body: object): string | null {
  const o = body as Record<string, unknown>;
  const errors = o['errors'];
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const lines: string[] = [];
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        for (const x of v) {
          if (typeof x === 'string' && x.trim()) lines.push(x.trim());
        }
      } else if (typeof v === 'string' && v.trim()) {
        lines.push(v.trim());
      }
    }
    if (lines.length) return lines.join(' ');
  }
  return null;
}

export function parseApiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const msg = (body as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
      const fromVal = validationMessagesFromBody(body);
      if (fromVal) return fromVal;
      const title = (body as { title?: unknown }).title;
      if (typeof title === 'string' && title.trim() && err.status === 400) return title.trim();
    }
    if (err.status === 0) return "Serveur injoignable. Vérifiez que l'API est démarrée.";
    return err.message || `Erreur HTTP ${err.status}`;
  }
  return 'Une erreur est survenue.';
}
