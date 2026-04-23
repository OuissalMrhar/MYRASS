import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, shareReplay } from 'rxjs';
import {
  AUTH_LABELS,
  AuthLabels,
  CART_DRAWER_LABELS,
  CartDrawerLabels,
  CART_PAGE_LABELS,
  CartPageLabels,
  DETAILS_GIFT_LABELS,
  DetailsGiftLabels,
  FAVORITES_LABELS,
  FavoritesLabels,
  FOOTER_LABELS,
  FooterLabels,
  HOME_LABELS,
  HomeLabels,
  NAV_LABELS,
  NavLabels,
  ORDERS_LABELS,
  OrdersLabels,
  PRODUIT_PAGE_LABELS,
  ProduitPageLabels,
  PROFILE_MENU_LABELS,
  ProfileMenuLabels,
  SiteLang,
} from './visitor-i18n';

const STORAGE_KEY = 'myrass-site-lang';

@Injectable({ providedIn: 'root' })
export class SiteLanguageService {
  private readonly langSubject = new BehaviorSubject<SiteLang>(this.readInitial());

  /** Langue courante (observable). */
  readonly lang$: Observable<SiteLang> = this.langSubject.asObservable();

  readonly navLabels$: Observable<NavLabels> = this.lang$.pipe(
    map((l) => NAV_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly footerLabels$: Observable<FooterLabels> = this.lang$.pipe(
    map((l) => FOOTER_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly profileMenuLabels$: Observable<ProfileMenuLabels> = this.lang$.pipe(
    map((l) => PROFILE_MENU_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly homeLabels$: Observable<HomeLabels> = this.lang$.pipe(
    map((l) => HOME_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly cartDrawerLabels$: Observable<CartDrawerLabels> = this.lang$.pipe(
    map((l) => CART_DRAWER_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly cartPageLabels$: Observable<CartPageLabels> = this.lang$.pipe(
    map((l) => CART_PAGE_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly favoritesLabels$: Observable<FavoritesLabels> = this.lang$.pipe(
    map((l) => FAVORITES_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly ordersLabels$: Observable<OrdersLabels> = this.lang$.pipe(
    map((l) => ORDERS_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly authLabels$: Observable<AuthLabels> = this.lang$.pipe(
    map((l) => AUTH_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly produitPageLabels$: Observable<ProduitPageLabels> = this.lang$.pipe(
    map((l) => PRODUIT_PAGE_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly detailsGiftLabels$: Observable<DetailsGiftLabels> = this.lang$.pipe(
    map((l) => DETAILS_GIFT_LABELS[l]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    this.applyDocumentLang(this.langSubject.value);
  }

  get lang(): SiteLang {
    return this.langSubject.value;
  }

  setLang(lang: SiteLang): void {
    if (lang !== 'fr' && lang !== 'en' && lang !== 'ar') return;
    if (this.langSubject.value === lang) return;
    this.langSubject.next(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    this.applyDocumentLang(lang);
  }

  private readInitial(): SiteLang {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'en' || raw === 'fr' || raw === 'ar') return raw;
    } catch {
      /* ignore */
    }
    return 'fr';
  }

  private applyDocumentLang(lang: SiteLang): void {
    if (typeof document === 'undefined') return;
    if (lang === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.lang = lang === 'fr' ? 'fr' : 'en';
      document.documentElement.dir = 'ltr';
    }
  }
}
