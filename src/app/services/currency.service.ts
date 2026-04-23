import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of } from 'rxjs';

export type CurrencyCode = 'MAD' | 'USD' | 'EUR' | 'CNY';

const STORAGE_KEY = 'myrass_currency';
const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  MAD: 'DH',
  USD: '$',
  EUR: '€',
  CNY: '¥',
};

// Fallback rates (EUR → target), used if API is unavailable
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  MAD: 10.8,
  USD: 1.08,
  CNY: 7.75,
};

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private _rates: Record<string, number> = { ...FALLBACK_RATES };

  private readonly _currency$ = new BehaviorSubject<CurrencyCode>(this.loadSaved());
  readonly currency$ = this._currency$.asObservable();

  get selectedCurrency(): CurrencyCode {
    return this._currency$.value;
  }

  constructor(private http: HttpClient) {
    this.fetchRates();
  }

  setCurrency(code: CurrencyCode): void {
    this._currency$.next(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  }

  /** Convert EUR amount to selected currency and return formatted string. */
  format(amountEur: number, currency?: CurrencyCode): string {
    const cur = currency ?? this._currency$.value;
    const rate = this._rates[cur] ?? FALLBACK_RATES[cur] ?? 1;
    const converted = amountEur * rate;
    const symbol = CURRENCY_SYMBOLS[cur];
    if (cur === 'MAD') return `${converted.toFixed(2)} DH`;
    return `${symbol}${converted.toFixed(2)}`;
  }

  /** Format a price range (min-max) in EUR to selected currency. */
  formatRange(minEur: number, maxEur: number, currency?: CurrencyCode): string {
    const cur = currency ?? this._currency$.value;
    const rate = this._rates[cur] ?? FALLBACK_RATES[cur] ?? 1;
    const minC = minEur * rate;
    const maxC = maxEur * rate;
    const symbol = CURRENCY_SYMBOLS[cur];
    const label = (v: number) => cur === 'MAD' ? `${v.toFixed(2)} DH` : `${symbol}${v.toFixed(2)}`;
    if (Math.abs(maxC - minC) > 0.005) return `${label(minC)} - ${label(maxC)}`;
    return label(minC);
  }

  private loadSaved(): CurrencyCode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved && saved in CURRENCY_SYMBOLS) return saved;
    } catch { /* ignore */ }
    return DEFAULT_CURRENCY;
  }

  private fetchRates(): void {
    // Fetch live rates based on EUR (prices stored in EUR)
    this.http
      .get<{ rates: Record<string, number> }>('https://open.er-api.com/v6/latest/EUR')
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.rates) {
          this._rates = { EUR: 1, ...res.rates };
        }
      });
  }
}
