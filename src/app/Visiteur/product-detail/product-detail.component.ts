import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';
import { Produit } from '../../models/produit.model';
import { TypeProduit } from '../../models/type-produit.model';
import { ProduitService } from '../../services/produit.service';
import { TypeProduitService } from '../../services/type-produit.service';
import { buildProductSlug, parseProductIdFromSlugParam } from '../../core/product-slug';
import { parseApiError } from '../../core/http-error';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { plainTextFromHtml } from '../../core/plain-text-from-html.pipe';
import { SiteLanguageService } from '../../core/site-language.service';
import { CartLineInput, CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { AvisDto, InteractionsService } from '../../services/interactions.service';
import { UserAuthService } from '../../services/user-auth.service';
import { STATIC_PRODUCT_IMAGE_URL } from '../../core/static-product-image';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import { CurrencyService } from '../../services/currency.service';

/** Une carte d'histoire (texte BDD + image type / produit). */
export interface HistoryCardVm {
  imageUrl: string | null;
  /** Si défini, remplace le libellé alt générique (ex. id 8 : contact, Main, fin). */
  imageAlt?: string;
  fallbackClass: string;
  kicker: string;
  headline: string;
  body: string;
}

export interface RelatedProduct {
  id: number;
  name: string;
  set: string;
  price: string;
  imgSrc: string;
}

export interface TailleOption {
  id: number;
  label: string;
  prix: number;
  stock: number;
}

/** Entrée du fil d'Ariane produit (liens vers l'accueil ou la liste filtrée). */
export interface ProductBreadcrumbItem {
  label: string;
  routerLink: string[];
  queryParams?: Record<string, number>;
}

/** Commentaire produit pour l'affichage (API + note avis par utilisateur). */
export interface ProductComment {
  id: string;
  userId: number | null;
  guestKey: string | null;
  productId: number;
  authorName: string;
  rating: number;
  body: string;
  /** ISO 8601 */
  createdAt: string;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cancelLoad$ = new Subject<void>();
  private scrollRevealObserver?: IntersectionObserver;
  private allProduits: Produit[] = [];
  @ViewChild('thumbnailsRow') thumbnailsRowRef?: ElementRef<HTMLDivElement>;
  @ViewChild('footerRef', { read: ElementRef }) footerRef?: ElementRef<HTMLElement>;

  product: Produit | null = null;
  /** Variante transmise via ?variant= (ex. depuis le panier). Mise à jour réactivement. */
  private pendingVariant: string | null = null;
  /** Type chargé pour histoire + visuels (API `/api/types-produit/:id`). */
  typeProduitDetail: TypeProduit | null = null;
  /** 1 à 3 cartes : uniquement le texte `histoire` du type (BDD), découpé si besoin. */
  historyCards: HistoryCardVm[] = [];
  loading = true;
  errorMessage: string | null = null;
  imageUrls: string[] = [];
  /** Texte alternatif par image (légende BDD ou nom produit). */
  imageAlts: string[] = [];
  selectedThumb = 0;
  /** Court fondu / zoom léger sur la grande image au changement de vignette. */
  mainImageTransitioning = false;
  selectedTailleIndex = 0;
  private mainImageTransitionTimer?: ReturnType<typeof setTimeout>;
  /** Décalage depuis le bas du viewport (px) pour rester au-dessus du footer. */
  mobilePurchaseBarBottomPx = 0;
  /** Conservé pour compatibilité template : la barre reste toujours en `fixed`. */
  mobilePurchaseBarPageDocked = false;
  /** Bouton flottant « retour en haut ». */
  showBackToTopFab = false;
  /** Après « J'achète », la barre affiche − quantité + à la place du CTA. */
  mobilePurchaseBarQuantityMode = false;
  private mobileDockRaf = 0;
  /**
   * Produit 8 — galerie héros / vignettes : Moyenne1…7 (assets). Uniquement la section « Histoire du produit »
   * utilise en plus contact.png, Main.png, fin.png pour les 3 cartes (voir mergeVrHistoryImageUrls).
   */
  private readonly moyenneGalleryProductId = 8;
  /** Visuels réservés à la bande « Histoire » (pas la galerie principale). */
  private readonly mergeVrHistoryImageUrls = [
    '/assets/contact.png',
    '/assets/Main.png',
    '/assets/fin.png',
  ];
  private readonly moyenne1Image = '/assets/Moyenne1.png';
  /** Produit 5 : raffin.jpeg. */
  private readonly raffinProductId = 5;
  private readonly raffinImage = '/assets/raffin.jpeg';
  /** Produit 9 : image locale Naturel.jpeg. */
  private readonly naturelProductId = 9;
  private readonly naturelImage = '/assets/Naturel.jpeg';
  /** Produit 10 : image locale `Miel` (fichier dans `src/assets/`). */
  private readonly mielProductId = 10;
  private readonly mielImage = '/assets/Miel.png';
  /** Produit 11 : image locale `Amlou`. */
  private readonly amlouProductId = 11;
  private readonly amlouImage = '/assets/Amlou.png';
  /** Produit 12 : image locale `visage.png`. */
  private readonly visageProductId = 12;
  private readonly visageImage = '/assets/visage.png';

  relatedProducts: RelatedProduct[] = [];

  quantity = 1;

  /** Notes agrégées (table Avis, une entrée par utilisateur et produit). */
  productAvis: AvisDto[] = [];
  /** Commentaires texte (table Commentaires). */
  productComments: ProductComment[] = [];
  newCommentBody = '';
  /** Note pour le bloc « votre avis » (étoiles seules, enregistrement BDD Avis). */
  avisDraftRating = 5;
  readonly starPickValues = [1, 2, 3, 4, 5] as const;

  /** Modale de remerciement après avis / commentaire. */
  feedbackThankYou: { title: string; subtitle: string } | null = null;
  private feedbackThankYouClear?: ReturnType<typeof setTimeout>;

  private readonly guestNameKey = 'myrass-guest-name-v1';
  private readonly guestKeyStorageKey = 'myrass-guest-key-v1';
  guestDisplayName = '';
  guestKey = '';

  descriptionExpanded = false;
  shippingExpanded = false;
  private readonly descriptionExcerptMaxChars = 280;

  /** Pagination liste des commentaires affichés (déclenchée au-delà de 20) */
  reviewsPageIndex = 0;
  readonly reviewsPageSize = 20;

  get shippingSectionTitle(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'التوصيل' : l === 'en' ? 'Shipping' : 'Livraison';
  }

  get historySectionTitle(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'تاريخ المنتج' : l === 'en' ? 'Product story' : 'Histoire du produit';
  }

  get descriptionSectionTitle(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'الوصف' : l === 'en' ? 'Description' : 'Description';
  }

  get seeMoreLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'عرض المزيد' : l === 'en' ? 'Read less' : 'Voir moins';
  }

  get noDescriptionLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'لا يوجد وصف لهذا المنتج.' : l === 'en' ? 'No description for this product.' : 'Aucune description pour ce produit.';
  }

  get buyLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'أشتري' : l === 'en' ? 'Buy' : "J'achète";
  }

  get reviewsLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'تقييم' : l === 'en' ? 'reviews' : 'avis';
  }

  get sizevolumeLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'الحجم / المقاس' : l === 'en' ? 'Size / volume' : 'Taille / volume';
  }

  get relatedKickerLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'اقتراحات مختارة' : l === 'en' ? 'Refined Suggestions' : 'Suggestions affinées';
  }

  get relatedTitleLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'قد يعجبك أيضاً' : l === 'en' ? 'YOU MAY ALSO LIKE' : 'VOUS AIMEREZ AUSSI';
  }

  get commentsLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'التعليقات' : l === 'en' ? 'Comments' : 'Commentaires';
  }

  get reviewsPublishedLabel(): string {
    const n = this.productComments.length;
    const l = this.siteLang.lang;
    if (l === 'ar') return `${n} تقييم منشور`;
    if (l === 'en') return `${n} review${n > 1 ? 's' : ''} published`;
    return `${n} avis publié${n > 1 ? 's' : ''}`;
  }

  get noReviewsLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'لا توجد تقييمات بعد — كن الأول.' : l === 'en' ? 'No reviews yet — be the first.' : "Pas encore d'avis — soyez le premier.";
  }

  get yourReviewLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'تقييمك' : l === 'en' ? 'Your review' : 'Votre avis';
  }

  get reviewHintLoggedInLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'اختر تقييماً، ثم أضف تعليقاً إن شئت.' : l === 'en' ? 'Choose a rating, then add a comment if you wish.' : 'Choisissez une note, puis ajoutez un commentaire si vous le souhaitez.';
  }

  get reviewHintGuestLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'زائر: سيظهر اسمك كـ' : l === 'en' ? 'Guest: your display name will be' : 'Invité : votre pseudo sera';
  }

  get commentLabelStr(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'تعليق (اختياري إذا كنت مسجلاً)' : l === 'en' ? 'Comment (optional if logged in)' : 'Commentaire (optionnel si connecté)';
  }

  get commentPlaceholderLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'شارك تجربتك…' : l === 'en' ? 'Share your experience…' : 'Partagez votre expérience…';
  }

  get alreadyCommentedLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'لقد نشرت تعليقاً بالفعل. يمكنك دائماً تعديل تقييمك أعلاه.' : l === 'en' ? 'You have already posted a comment. You can still update your rating above.' : 'Vous avez déjà publié un commentaire. Vous pouvez toujours modifier votre note ci-dessus.';
  }

  get submitBtnLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'نشر' : l === 'en' ? 'Submit' : 'Publier';
  }

  get deleteBtnLabel(): string {
    const l = this.siteLang.lang;
    return l === 'ar' ? 'حذف' : l === 'en' ? 'Delete' : 'Supprimer';
  }

  /** Texte affiché sous « Livraison » (aligné sur la langue du site). */
  get shippingPolicyParagraphs(): string[] {
    const l = this.siteLang.lang;
    if (l === 'ar') {
      return [
        'نوصّل داخل المغرب وخارجه. قد تتفاوت مواعيد التحضير؛ ستصلك رابط التتبع فور إرسال طردك.',
        'تُعرض رسوم التوصيل بوضوح على صفحة السلة قبل الدفع، حسب عنوانك وطريقة الإرسال.',
      ];
    }
    if (l === 'en') {
      return [
        'We ship across Morocco and internationally. Processing time may vary; you receive a tracking link as soon as your parcel is dispatched.',
        'Shipping fees are shown clearly on the cart page before you pay, according to your address and delivery option.',
      ];
    }
    return [
      "Nous livrons au Maroc et à l'international. Les délais de préparation peuvent varier ; un lien de suivi vous est envoyé dès l'expédition de votre colis.",
      "Les frais de livraison sont indiqués clairement sur la page panier avant le paiement, en fonction de votre adresse et du mode d'envoi.",
    ];
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produitService: ProduitService,
    private typeProduitService: TypeProduitService,
    private cartService: CartService,
    private favoritesService: FavoritesService,
    private interactions: InteractionsService,
    readonly userAuth: UserAuthService,
    readonly productLink: ProductRoutingHelper,
    private readonly siteLang: SiteLanguageService,
    private readonly recentlyViewed: RecentlyViewedService,
    private readonly currencyService: CurrencyService,
  ) {}

  private pickText(
    fr: string | null | undefined,
    en: string | null | undefined,
    ar: string | null | undefined = null,
  ): string {
    const lang = this.siteLang.lang;
    if (lang === 'ar') { const v = (ar ?? '').trim(); return v || (fr ?? '').trim(); }
    if (lang === 'en') { const v = (en ?? '').trim(); return v || (fr ?? '').trim(); }
    return (fr ?? '').trim();
  }

  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize', ['$event'])
  onWindowScrollOrResize(): void {
    this.scheduleMobilePurchaseBarDock();
  }

  ngOnInit(): void {
    this.guestDisplayName = this.ensureGuestDisplayName();
    this.guestKey = this.ensureGuestKey();
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.product) {
        this.imageAlts = this.buildImageAlts(this.product);
        this.relatedProducts = this.buildRelated(this.allProduits, this.product);
        this.rebuildHistoryCards(this.product, this.typeProduitDetail);
      }
    });
    this.currencyService.currency$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.product) {
        this.relatedProducts = this.buildRelated(this.allProduits, this.product);
      }
    });
    this.cartService.lines$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.applyQuantityFromCartForSelection();
    });
    this.route.paramMap
      .pipe(
        map((params) => parseProductIdFromSlugParam(params.get('slug'))),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((id) => {
        if (id == null) {
          void this.router.navigate(['/produit']);
          return;
        }
        this.loadProduct(id);
      });

    // Track ?tailleId= at all times — used both on first load and on re-navigation
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('tailleId')),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((v) => {
        this.pendingVariant = v;
        // Product already loaded (same component, variant changed) → apply immediately
        if (this.product) {
          this.applyVariantFromQueryParam();
          this.applyQuantityFromCartForSelection();
        }
      });
  }

  ngAfterViewInit(): void {
    this.scheduleMobilePurchaseBarDock();
    // Observer créé ici ; les éléments seront armés après chaque chargement produit
    this.initScrollReveal();
  }

  private initScrollReveal(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    if (this.scrollRevealObserver) return; // déjà initialisé
    this.scrollRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.scrollRevealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 },
    );
  }

  /**
   * Arme et observe tous les .pd-reveal pas encore observés.
   * À appeler après chaque mise à jour du DOM produit (chargement async).
   */
  private refreshScrollReveal(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.initScrollReveal();
    const host = document.querySelector('app-product-detail') ?? document;
    host.querySelectorAll('.pd-reveal:not(.pd-reveal--armed):not(.is-visible)').forEach((el) => {
      el.classList.add('pd-reveal--armed');
      this.scrollRevealObserver!.observe(el);
    });
  }

  ngOnDestroy(): void {
    if (this.feedbackThankYouClear != null) clearTimeout(this.feedbackThankYouClear);
    this.scrollRevealObserver?.disconnect();
    this.cancelLoad$.next();
    this.cancelLoad$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    if (this.mobileDockRaf) {
      cancelAnimationFrame(this.mobileDockRaf);
      this.mobileDockRaf = 0;
    }
  }

  private scheduleMobilePurchaseBarDock(): void {
    if (typeof window === 'undefined') return;
    if (this.mobileDockRaf) return;
    this.mobileDockRaf = requestAnimationFrame(() => {
      this.mobileDockRaf = 0;
      this.updateMobilePurchaseBarDock();
    });
  }

  private updateMobilePurchaseBarDock(): void {
    if (typeof window === 'undefined') return;
    this.mobilePurchaseBarPageDocked = false;
    if (!window.matchMedia('(max-width: 900px)').matches) {
      this.mobilePurchaseBarBottomPx = 0;
      return;
    }
    const footerEl = this.footerRef?.nativeElement;
    if (!footerEl) {
      this.mobilePurchaseBarBottomPx = 0;
      return;
    }
    const rect = footerEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const gap = 10;
    if (rect.top >= vh) {
      this.mobilePurchaseBarBottomPx = 0;
      return;
    }
    this.mobilePurchaseBarBottomPx = Math.max(0, Math.round(vh - rect.top + gap));
  }

  get tailleOptions(): TailleOption[] {
    const p = this.product;
    if (!p) return [];
    const fromTailles = p.tailles?.map((t) => ({
      id: t.tailleId,
      label: t.tailleLabel?.trim() || `#${t.tailleId}`,
      prix: Number(t.prix ?? 0),
      stock: t.stock ?? 0,
    }));
    if (fromTailles && fromTailles.length > 0) return fromTailles;
    const fromVol = p.volumes?.map((v) => ({
      id: v.volumeId,
      label: v.volumeLabel?.trim() || `#${v.volumeId}`,
      prix: Number(v.prix ?? 0),
      stock: v.stock ?? 0,
    }));
    return fromVol ?? [];
  }

  get selectedTaille(): TailleOption | null {
    const rows = this.tailleOptions;
    if (!rows.length) return null;
    const i = Math.min(this.selectedTailleIndex, rows.length - 1);
    return rows[i];
  }

  /** Au-dessus des images : navigation site (Accueil → liste produits). */
  get productTopNavTrail(): ProductBreadcrumbItem[] {
    const l = this.siteLang.lang;
    return [
      { label: l === 'ar' ? 'الرئيسية' : l === 'en' ? 'Home' : 'Accueil', routerLink: ['/home'] },
      { label: l === 'ar' ? 'منتجات' : l === 'en' ? 'Products' : 'Produits', routerLink: ['/produit'] },
    ];
  }

  /**
   * Juste avant le titre : catégorie → catalogue → type (texte simple, liens vers `/produit?…`).
   */
  get productHierarchyBreadcrumbTrail(): ProductBreadcrumbItem[] {
    const p = this.product;
    if (!p) return [];
    const trail: ProductBreadcrumbItem[] = [];
    let qp: Record<string, number> = {};

    const categorieLabel = typeof p.categorieNom === 'string' ? p.categorieNom.trim() : '';
    if (categorieLabel) {
      if (p.categorieId != null) qp = { categorieId: p.categorieId };
      trail.push({
        label: categorieLabel,
        routerLink: ['/produit'],
        queryParams: Object.keys(qp).length ? { ...qp } : undefined,
      });
    }

    const catalogueLabel = typeof p.catalogueNom === 'string' ? p.catalogueNom.trim() : '';
    if (catalogueLabel) {
      const next = { ...qp };
      if (p.catalogueId != null) next['catalogueId'] = p.catalogueId;
      trail.push({
        label: catalogueLabel,
        routerLink: ['/produit'],
        queryParams: { ...next },
      });
      qp = next;
    }

    const typeLabel = typeof p.typeProduitNom === 'string' ? p.typeProduitNom.trim() : '';
    if (typeLabel) {
      const next = { ...qp };
      if (p.typeProduitId != null) next['typeProduitId'] = p.typeProduitId;
      trail.push({
        label: typeLabel,
        routerLink: ['/produit'],
        queryParams: { ...next },
      });
    }

    return trail;
  }

  /**
   * Desktop : chaque clic ajoute **1** unité (fusion avec la ligne existante).
   * Libellé « J'achète » → « + Ajouter au panier » selon `hasCurrentVariantInCart`.
   */
  desktopAddToCart(): void {
    const input = this.buildCurrentCartLineInput(1);
    if (input) this.cartService.addLine(input);
  }

  /** Met le panier à jour pour la sélection courante (quantité affichée = quantité panier). */
  private syncQuantityToCart(): void {
    const p = this.product;
    if (!p) return;
    const q = Math.max(1, Math.floor(this.quantity));
    this.quantity = q;
    const t = this.selectedTaille;
    const line = this.cartService.findLineByProductAndVariant(p.id, t?.label);
    if (line) {
      this.cartService.setLineQuantity(line.lineId, q);
      return;
    }
    const input = this.buildCurrentCartLineInput(q);
    if (input) this.cartService.addLine(input);
  }

  private buildCurrentCartLineInput(quantity: number): CartLineInput | null {
    const p = this.product;
    if (!p) return null;
    const t = this.selectedTaille;
    const unitPriceDhs = t != null ? Number(t.prix) : Number(p.prix ?? 0);
    return {
      productId: p.id,
      name: p.nom,
      quantity,
      priceLabel: this.productPriceLabel,
      unitPriceDhs: Number.isFinite(unitPriceDhs) ? unitPriceDhs : undefined,
      variantLabel: t?.label,
      tailleId: t?.id,
      imageUrl: this.mainImageUrl,
      categoryLabel: p.categorieNom?.trim() || undefined,
      catalogueLabel: p.catalogueNom?.trim() || undefined,
      typeLabel: p.typeProduitNom?.trim() || undefined,
    };
  }

  /** Affiche la quantité déjà en panier pour cette variante (ou 1 si aucune ligne). */
  private applyQuantityFromCartForSelection(): void {
    const p = this.product;
    if (!p || this.loading) return;
    const t = this.selectedTaille;
    const line = this.cartService.findLineByProductAndVariant(p.id, t?.label);
    this.quantity = line ? Math.max(1, Math.floor(line.quantity)) : 1;
  }

  /** True si cette variante est déjà une ligne du panier (libellé du bouton principal desktop). */
  get hasCurrentVariantInCart(): boolean {
    const p = this.product;
    if (!p) return false;
    return !!this.cartService.findLineByProductAndVariant(p.id, this.selectedTaille?.label);
  }

  get isCurrentProductFavorite(): boolean {
    const p = this.product;
    if (!p) return false;
    return this.favoritesService.has(p.id);
  }

  toggleFavorite(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const p = this.product;
    if (!p) return;
    const vol =
      this.selectedTaille?.label?.trim() || FavoritesService.volumeSummaryFromProduit(p) || undefined;
    this.favoritesService.toggle({
      productId: p.id,
      name: p.nom,
      imageUrl: this.mainImageUrl,
      priceLabel: this.productPriceLabel,
      categorieNom: p.categorieNom?.trim() || undefined,
      catalogueNom: p.catalogueNom?.trim() || undefined,
      typeProduitNom: p.typeProduitNom?.trim() || undefined,
      volumeLabel: vol,
    });
  }

  /** Mobile : premier tap → mode quantité ; n'ajoute une unité que si la variante n'est pas encore au panier. */
  onMobileBarBuyClick(): void {
    this.mobilePurchaseBarQuantityMode = true;
    if (!this.hasCurrentVariantInCart) {
      const input = this.buildCurrentCartLineInput(1);
      if (input) this.cartService.addLine(input);
    }
  }

  get mainImageUrl(): string {
    if (!this.imageUrls.length) return STATIC_PRODUCT_IMAGE_URL;
    const i = Math.min(this.selectedThumb, this.imageUrls.length - 1);
    return this.imageUrls[i];
  }

  get mainImageAlt(): string {
    const p = this.product;
    const fallback = p ? this.pickText(p.nom, p.nomEn, p.nomAr) : '';
    if (!this.imageAlts.length) return fallback;
    const i = Math.min(this.selectedThumb, this.imageAlts.length - 1);
    return this.imageAlts[i] || fallback;
  }

  /** Indices de toutes les vignettes (défilement fluide dans la bande). */
  get thumbIndices(): number[] {
    return this.imageUrls.map((_, i) => i);
  }

  get showThumbCarouselNav(): boolean {
    return this.imageUrls.length > 1;
  }

  /** Flèches du carrousel : photo précédente / suivante en grand + défile la fenêtre de vignettes. */
  thumbPrev(): void {
    const n = this.imageUrls.length;
    if (n <= 1) return;
    const idx = (this.selectedThumb - 1 + n) % n;
    this.selectThumb(idx);
  }

  thumbNext(): void {
    const n = this.imageUrls.length;
    if (n <= 1) return;
    const idx = (this.selectedThumb + 1) % n;
    this.selectThumb(idx);
  }

  get productPriceLabel(): string {
    const p = this.product;
    if (!p) return '';
    const t = this.selectedTaille;
    if (t) return this.currencyService.format(t.prix);
    return this.formatPriceRange(p);
  }

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
    const p = this.product;
    if (!p) return false;
    if (u) return this.productComments.some((c) => c.userId === u.id);
    return this.productComments.some((c) => c.userId == null && c.authorName === this.guestDisplayName);
  }

  get ratingStarsDisplay(): { full: number; half: boolean } {
    const n = this.averageRating;
    const full = Math.floor(n);
    const half = n - full >= 0.35 && n - full < 0.95;
    return { full, half };
  }

  selectThumb(index: number): void {
    const n = this.imageUrls.length;
    if (n === 0) return;
    const i = ((index % n) + n) % n;
    const prev = this.selectedThumb;
    this.selectedThumb = i;
    if (i !== prev) {
      this.triggerMainImageTransition();
    }
    this.queueScrollThumbIntoView(i, true);
  }

  private triggerMainImageTransition(): void {
    if (this.mainImageTransitionTimer !== undefined) {
      clearTimeout(this.mainImageTransitionTimer);
    }
    this.mainImageTransitioning = true;
    this.mainImageTransitionTimer = setTimeout(() => {
      this.mainImageTransitioning = false;
      this.mainImageTransitionTimer = undefined;
    }, 420);
  }

  private queueScrollThumbIntoView(index: number, smooth: boolean): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const row = this.thumbnailsRowRef?.nativeElement;
        if (!row) return;
        const el = row.querySelector<HTMLElement>(`[data-thumb-index="${index}"]`);
        el?.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'nearest',
          inline: 'center',
        });
      });
    });
  }

  selectTaille(index: number): void {
    this.selectedTailleIndex = index;
    this.applyQuantityFromCartForSelection();
    this.mobilePurchaseBarQuantityMode = false;
    // Rafraîchir les images selon la taille sélectionnée
    if (this.product) {
      const taille = this.tailleOptions[index];
      this.imageUrls = this.buildImageUrls(this.product, taille?.id ?? null);
      this.selectedThumb = 0;
    }
  }

  /** Clic sur une taille : si stock épuisé, message et pas de sélection. */
  onTailleOptionClick(index: number, opt: TailleOption): void {
    if (opt.stock <= 0) {
      const bientot = this.product?.statut === false;
      window.alert(bientot ? 'Bientôt disponible' : 'Rupture de stock');
      return;
    }
    this.selectTaille(index);
  }

  private applyVariantFromQueryParam(): void {
    const raw = this.pendingVariant;
    if (!raw) return;
    const tailleId = parseInt(raw, 10);
    if (!Number.isFinite(tailleId)) return;
    // Match by ID — unambiguous, no string normalization needed
    const idx = this.tailleOptions.findIndex((t) => t.id === tailleId);
    if (idx >= 0) this.selectedTailleIndex = idx;
  }

  private ensureValidTailleSelection(): void {
    const rows = this.tailleOptions;
    if (!rows.length) return;
    const idx = Math.min(this.selectedTailleIndex, rows.length - 1);
    const cur = rows[idx];
    if (cur && cur.stock > 0) {
      this.selectedTailleIndex = idx;
      return;
    }
    const first = rows.findIndex((r) => r.stock > 0);
    this.selectedTailleIndex = first >= 0 ? first : 0;
  }

  get descriptionPlain(): string {
    const p = this.product;
    if (!p) return '';
    const raw = this.pickText(p.description ?? '', p.descriptionEn ?? '', p.descriptionAr ?? '');
    if (!raw.trim()) return '';
    return plainTextFromHtml(raw).trim();
  }

  get descriptionExcerpt(): string {
    const t = this.descriptionPlain;
    if (!t) return '';
    if (this.descriptionExpanded || t.length <= this.descriptionExcerptMaxChars) return t;
    const cut = t.slice(0, this.descriptionExcerptMaxChars);
    const lastSpace = cut.lastIndexOf(' ');
    const base = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd();
    return `${base}…`;
  }

  get showDescriptionToggle(): boolean {
    return this.descriptionPlain.length > this.descriptionExcerptMaxChars;
  }

  toggleDescriptionExpanded(): void {
    this.descriptionExpanded = !this.descriptionExpanded;
  }

  /** Partage natif (Web Share) ou copie du lien dans le presse-papiers. */
  async shareProduct(): Promise<void> {
    const p = this.product;
    if (!p || typeof window === 'undefined') return;
    const url = window.location.href;
    const title = this.pickText(p.nom, p.nomEn ?? '');
    const text = `${title} — Myrass`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Lien du produit (copier) :', url);
    }
  }

  get imagePositionLabel(): string {
    const n = this.imageUrls.length;
    if (n <= 0) return '';
    const i = Math.min(this.selectedThumb, n - 1) + 1;
    return `${i}/${n}`;
  }

  scrollToReviews(): void {
    document.getElementById('product-reviews-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  increment(): void {
    this.quantity++;
    this.syncQuantityToCart();
  }

  /**
   * Diminue la quantité et le panier ; à 1, un second « − » retire la ligne.
   * Sur mobile : repasse sur le bouton « J'achète » dès qu'on revient à 1 ou que le panier est vide pour cette variante.
   */
  decrement(): void {
    const p = this.product;
    if (!p) return;

    if (this.quantity <= 1) {
      const line = this.cartService.findLineByProductAndVariant(p.id, this.selectedTaille?.label);
      if (line) {
        this.cartService.removeLine(line.lineId);
      }
      this.mobilePurchaseBarQuantityMode = false;
      return;
    }

    this.quantity--;
    this.syncQuantityToCart();
    if (this.quantity === 1) {
      this.mobilePurchaseBarQuantityMode = false;
    }
  }

  starsArray(n: number): number[] {
    return Array(Math.max(0, Math.round(n))).fill(0);
  }

  maxCount(): number {
    return Math.max(...this.ratingBreakdownRows.map((r) => r.count), 1);
  }

  get pagedProductComments(): ProductComment[] {
    const list = this.productComments;
    const start = this.reviewsPageIndex * this.reviewsPageSize;
    return list.slice(start, start + this.reviewsPageSize);
  }

  get reviewsTotalPages(): number {
    const n = this.productComments.length;
    return Math.max(1, Math.ceil(n / this.reviewsPageSize));
  }

  get reviewsPageNumbers(): number[] {
    return Array.from({ length: this.reviewsTotalPages }, (_, i) => i);
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

  /** Avis BDD (inclut désormais invités). */
  private get effectiveAvis(): Array<Pick<AvisDto, 'note'>> {
    return (this.productAvis ?? []).map((a) => ({ note: a.note }));
  }

  private reloadReviews(produitId: number): void {
    forkJoin({
      commentaires: this.interactions.getCommentairesProduit(produitId),
      avis: this.interactions.getAvisProduit(produitId),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ commentaires, avis }) => {
          if (this.product?.id !== produitId) return;
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
            productId: c.produitId,
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

  setAvisDraftRating(n: number): void {
    this.avisDraftRating = Math.min(5, Math.max(1, Math.round(n)));
  }

  onCommentEnter(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.submitComment();
    }
  }

  submitAvis(): void {
    const p = this.product;
    const u = this.userAuth.currentUser;
    if (!p) return;
    if (!u) {
      this.userAuth.requestOpenLoginPanel();
      return;
    }
    this.interactions
      .upsertAvis({ userId: u.id, produitId: p.id, note: this.avisDraftRating })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showThankYouModal('avis');
          this.reloadReviews(p.id);
        },
        error: (e) => window.alert(parseApiError(e)),
      });
  }

  /** Formulaire unifié (étoiles + commentaire). Invité = localStorage, connecté = BDD. */
  submitReview(): void {
    const p = this.product;
    if (!p) return;
    const body = this.newCommentBody.trim();
    const u = this.userAuth.currentUser;

    if (!u) {
      if (!body) return;
      this.interactions
        .addCommentaireGuest({
          guestKey: this.guestKey,
          guestName: this.guestDisplayName,
          produitId: p.id,
          contenu: body,
          note: this.avisDraftRating,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.newCommentBody = '';
            this.showThankYouModal('avis');
            this.reloadReviews(p.id);
          },
          error: (e) => window.alert(parseApiError(e)),
        });
      return;
    }

    // 1) Toujours enregistrer la note (même sans commentaire)
    this.interactions
      .upsertAvis({ userId: u.id, produitId: p.id, note: this.avisDraftRating })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (!body) {
            this.showThankYouModal('avis');
            this.reloadReviews(p.id);
            return;
          }
          const mine = this.productComments.find((c) => c.userId === u.id);
          if (mine) {
            this.newCommentBody = '';
            this.showThankYouModal('noteUpdate');
            this.reloadReviews(p.id);
            return;
          }
          this.interactions
            .addCommentaire({ userId: u.id, produitId: p.id, contenu: body })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.newCommentBody = '';
                this.showThankYouModal('avis');
                this.reloadReviews(p.id);
              },
              error: (e) => window.alert(parseApiError(e)),
            });
        },
        error: (e) => window.alert(parseApiError(e)),
      });
  }

  submitComment(): void {
    const p = this.product;
    const u = this.userAuth.currentUser;
    if (!p) return;
    const body = this.newCommentBody.trim();
    if (!body) return;
    if (!u) {
      if (!body) return;
      this.interactions
        .addCommentaireGuest({
          guestKey: this.guestKey,
          guestName: this.guestDisplayName,
          produitId: p.id,
          contenu: body,
          note: this.avisDraftRating,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.newCommentBody = '';
            this.showThankYouModal('avis');
            this.reloadReviews(p.id);
          },
          error: (e) => window.alert(parseApiError(e)),
        });
      return;
    }

    const mine = this.productComments.find((c) => c.userId === u.id);
    if (mine) {
      window.alert('Vous avez déjà publié un commentaire pour ce produit. Supprimez-le ci-dessus pour en écrire un autre.');
      return;
    }
    this.interactions
      .addCommentaire({
        userId: u.id,
        produitId: p.id,
        contenu: body,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newCommentBody = '';
          this.showThankYouModal('commentaire');
          this.reloadReviews(p.id);
        },
        error: (e) => window.alert(parseApiError(e)),
      });
  }

  deleteComment(c: ProductComment): void {
    const u = this.userAuth.currentUser;
    const p = this.product;
    if (!u || !p || c.userId !== u.id) return;
    if (!window.confirm('Supprimer votre commentaire ?')) return;
    this.interactions
      .deleteCommentaire(+c.id, u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.reloadReviews(p.id),
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

  private thanksDisplayName(): string {
    const u = this.userAuth.currentUser;
    const nom = (u?.nomComplet ?? '').trim();
    if (nom) return nom;
    return (this.guestDisplayName ?? '').trim();
  }

  /**
   * Modale remerciement luxe (titre personnalisé si possible).
   * @param kind avis = note / expérience produit ; commentaire = avis rédigé ; noteUpdate = note seule quand commentaire déjà là.
   */
  private showThankYouModal(kind: 'avis' | 'commentaire' | 'noteUpdate'): void {
    const name = this.thanksDisplayName();
    const en = this.siteLang.lang === 'en';

    let title: string;
    let subtitle: string;

    if (kind === 'noteUpdate') {
      title = en ? 'Rating updated' : 'Note mise à jour';
      subtitle = en
        ? 'Your published review is unchanged. Your star rating has been saved.'
        : 'Votre commentaire publié reste inchangé. Votre note a bien été enregistrée.';
    } else if (kind === 'commentaire') {
      title = en ? 'Thank you for your feedback' : 'Merci pour votre retour';
      subtitle = en
        ? name
          ? `${name}, your review helps us maintain quality and guides other customers.`
          : 'Your review helps us maintain quality and guides other customers.'
        : name
          ? `${name}, votre avis contribue à la qualité de nos produits et éclaire les autres clients.`
          : 'Votre avis contribue à la qualité de nos produits et éclaire les autres clients.';
    } else {
      title = en ? 'Thank you' : 'Merci';
      subtitle = en
        ? name
          ? `${name}, we have received your rating. Your input is valuable to Myrass.`
          : 'We have received your rating. Your input is valuable to Myrass.'
        : name
          ? `${name}, nous avons bien enregistré votre évaluation. Votre retour compte pour Myrass.`
          : 'Nous avons bien enregistré votre évaluation. Votre retour compte pour Myrass.';
    }

    this.feedbackThankYou = { title, subtitle };
    if (this.feedbackThankYouClear != null) clearTimeout(this.feedbackThankYouClear);
    this.feedbackThankYouClear = setTimeout(() => {
      this.feedbackThankYou = null;
      this.feedbackThankYouClear = undefined;
    }, 14_000);
  }

  continueShoppingAfterThanks(): void {
    this.closeThankYouModal();
  }

  get thankYouContinueLabel(): string {
    return this.siteLang.lang === 'en' ? 'Continue shopping' : 'Continuer mes achats';
  }

  get thankYouCloseAriaLabel(): string {
    return this.siteLang.lang === 'en' ? 'Close' : 'Fermer';
  }

  formatCommentDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private loadProduct(id: number): void {
    this.cancelLoad$.next(); // annule la requête précédente si encore en vol
    // Évite de remasquer toute la fiche si l'URL change seulement (slug canonique, même id).
    if (this.product?.id !== id) {
      this.loading = true;
    }
    this.errorMessage = null;
    this.typeProduitDetail = null;
    this.historyCards = [];

    this.produitService
      .getById(id)
      .pipe(
        switchMap((product) =>
          forkJoin({
            all: this.produitService.getAll(),
            typeDetail: this.typeProduitService.getById(product.typeProduitId).pipe(
              catchError(() => of(null as TypeProduit | null)),
            ),
          }).pipe(map(({ all, typeDetail }) => ({ product, all, typeDetail }))),
        ),
        takeUntil(this.cancelLoad$),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ({ product, all, typeDetail }) => {
          this.product = product;
          this.recentlyViewed.track(product.id);
          this.typeProduitDetail = typeDetail;
          const list = all ?? [];
          this.allProduits = list;
          this.selectedTailleIndex = 0;
          const firstTaille = product.tailles?.[0];
          this.imageUrls = this.buildImageUrls(product, firstTaille?.tailleId ?? null);
          this.imageAlts = this.buildImageAlts(product);
          this.relatedProducts = this.buildRelated(list, product);
          this.rebuildHistoryCards(product, typeDetail);
          this.selectedThumb = 0;
          this.mobilePurchaseBarQuantityMode = false;
          this.mobilePurchaseBarPageDocked = false;
          this.mobilePurchaseBarBottomPx = 0;
          setTimeout(() => this.queueScrollThumbIntoView(0, false), 0);
          this.descriptionExpanded = false;
          this.shippingExpanded = false;
          this.loading = false;
          this.ensureValidTailleSelection();
          // Pre-select variant from query param (coming from cart / favorites)
          this.applyVariantFromQueryParam();
          this.applyQuantityFromCartForSelection();
          this.reloadReviews(product.id);
          setTimeout(() => this.scheduleMobilePurchaseBarDock(), 0);
          // Armer les sections révélées après que le DOM async soit rendu
          setTimeout(() => this.refreshScrollReveal(), 80);
          const canonical = buildProductSlug(product.nom, product.id);
          const raw = this.route.snapshot.paramMap.get('slug')?.trim() ?? '';
          if (raw !== canonical) {
            void this.router.navigate(['/product-detail', canonical], {
              replaceUrl: true,
              queryParamsHandling: 'preserve',
            });
          }
        },
        error: (e) => {
          this.errorMessage = parseApiError(e);
          this.product = null;
          this.imageUrls = [];
          this.imageAlts = [];
          this.typeProduitDetail = null;
          this.historyCards = [];
          this.productAvis = [];
          this.productComments = [];
          this.loading = false;
          this.mobilePurchaseBarBottomPx = 0;
          this.mobilePurchaseBarPageDocked = false;
        },
      });
  }

  private rebuildHistoryCards(product: Produit, type: TypeProduit | null): void {
    const lang = this.siteLang.lang;
    const histoire = this.pickText(type?.histoire, type?.histoireEn, type?.histoireAr);
    const rawBodies = this.buildHistoryBodiesFromBddOnly(histoire);
    if (rawBodies.length === 0) {
      this.historyCards = [];
      return;
    }
    const imgs = this.buildHistoryImageSlots(product, type);
    const typeName =
      this.pickText(type?.nom, type?.nomEn, type?.nomAr) ||
      this.pickText(product.typeProduitNom, product.typeProduitNomEn, product.typeProduitNomAr) ||
      (lang === 'ar' ? 'تشكيلتنا' : lang === 'en' ? 'Our range' : 'Notre gamme');

    const slotLabels = lang === 'ar'
      ? [
          { kicker: 'الأسس', headline: typeName, fallbackClass: 'history-cell-fallback--a' },
          { kicker: 'الخبرة', headline: 'التصنيع والجودة', fallbackClass: 'history-cell-fallback--b' },
          { kicker: 'النتائج', headline: 'المنتج النهائي', fallbackClass: 'history-cell-fallback--c' },
        ]
      : lang === 'en'
      ? [
          { kicker: 'The foundations', headline: typeName, fallbackClass: 'history-cell-fallback--a' },
          { kicker: 'The craft', headline: 'Manufacturing & excellence', fallbackClass: 'history-cell-fallback--b' },
          { kicker: 'The results', headline: 'Finished product', fallbackClass: 'history-cell-fallback--c' },
        ]
      : [
          { kicker: 'Les fondements', headline: typeName, fallbackClass: 'history-cell-fallback--a' },
          { kicker: 'Le savoir-faire', headline: 'Fabrication & exigence', fallbackClass: 'history-cell-fallback--b' },
          { kicker: 'Les résultats', headline: 'Produit fini', fallbackClass: 'history-cell-fallback--c' },
        ];

    const slots = slotLabels;
    const mergeVrStoryAlts = lang === 'ar'
      ? ['صورة التواصل', 'العرض الرئيسي', 'النهاية']
      : lang === 'en'
      ? ['Contact visual', 'Main view', 'Final']
      : ['Visuel contact', 'Vue principale (Main)', 'Fin'];
    this.historyCards = rawBodies.map((body, i) => {
      const slot = slots[Math.min(i, slots.length - 1)]!;
      const imageAlt =
        product.id === this.moyenneGalleryProductId && i < mergeVrStoryAlts.length
          ? `${product.nom} — ${mergeVrStoryAlts[i]}`
          : undefined;
      const fromMarkup = this.extractSectionTitlesFromHtml(body);
      if (fromMarkup) {
        return {
          imageUrl: imgs[i] ?? null,
          imageAlt,
          fallbackClass: slot.fallbackClass,
          kicker: fromMarkup.kicker,
          headline: fromMarkup.headline,
          body: fromMarkup.body,
        };
      }
      const parsed = this.parseHistorySegment(body, slot);
      return {
        imageUrl: imgs[i] ?? null,
        imageAlt,
        fallbackClass: slot.fallbackClass,
        kicker: parsed.kicker,
        headline: parsed.headline,
        body: parsed.body,
      };
    });
  }

  /**
   * Si le bloc BDD contient &lt;h2 class="section-title"&gt; et &lt;h3 class="section-subtitle"&gt;,
   * ce sont eux qui alimentent la ligne « kicker » (italique) et le titre fort sous la flèche.
   */
  private extractSectionTitlesFromHtml(raw: string): { kicker: string; headline: string; body: string } | null {
    const t = raw.trim();
    if (!t.includes('<')) return null;

    const h2Section = /<h2\b[^>]*\bsection-title\b[^>]*>([\s\S]*?)<\/h2>/i.exec(t);
    const h2Any = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(t);
    const h2m = h2Section ?? h2Any;

    const h3Section = /<h3\b[^>]*\bsection-subtitle\b[^>]*>([\s\S]*?)<\/h3>/i.exec(t);
    const h3Any = /<h3\b[^>]*>([\s\S]*?)<\/h3>/i.exec(t);
    const h3m = h3Section ?? h3Any;

    if (!h2m || !h3m) return null;

    const kicker = plainTextFromHtml(h2m[1]).trim();
    const headline = plainTextFromHtml(h3m[1]).trim();
    if (!kicker || !headline) return null;

    let remainder = t.replace(h2m[0], '').replace(h3m[0], '').trim();
    const body = plainTextFromHtml(remainder);

    return { kicker, headline, body };
  }

  /**
   * Si le bloc commence par une ligne courte puis une ligne vide, cette ligne sert de titre.
   * Ex. : `Notre terroir\n\nLe texte du paragraphe...`
   */
  private parseHistorySegment(
    raw: string,
    defaults: { kicker: string; headline: string },
  ): { kicker: string; headline: string; body: string } {
    const t = raw.trim();
    const m = /^([^\n]{1,100})\n\n([\s\S]+)$/.exec(t);
    if (m) {
      return { kicker: defaults.kicker, headline: m[1].trim(), body: m[2].trim() };
    }
    return { kicker: defaults.kicker, headline: defaults.headline, body: t };
  }

  /**
   * Blocs texte affichés : uniquement le contenu `histoire` du type (BDD), découpé en 1 à 3 parties.
   * Aucun paragraphe marketing de remplissage.
   */
  private buildHistoryBodiesFromBddOnly(histoire: string | null | undefined): string[] {
    const parts = this.splitHistoireFromBdd(histoire);
    if (!parts || parts.length === 0) return [];
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
    return parts;
  }

  private splitHistoireFromBdd(histoire: string | null | undefined): string[] | null {
    if (!histoire?.trim()) return null;
    const raw = histoire.trim();
    let parts = raw
      .split(/\n{3,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length < 2) {
      parts = raw
        .split(/\n\s*[-_]{3,}\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }
    if (parts.length < 2) {
      const paras = raw
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (paras.length >= 2 && paras.length <= 3) {
        parts = paras.slice(0, 3);
      }
    }
    if (parts.length === 0) return null;
    return parts;
  }

  private buildHistoryImageSlots(product: Produit, type: TypeProduit | null): (string | null)[] {
    const fromType = (type?.mediaUrls ?? [])
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      .slice(0, 3);
    const fromProduct = this.buildImageUrls(product);
    const fallback = product.id === this.moyenneGalleryProductId ? this.mergeVrHistoryImageUrls : [];
    return [0, 1, 2].map((i) => fromType[i] ?? fromProduct[i] ?? fallback[i] ?? null);
  }

  private buildImageUrls(product: Produit, tailleId?: number | null): string[] {
    // 1. Images de l'API filtrées par taille sélectionnée (ou génériques si pas de taille)
    const allMedias = (product.medias ?? []).filter((m) => m.kind === 'image' && !!m.url);
    if (allMedias.length > 0) {
      // Images spécifiques à la taille sélectionnée
      const forTaille = tailleId
        ? allMedias.filter((m) => m.tailleId === tailleId)
        : [];
      // Images génériques (sans taille liée)
      const generic = allMedias.filter((m) => !m.tailleId);
      // Priorité : images taille → images génériques → toutes
      const candidates = forTaille.length > 0 ? forTaille : generic.length > 0 ? generic : allMedias;
      return candidates.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)).map((m) => m.url);
    }
    // 2. Fallback : assets locaux pour les anciens produits sans médias en DB
    if (product.id === this.raffinProductId) return [this.raffinImage];
    if (product.id === this.naturelProductId) return [this.naturelImage];
    if (product.id === this.mielProductId) return [this.mielImage];
    if (product.id === this.amlouProductId) return [this.amlouImage];
    if (product.id === this.visageProductId) return [this.visageImage];
    if (product.id === this.moyenneGalleryProductId) {
      return Array.from({ length: 7 }, (_, i) => `/assets/Moyenne${i + 1}.png`);
    }
    return [STATIC_PRODUCT_IMAGE_URL];
  }

  private buildImageAlts(product: Produit): string[] {
    const base = this.pickText(product.nom, product.nomEn, product.nomAr) || 'Produit';
    if (product.id === this.raffinProductId) {
      return [base];
    }
    if (product.id === this.naturelProductId) {
      return [base];
    }
    if (product.id === this.mielProductId) {
      return [base];
    }
    if (product.id === this.amlouProductId) {
      return [base];
    }
    if (product.id === this.visageProductId) {
      return [base];
    }
    if (product.id === this.moyenneGalleryProductId) {
      return Array.from({ length: 7 }, () => base);
    }
    const medias = product.medias ?? [];
    const labels = medias
      .filter((m) => m.kind === 'image' && !!m.url)
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
      .map((m) => (m.legende?.trim() ? m.legende.trim() : base));
    if (labels.length > 0) return labels;
    return [base];
  }

  private buildRelated(all: Produit[], current: Produit): RelatedProduct[] {
    const catKey = current.categorieId ?? null;
    const catalogueId = current.catalogueId;
    return all
      .filter(
        (p) =>
          p.id !== current.id &&
          p.catalogueId === catalogueId &&
          (p.categorieId ?? null) === catKey,
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: this.pickText(p.nom, p.nomEn, p.nomAr),
        set: this.pickText(p.typeProduitNom, p.typeProduitNomEn, p.typeProduitNomAr) || 'Set of 1',
        price: this.formatPriceRange(p),
        imgSrc: this.resolveSingleImage(p),
      }));
  }

  private resolveSingleImage(product: Produit): string {
    const images = (product.medias ?? []).filter((m) => m.kind === 'image' && !!m.url);
    const principal = images.find((m) => m.estPrincipale) ?? images[0];
    if (principal?.url) return principal.url;

    if (product.id === this.raffinProductId) return this.raffinImage;
    if (product.id === this.naturelProductId) return this.naturelImage;
    if (product.id === this.mielProductId) return this.mielImage;
    if (product.id === this.amlouProductId) return this.amlouImage;
    if (product.id === this.visageProductId) return this.visageImage;
    if (product.id === this.moyenneGalleryProductId) return this.moyenne1Image;
    return STATIC_PRODUCT_IMAGE_URL;
  }

  private formatPriceRange(product: Produit): string {
    const hasType = !!product.typeProduitId || !!product.typeProduitNom;
    const tailles =
      product.tailles ??
      product.volumes?.map((v) => ({
        tailleId: v.volumeId,
        prix: v.prix,
        stock: v.stock,
      })) ??
      [];

    if (hasType && tailles.length > 0) {
      const min = Math.min(...tailles.map((t) => Number(t.prix ?? 0)));
      const max = Math.max(...tailles.map((t) => Number(t.prix ?? 0)));
      return this.currencyService.formatRange(min, max);
    }
    return this.currencyService.format(Number(product.prix ?? 0));
  }
}
