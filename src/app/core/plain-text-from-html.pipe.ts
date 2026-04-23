import { Pipe, PipeTransform } from '@angular/core';

/** Extrait le texte visible d'un fragment HTML (pas de rendu des balises). */
export function plainTextFromHtml(value: string | null | undefined): string {
  if (value == null) return '';
  const s = value.trim();
  if (s === '') return '';
  if (!s.includes('<')) return s;
  try {
    const doc = new DOMParser().parseFromString(s, 'text/html');
    const raw = doc.body?.textContent ?? '';
    return raw.replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n').trim();
  } catch {
    return s;
  }
}

@Pipe({ name: 'plainTextFromHtml' })
export class PlainTextFromHtmlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return plainTextFromHtml(value);
  }
}
