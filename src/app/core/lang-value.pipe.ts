import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { SiteLang } from './visitor-i18n';
import { SiteLanguageService } from './site-language.service';

/**
 * Choisit la bonne langue pour une valeur (BDD ou UI).
 * Usage: {{ frValue | langValue: enValue : arValue }}
 * Si la langue est AR et arValue est vide, on tombe en fallback FR.
 * Si la langue est EN et enValue est vide, on tombe en fallback FR.
 */
@Pipe({ name: 'langValue', pure: false })
export class LangValuePipe implements PipeTransform {
  private currentLang: SiteLang = 'fr';
  private sub?: { unsubscribe(): void };

  constructor(
    private readonly lang: SiteLanguageService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.sub = this.lang.lang$.subscribe((l) => {
      this.currentLang = l;
      this.cdr.markForCheck();
    });
  }

  transform(frValue: string | null | undefined, enValue?: string | null, arValue?: string | null): string {
    const fr = frValue ?? '';
    if (this.currentLang === 'ar') {
      const v = typeof arValue === 'string' ? arValue.trim() : '';
      return v || fr;
    }
    if (this.currentLang === 'en') {
      const v = typeof enValue === 'string' ? enValue.trim() : '';
      return v || fr;
    }
    return fr;
  }
}
