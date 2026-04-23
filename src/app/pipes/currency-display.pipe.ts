import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../services/currency.service';

/**
 * Impure pipe: converts a MAD amount to the user's selected currency and
 * formats it with the correct symbol. Re-evaluates on every change-detection
 * cycle, so the display updates instantly when the user switches currency.
 *
 * Usage: {{ amountInMad | currencyDisplay }}
 */
@Pipe({ name: 'currencyDisplay', pure: false, standalone: true })
export class CurrencyDisplayPipe implements PipeTransform {
  constructor(private currencyService: CurrencyService) {}

  transform(amountMad: number | null | undefined): string {
    if (amountMad == null) return '';
    return this.currencyService.format(amountMad);
  }
}
