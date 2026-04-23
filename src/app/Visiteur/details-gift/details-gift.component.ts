import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject, forkJoin } from 'rxjs';
import { finalize, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { parseApiError } from '../../core/http-error';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { Gift } from '../../models/gift.model';
import { SiteLanguageService } from '../../core/site-language.service';
import { DETAILS_GIFT_LABELS, DetailsGiftLabels, SiteLang, pick } from '../../core/visitor-i18n';
import { CartLineInput, CartService } from '../../services/cart.service';
import { GiftService } from '../../services/gift.service';
import { FavoritesService } from '../../services/favorites.service';
import { GiftAvisDto, GiftInteractionsService } from '../../services/gift-interactions.service';
import { UserAuthService } from '../../services/user-auth.service';
import { CurrencyService } from '../../services/currency.service';

interface GiftPackProductCardVm {
  id: number;
  name: string;
  price: string;
  imgSrc: string | null;
  quantite: number;
  tailleLabel?: string | null;
}

interface GiftDetailVm {
  id: number;
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  title: string;
  priceLabel: string;
  packImageUrl: string;
}

export interface GiftComment {
  id: string;
  userId: number | null;
  guestKey: string | null;
  productId: number;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
}

@Component({
  selector: 'app-details-gift',
  templateUrl: './details-gift.component.html',
  styleUrls: ['./details-gift.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DetailsGiftComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  loading = true;
  errorMessage = '';
  currentLang: SiteLang = 'fr';
  labels: DetailsGiftLabels = DETAILS_GIFT_LABELS['fr'];
  private rawGift: Gift | null = null;

  gift: GiftDetailVm | null = null;
  packProductCards: GiftPackProductCardVm[] = [];
  selectedMainImageUrl: string | null = null;

  accordionOpenKey: 'details' | 'shipping' | null = 'details';

  // ── Reviews ────────────────────────────────────────────────
  productAvis: GiftAvisDto[] = [];
  productComments: GiftComment[] = [];
  newCommentBody = '';
  avisDraftRating = 5;
  readonly starPickValues = [1, 2, 3, 4, 5] as const;

  feedbackThankYou: { title: string; subtitle: string } | null = null;
  private feedbackThankYouClear?: ReturnType<typeof setTimeout>;

  private readonly guestNameKey = 'myrass-guest-name-v1';
  private readonly guestKeyStorageKey = 'myrass-guest-key-v1';
  guestDisplayName = '';
  guestKey = '';

  reviewsPageIndex = 0;
  readonly reviewsPageSize = 20;

  private readonly visageProductId = 12;
  private readonly visageImage = '/assets/visage.png';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly giftService: GiftService,
    private readonly cartService: CartService,
    private readonly favoritesService: FavoritesService,
    private readonly giftInteractions: GiftInteractionsService,
    private readonly siteLang: SiteLanguageService,
    readonly userAuth: UserAuthService,
    readonly productRoutes: ProductRoutingHelper,
    private readonly currencyService: CurrencyService,
  ) {}

  ngOnInit(): void {
    this.guestDisplayName = this.ensureGuestDisplayName();
    this.guestKey = this.ensureGuestKey();

    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((l) => {
      this.currentLang = l;
      this.labels = DETAILS_GIFT_LABELS[l];
      if (this.rawGift) {
        this.gift = this.mapGiftToVm(this.rawGift, l);
        this.packProductCards = this.buildCards(this.rawGift, l);
      }
    });

    this.currencyService.currency$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.rawGift) {
        this.gift = this.mapGiftToVm(this.rawGift, this.currentLang);
        this.packProductCards = this.buildCards(this.rawGift, this.currentLang);
      }
    });

    this.route.paramMap
      .pipe(
        take(1),
        map((p) => (p.get('id') ?? '').trim()),
        map((raw) => {
          const n = Number(raw);
          if (Number.isFinite(n) && n > 0) return n;
          const m = raw.match(/(\d+)\s*$/);
          return m ? Number(m[1]) : NaN;
        }),
        switchMap((id) => {
          if (!Number.isFinite(id) || id <= 0) {
            this.errorMessage = this.labels.notFound;
            return EMPTY;
          }
          return this.giftService.getById(id);
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (gift: Gift) => {
          this.rawGift = gift;
          this.gift = this.mapGiftToVm(gift, this.currentLang);
          this.packProductCards = this.buildCards(gift, this.currentLang);
          this.selectedMainImageUrl = this.gift.packImageUrl;
          this.reloadReviews(this.gift.id);
        },
        error: () => {
          this.errorMessage = this.labels.loadError;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.feedbackThankYouClear != null) clearTimeout(this.feedbackThankYouClear);
  }

  goHome(): void {
    void this.router.navigate(['/home']);
  }

  toggleAccordion(key: 'details' | 'shipping'): void {
    this.accordionOpenKey = this.accordionOpenKey === key ? null : key;
  }

  get isPackFavorite(): boolean {
    if (this.packProductCards.length === 0) return false;
    return this.packProductCards.every((p) => this.favoritesService.has(p.id));
  }

  addPackToCart(): void {
    if (!this.gift) return;
    const input: CartLineInput = {
      productId: this.gift.id,
      name: this.gift.title,
      quantity: 1,
      priceLabel: this.gift.priceLabel || '$0.00',
      unitPriceDhs: this.cartService.parsePriceLabel(this.gift.priceLabel) ?? undefined,
      imageUrl: this.gift.packImageUrl || undefined,
    };
    this.cartService.addLine(input);
    this.cartService.requestOpenDrawer();
  }

  togglePackFavorites(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.packProductCards.length === 0) return;
    const shouldAdd = !this.isPackFavorite;
    for (const p of this.packProductCards) {
      const has = this.favoritesService.has(p.id);
      if (shouldAdd && has) continue;
      if (!shouldAdd && !has) continue;
      this.favoritesService.toggle({
        productId: p.id,
        name: p.name,
        imageUrl: p.imgSrc ?? undefined,
        priceLabel: p.price,
      });
    }
  }

  selectMainImage(url: string | null): void {
    if (!url?.trim()) return;
    this.selectedMainImageUrl = url.trim();
  }

  scrollToReviews(): void {
    document.getElementById('gift-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Reviews getters ───────────────────────────────────────

  get averageRating(): number {
    const list = this.effectiveAvis;
    if (list.length === 0) return 0;
    const sum = list.reduce((s, a) => s + a.note, 0);
    return Math.round((sum / list.length) * 10) / 10;
  }

  get totalReviews(): number {
    return this.effectiveAvis.length;
  }

  get ratingBreakdownRows(): { stars: number; count: number }[] {
    const list = this.effectiveAvis;
    const byStars = new Map<number, number>();
    for (let s = 1; s <= 5; s++) byStars.set(s, 0);
    for (const a of list) {
      const k = Math.min(5, Math.max(1, Math.round(Number(a.note) || 1)));
      byStars.set(k, (byStars.get(k) ?? 0) + 1);
    }
    return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: byStars.get(stars) ?? 0 }));
  }

  get hasMyComment(): boolean {
    const u = this.userAuth.currentUser;
    if (!this.gift) return false;
    if (u) return this.productComments.some((c) => c.userId === u.id);
    return this.productComments.some((c) => c.userId == null && c.authorName === this.guestDisplayName);
  }

  get ratingStarsDisplay(): { full: number; half: boolean } {
    const n = this.averageRating;
    const full = Math.floor(n);
    const half = n - full >= 0.35 && n - full < 0.95;
    return { full, half };
  }

  get pagedProductComments(): GiftComment[] {
    const start = this.reviewsPageIndex * this.reviewsPageSize;
    return this.productComments.slice(start, start + this.reviewsPageSize);
  }

  get reviewsTotalPages(): number {
    return Math.max(1, Math.ceil(this.productComments.length / this.reviewsPageSize));
  }

  get reviewsPageNumbers(): number[] {
    return Array.from({ length: this.reviewsTotalPages }, (_, i) => i);
  }

  maxCount(): number {
    return Math.max(...this.ratingBreakdownRows.map((r) => r.count), 1);
  }

  starsArray(n: number): number[] {
    return Array.from({ length: Math.min(5, Math.max(0, Math.floor(n))) });
  }

  goReviewsPage(index: number): void {
    const max = this.reviewsTotalPages - 1;
    this.reviewsPageIndex = Math.min(Math.max(0, index), max);
  }

  goReviewsPrev(): void {
    this.goReviewsPage(this.reviewsPageIndex - 1);
  }

  goReviewsNext(): void {
    this.goReviewsPage(this.reviewsPageIndex + 1);
  }

  setAvisDraftRating(n: number): void {
    this.avisDraftRating = Math.min(5, Math.max(1, Math.round(n)));
  }

  onCommentEnter(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.submitReview();
    }
  }

  submitReview(): void {
    const giftId = this.gift?.id;
    if (!giftId) return;
    const body = this.newCommentBody.trim();
    const u = this.userAuth.currentUser;

    if (!u) {
      if (!body) return;
      this.giftInteractions
        .addCommentaireGuest({
          guestKey: this.guestKey,
          guestName: this.guestDisplayName,
          giftId,
          contenu: body,
          note: this.avisDraftRating,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.newCommentBody = '';
            this.showThankYouModal('avis');
            this.reloadReviews(giftId);
          },
          error: (e) => window.alert(parseApiError(e)),
        });
      return;
    }

    this.giftInteractions
      .upsertAvis({ userId: u.id, giftId, note: this.avisDraftRating })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (!body) {
            this.showThankYouModal('avis');
            this.reloadReviews(giftId);
            return;
          }
          const mine = this.productComments.find((c) => c.userId === u.id);
          if (mine) {
            this.newCommentBody = '';
            this.showThankYouModal('noteUpdate');
            this.reloadReviews(giftId);
            return;
          }
          this.giftInteractions
            .addCommentaire({ userId: u.id, giftId, contenu: body })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.newCommentBody = '';
                this.showThankYouModal('avis');
                this.reloadReviews(giftId);
              },
              error: (e) => window.alert(parseApiError(e)),
            });
        },
        error: (e) => window.alert(parseApiError(e)),
      });
  }

  deleteComment(c: GiftComment): void {
    const u = this.userAuth.currentUser;
    const giftId = this.gift?.id;
    if (!u || !giftId || c.userId !== u.id) return;
    if (!window.confirm(this.labels.deleteConfirm)) return;
    this.giftInteractions
      .deleteCommentaire(+c.id, u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.reloadReviews(giftId),
        error: (e) => window.alert(parseApiError(e)),
      });
  }

  closeThankYouModal(): void {
    if (this.feedbackThankYouClear != null) {
      clearTimeout(this.feedbackThankYouClear);
      this.feedbackThankYouClear = undefined;
    }
    this.feedbackThankYou = null;
  }

  continueShoppingAfterThanks(): void {
    this.closeThankYouModal();
  }

  get thankYouContinueLabel(): string {
    return this.labels.continueShopping;
  }

  get thankYouCloseAriaLabel(): string {
    return this.labels.close;
  }

  formatCommentDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const locale = this.currentLang === 'ar' ? 'ar-MA' : this.currentLang === 'en' ? 'en-GB' : 'fr-FR';
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ── Private ───────────────────────────────────────────────

  private get effectiveAvis(): Array<{ note: number }> {
    return (this.productAvis ?? []).map((a) => ({ note: a.note }));
  }

  private reloadReviews(giftId: number): void {
    forkJoin({
      commentaires: this.giftInteractions.getCommentairesByGift(giftId),
      avis: this.giftInteractions.getAvisByGift(giftId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ commentaires, avis }) => {
          if (this.gift?.id !== giftId) return;
          this.reviewsPageIndex = 0;
          this.productAvis = avis;
          const byKey = new Map(
            (avis ?? []).map((a) => [
              a.userId != null ? `u:${a.userId}` : `g:${a.guestKey ?? ''}`,
              a,
            ]),
          );
          this.productComments = commentaires.map((c) => ({
            id: String(c.id),
            userId: c.userId,
            guestKey: c.guestKey ?? null,
            productId: c.giftId,
            authorName:
              (c.nomAuteur || '').trim() ||
              (c.userId != null ? `Client #${c.userId}` : 'Invité'),
            rating:
              byKey.get(c.userId != null ? `u:${c.userId}` : `g:${c.guestKey ?? ''}`)?.note ?? 0,
            body: c.contenu,
            createdAt: c.dateCommentaire,
          }));
          const uid = this.userAuth.currentUser?.id;
          if (uid != null) {
            const mine = avis.find((a) => a.userId === uid);
            this.avisDraftRating = mine ? Math.min(5, Math.max(1, Math.round(mine.note))) : 5;
          } else {
            this.avisDraftRating = 5;
          }
        },
        error: () => {
          this.productAvis = [];
          this.productComments = [];
        },
      });
  }

  private showThankYouModal(kind: 'avis' | 'commentaire' | 'noteUpdate'): void {
    const name = (this.userAuth.currentUser?.nomComplet ?? this.guestDisplayName ?? '').trim();
    const t = this.labels;

    let title: string;
    let subtitle: string;

    if (kind === 'noteUpdate') {
      title = t.thankYouNoteTitle;
      subtitle = t.thankYouNoteSubtitle;
    } else if (kind === 'commentaire') {
      title = t.thankYouCommentTitle;
      subtitle = name
        ? t.thankYouCommentSubtitleWithName.replace('{name}', name)
        : t.thankYouCommentSubtitle;
    } else {
      title = t.thankYouAvisTitle;
      subtitle = name
        ? t.thankYouAvisSubtitleWithName.replace('{name}', name)
        : t.thankYouAvisSubtitle;
    }

    this.feedbackThankYou = { title, subtitle };
    if (this.feedbackThankYouClear != null) clearTimeout(this.feedbackThankYouClear);
    this.feedbackThankYouClear = setTimeout(() => {
      this.feedbackThankYou = null;
      this.feedbackThankYouClear = undefined;
    }, 14_000);
  }

  private ensureGuestDisplayName(): string {
    if (typeof localStorage === 'undefined') return `User${Math.floor(10000 + Math.random() * 90000)}`;
    try {
      const existing = localStorage.getItem(this.guestNameKey);
      if (existing?.trim()) return existing.trim();
      const next = `User${Math.floor(10000 + Math.random() * 90000)}`;
      localStorage.setItem(this.guestNameKey, next);
      return next;
    } catch {
      return `User${Math.floor(10000 + Math.random() * 90000)}`;
    }
  }

  private ensureGuestKey(): string {
    if (typeof localStorage === 'undefined') return this.randomGuestKeyFallback();
    try {
      const existing = localStorage.getItem(this.guestKeyStorageKey);
      if (existing?.trim()) return existing.trim();
      const next =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? (crypto as any).randomUUID()
          : this.randomGuestKeyFallback();
      localStorage.setItem(this.guestKeyStorageKey, next);
      return next;
    } catch {
      return this.randomGuestKeyFallback();
    }
  }

  private randomGuestKeyFallback(): string {
    return `guest-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }

  private mapGiftToVm(gift: Gift, lang: SiteLang = 'fr'): GiftDetailVm {
    const firstImage =
      gift.imageUrl?.trim() ||
      gift.produits?.find((x) => !!x.produitImageUrl)?.produitImageUrl?.trim() ||
      '/assets/pack1.jpeg';
    const priceLabel = gift.prix != null
      ? this.currencyService.format(Number(gift.prix))
      : this.calcPackPriceLabel(gift);
    const nom = pick(gift.nom, gift.nomEn, gift.nomAr, lang);
    const desc = pick(gift.description, gift.descriptionEn, gift.descriptionAr, lang);
    return {
      id: gift.id,
      heroKicker: this.labels.heroKicker,
      heroTitle: nom,
      heroSubtitle: desc,
      heroCtaLabel: this.labels.details,
      title: nom,
      priceLabel,
      packImageUrl: firstImage,
    };
  }

  private calcPackPriceLabel(gift: Gift): string {
    const total = (gift.produits ?? []).reduce((sum, p) => {
      return sum + (Number(p.produitPrix ?? 0) * Number(p.quantite ?? 1));
    }, 0);
    return total > 0 ? this.currencyService.format(total) : '';
  }

  private buildCards(gift: Gift, lang: SiteLang = 'fr'): GiftPackProductCardVm[] {
    return (gift.produits ?? []).map((p) => ({
      id: p.produitId,
      name: pick(p.produitNom, p.produitNomEn, p.produitNomAr, lang) || 'Produit',
      price: typeof p.produitPrix === 'number' ? this.currencyService.format(p.produitPrix) : '',
      imgSrc: this.resolveGiftProductImage(p.produitId, p.produitImageUrl ?? null),
      quantite: Number(p.quantite ?? 1),
      tailleLabel: p.tailleLabel ?? null,
    }));
  }

  private resolveGiftProductImage(produitId: number, url: string | null): string | null {
    if (produitId === this.visageProductId) return this.visageImage;
    if (url && url.trim().length > 0) return url.trim();
    return null;
  }
}
