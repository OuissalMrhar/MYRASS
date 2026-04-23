import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, Observable, Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavLabels, ProfileMenuLabels, SiteLang } from '../../core/visitor-i18n';
import { SiteLanguageService } from '../../core/site-language.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { LoyaltyPointsService, LoyaltyState } from '../../services/loyalty-points.service';
import { UserAuthService, VisitorUser } from '../../services/user-auth.service';
import { CurrencyCode, CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoginOpen = false;
  isRegisterOpen = false;
  isCartOpen = false;
  isMobileMenuOpen = false;
  isLangOpen = false;
  isCurrencyOpen = false;
  /** Menu profil (bulle WM). */
  isProfileMenuOpen = false;
  currentUser$: Observable<VisitorUser | null>;
  cartItemCount$!: Observable<number>;
  favCount$!: Observable<number>;
  readonly loyaltyState$: Observable<LoyaltyState>;
  /** Court pulse CSS sur le badge après un ajout au panier. */
  cartBadgePulse = false;

  readonly shell$: Observable<{ nav: NavLabels; profile: ProfileMenuLabels; lang: SiteLang }>;
  readonly currency$: Observable<CurrencyCode>;
  readonly currencies: CurrencyCode[] = ['MAD', 'USD', 'EUR', 'CNY'];
  readonly langs: SiteLang[] = ['fr', 'en', 'ar'];

  private readonly destroy$ = new Subject<void>();
  private badgePulseTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollRaf = 0;

  constructor(
    private userAuthService: UserAuthService,
    private cart: CartService,
    private favorites: FavoritesService,
    private loyalty: LoyaltyPointsService,
    private router: Router,
    private siteLang: SiteLanguageService,
    private currencyService: CurrencyService,
  ) {
    this.shell$ = combineLatest([
      this.siteLang.navLabels$,
      this.siteLang.profileMenuLabels$,
      this.siteLang.lang$,
    ]).pipe(map(([nav, profile, lang]) => ({ nav, profile, lang })));
    this.currentUser$ = this.userAuthService.currentUser$;
    this.cartItemCount$ = this.cart.lineCount$;
    this.favCount$ = this.favorites.count$;
    this.loyaltyState$ = this.loyalty.state$;
    this.currency$ = this.currencyService.currency$;
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.isProfileMenuOpen = false;
        this.closeMobileMenu();
      });
    this.userAuthService.openLoginPanelRequest$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isLoginOpen = true;
    });
    this.cart.drawerOpenRequest$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isCartOpen = true;
    });
    this.cart.itemAdded$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cartBadgePulse = true;
      if (this.badgePulseTimer != null) clearTimeout(this.badgePulseTimer);
      this.badgePulseTimer = setTimeout(() => {
        this.cartBadgePulse = false;
        this.badgePulseTimer = null;
      }, 550);
    });
  }

  ngOnDestroy(): void {
    if (this.badgePulseTimer != null) clearTimeout(this.badgePulseTimer);
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
    this.destroy$.next();
    this.destroy$.complete();
  }

  cartBadgeText(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  openCart(): void {
    this.isCartOpen = true;
  }

  switchToRegister() {
    this.isLoginOpen = false;
    setTimeout(() => {
      this.isRegisterOpen = true;
    }, 300);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isProfileMenuOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  openLoginFromMobile(): void {
    this.closeMobileMenu();
    this.closeProfileMenu();
    this.isLoginOpen = true;
  }

  openRegisterFromMobile(): void {
    this.closeMobileMenu();
    this.closeProfileMenu();
    this.isRegisterOpen = true;
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    // Sur mobile/tablette, on laisse aussi le clic sur l'utilisateur ouvrir le menu.
    // On ferme le panneau hamburger pour éviter les superpositions.
    this.isMobileMenuOpen = false;
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onGuestUserClick(event: Event): void {
    event.stopPropagation();
    this.isMobileMenuOpen = false;

    // En desktop, on ouvre directement le drawer login (pas de dropdown utilisateur).
    if (typeof window !== 'undefined' && window.innerWidth > 992) {
      this.isProfileMenuOpen = false;
      this.isLoginOpen = true;
      return;
    }

    // Sur mobile/moyen, on ouvre le dropdown pour afficher Connexion/Créer un compte.
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleLang(): void {
    this.isLangOpen = !this.isLangOpen;
    this.isCurrencyOpen = false;
  }

  toggleCurrency(): void {
    this.isCurrencyOpen = !this.isCurrencyOpen;
    this.isLangOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isProfileMenuOpen = false;
    this.isLangOpen = false;
    this.isCurrencyOpen = false;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollRaf) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      if (this.isMobileMenuOpen && window.innerWidth <= 992) {
        this.closeMobileMenu();
      }
      if (this.isProfileMenuOpen) this.isProfileMenuOpen = false;
      if (this.isLangOpen) this.isLangOpen = false;
      if (this.isCurrencyOpen) this.isCurrencyOpen = false;
    });
  }

  get userInitials(): string {
    return this.userAuthService.userInitials;
  }

  logout(event: Event): void {
    event.stopPropagation();
    this.userAuthService.logout();
    this.closeProfileMenu();
  }

  logoutMobile(): void {
    this.userAuthService.logout();
    this.closeMobileMenu();
  }

  setLang(lang: SiteLang): void {
    this.siteLang.setLang(lang);
  }

  setCurrency(code: CurrencyCode): void {
    this.currencyService.setCurrency(code);
  }
}
