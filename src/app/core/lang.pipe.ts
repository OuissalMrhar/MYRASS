import { Pipe, PipeTransform } from '@angular/core';
import { SiteLang, pick } from './visitor-i18n';

/**
 * Pipe utilitaire pour afficher un champ multilingue.
 *
 * Usage dans un template :
 *   {{ produit | lang: 'nom' : currentLang }}
 *   {{ produit | lang: 'description' : currentLang }}
 *
 * L'objet doit avoir les propriétés `nom`, `nomEn`, `nomAr`
 * (ou `description`/`descriptionEn`/`descriptionAr`, etc.)
 */
@Pipe({ name: 'lang', pure: true })
export class LangPipe implements PipeTransform {
  transform(
    obj: object | null | undefined,
    field: string,
    lang: SiteLang,
  ): string {
    if (!obj) return '';
    const r = obj as Record<string, unknown>;
    const fr = r[field] as string | null | undefined;
    const en = r[`${field}En`] as string | null | undefined;
    const ar = r[`${field}Ar`] as string | null | undefined;
    return pick(fr, en, ar, lang);
  }
}
