import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { SiteLanguageService } from '../../core/site-language.service';
import { FavoritesLabels } from '../../core/visitor-i18n';
import { FavoriteItem, FavoritesService } from '../../services/favorites.service';
import { CartService } from '../../services/cart.service';
import { UserAuthService, VisitorUser } from '../../services/user-auth.service';

/** Aligné sur le SCSS `.wishlist-grid` — mobile 2 colonnes × 4 lignes. */
const WISHLIST_MOBILE_MAX_PX = 720;
const WISHLIST_MOBILE_PAGE_SIZE = 8;

@Component({
  selector: 'app-favorites-page',
  templateUrl: './favorites-page.component.html',
  styleUrls: ['./favorites-page.component.scss'],
})
export class FavoritesPageComponent implements OnInit, OnDestroy {
  readonly items$: Observable<FavoriteItem[]>;
  readonly currentUser$: Observable<VisitorUser | null>;
  readonly labels$: Observable<FavoritesLabels>;

  @ViewChild('wishlistGridAnchor') wishlistGridAnchor?: ElementRef<HTMLElement>;

  /** Vue mobile : pagination 8 articles par page. */
  isMobile = typeof window !== 'undefined' && window.matchMedia(`(max-width: ${WISHLIST_MOBILE_MAX_PX}px)`).matches;
  currentPage = 1;

  private mq?: MediaQueryList;
  private readonly mqHandler = (): void => {
    const next = this.mq?.matches ?? false;
    if (next !== this.isMobile) {
      this.isMobile = next;
      this.currentPage = 1;
    }
  };

  /** Tracks which productIds were just added to cart (for feedback). */
  addedToCartIds = new Set<number>();

  constructor(
    private readonly favorites: FavoritesService,
    private readonly cart: CartService,
    private readonly userAuth: UserAuthService,
    private readonly siteLang: SiteLanguageService,
    readonly productRoutes: ProductRoutingHelper,
  ) {
    this.items$ = this.favorites.items$;
    this.currentUser$ = this.userAuth.currentUser$;
    this.labels$ = this.siteLang.favoritesLabels$;

    this.items$.pipe(takeUntilDestroyed()).subscribe((items) => {
      const tp = this.totalPages(items);
      if (this.currentPage > tp) {
        this.currentPage = Math.max(1, tp);
      }
    });
  }

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    this.mq = window.matchMedia(`(max-width: ${WISHLIST_MOBILE_MAX_PX}px)`);
    this.isMobile = this.mq.matches;
    this.mq.addEventListener('change', this.mqHandler);
  }

  ngOnDestroy(): void {
    this.mq?.removeEventListener('change', this.mqHandler);
  }

  openLoginPanel(): void {
    this.userAuth.requestOpenLoginPanel();
  }

  removeFavorite(item: FavoriteItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.removeOne(item.productId);
  }

  addToCart(item: FavoriteItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.cart.addLine({
      productId: item.productId,
      name: item.name,
      quantity: 1,
      priceLabel: item.priceLabel ?? '',
      imageUrl: item.imageUrl,
      categoryLabel: item.categorieNom,
      catalogueLabel: item.catalogueNom,
      typeLabel: item.typeProduitNom,
    });
    this.addedToCartIds.add(item.productId);
    setTimeout(() => this.addedToCartIds.delete(item.productId), 2000);
  }

  isInCart(productId: number): boolean {
    return this.addedToCartIds.has(productId);
  }

  trackByProductId(_: number, item: FavoriteItem): number {
    return item.productId;
  }

  /** Catégorie · catalogue · type sur une seule ligne. */
  taxonomyLine(item: FavoriteItem): string | null {
    const parts = [item.categorieNom, item.catalogueNom, item.typeProduitNom]
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0);
    if (parts.length === 0) return null;
    return parts.join(' · ');
  }

  /** Sous-titre carte : volume préféré, sinon taxonomie. */
  subtitleFor(item: FavoriteItem): string | null {
    const vol = typeof item.volumeLabel === 'string' ? item.volumeLabel.trim() : '';
    if (vol.length > 0) return vol;
    return this.taxonomyLine(item);
  }

  pagedItems(items: FavoriteItem[]): FavoriteItem[] {
    if (!this.isMobile) {
      return items;
    }
    const start = (this.currentPage - 1) * WISHLIST_MOBILE_PAGE_SIZE;
    return items.slice(start, start + WISHLIST_MOBILE_PAGE_SIZE);
  }

  totalPages(items: FavoriteItem[]): number {
    if (!this.isMobile || items.length === 0) {
      return 1;
    }
    return Math.ceil(items.length / WISHLIST_MOBILE_PAGE_SIZE);
  }

  showPagination(items: FavoriteItem[]): boolean {
    return this.isMobile && items.length > WISHLIST_MOBILE_PAGE_SIZE;
  }

  goPrev(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollGridIntoView();
    }
  }

  goNext(items: FavoriteItem[]): void {
    const tp = this.totalPages(items);
    if (this.currentPage < tp) {
      this.currentPage++;
      this.scrollGridIntoView();
    }
  }

  private scrollGridIntoView(): void {
    queueMicrotask(() => {
      this.wishlistGridAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
