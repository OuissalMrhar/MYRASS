import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, skip, take, takeUntil } from 'rxjs/operators';
import { Categorie } from '../../models/categorie.model';
import { Catalogue } from '../../models/catalogue.model';
import { Gift } from '../../models/gift.model';
import { Produit } from '../../models/produit.model';
import { TypeProduit } from '../../models/type-produit.model';
import { CartService } from '../../services/cart.service';
import { CatalogueService } from '../../services/catalogue.service';
import { CategorieService } from '../../services/categorie.service';
import { FavoritesService } from '../../services/favorites.service';
import { GiftService } from '../../services/gift.service';
import { ProduitService } from '../../services/produit.service';
import { TypeProduitService } from '../../services/type-produit.service';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { STATIC_PRODUCT_IMAGE_URL } from '../../core/static-product-image';
import { AvisProduitResumeDto, InteractionsService } from '../../services/interactions.service';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import { SiteLanguageService } from '../../core/site-language.service';
import { PRODUIT_PAGE_LABELS, ProduitPageLabels, SiteLang, pick } from '../../core/visitor-i18n';
import { CurrencyService } from '../../services/currency.service';
import { SeoService } from '../../core/seo.service';

export type ProductSortMode =
  | 'recommended'
  | 'topRated'
  | 'bestSellers'
  | 'newProducts'
  | 'priceAsc'
  | 'priceDesc';

@Component({
  selector: 'app-produit-page',
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
})
export class ProduitComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allProduits: Produit[] = [];
  categories: Categorie[] = [];
  allCatalogues: Catalogue[] = [];
  typesForCatalogue: TypeProduit[] = [];

  /** Filtres appliqués (panel + barre). Multi-sélection pour catégories et catalogues. */
  selectedCategoryIds = new Set<number>();
  selectedCatalogueIds = new Set<number>();
  selectedTypeId: number | null = null;
  readonly selectedPriceBandKeys = new Set<string>();
  labels: ProduitPageLabels = PRODUIT_PAGE_LABELS['fr'];

  sortMode: ProductSortMode = 'recommended';

  filterPanelOpen = false;
  typeDropdownOpen = false;
  sortDropdownOpen = false;

  accCategoryOpen = true;
  accCatalogueOpen = true;
  accPriceOpen = true;
  accDeliveryOpen = true;

  /** Catégorie actuellement "dépliée" dans le panneau (affiche ses catalogues). */
  expandedCategoryId: number | null = null;

  /** Après filtres et tri, hors « masque » ; découpage par rubrique ensuite. */
  filteredProduits: Produit[] = [];
  productSections: { key: string; label: string; items: Produit[] }[] = [];
  sectionPages: Record<string, number> = {};
  /** 8 before RV section + 8 after RV section = 16 per page. */
  readonly pageSize = 16;

  /** Produits récemment consultés (hors produits de la section en cours). */
  recentlyViewedItems: Produit[] = [];
  readonly rvMaxDisplay = 5;

  /** Tranches en dollars (prix affichés `$` sur la boutique). */
  readonly priceBands: { key: string; label: string }[] = [
    { key: '0-25', label: '$0 – $25' },
    { key: '25-50', label: '$25 – $50' },
    { key: '50-100', label: '$50 – $100' },
    { key: '100-200', label: '$100 – $200' },
    { key: '200+', label: '$200 et plus' },
  ];

  currentLang: SiteLang = 'fr';
  isRtl = false;

  /** Packs dont le nom commence par "cadeaux" — affichés dans la section cadeaux en bas. */
  cadeauxGifts: Gift[] = [];
  isGiftsLoading = false;

  /** Moyenne avis par produit (API). */
  avisByProduitId = new Map<number, AvisProduitResumeDto>();

  get sortOptions(): { id: ProductSortMode; label: string }[] {
    return [
      { id: 'recommended', label: this.labels.recommended },
      { id: 'topRated', label: this.labels.topRated },
      { id: 'bestSellers', label: this.labels.bestSellers },
      { id: 'newProducts', label: this.labels.newProducts },
      { id: 'priceAsc', label: this.labels.priceAsc },
      { id: 'priceDesc', label: this.labels.priceDesc },
    ];
  }

  get deliveryOptions(): { key: string; label: string }[] {
    return [
      { key: 'home', label: this.labels.homeDelivery },
      { key: 'click', label: this.labels.clickCollect },
      { key: 'messenger', label: this.labels.messenger },
    ];
  }

  private readonly moyenneGalleryProductId = 8;
  private readonly moyenne1Image = '/assets/Moyenne1.png';
  private readonly raffinProductId = 5;
  private readonly raffinImage = '/assets/raffin.jpeg';
  private readonly naturelProductId = 9;
  private readonly naturelImage = '/assets/Naturel.jpeg';
  private readonly mielProductId = 10;
  private readonly mielImage = '/assets/Miel.png';
  private readonly amlouProductId = 11;
  private readonly amlouImage = '/assets/Amlou.png';
  private readonly visageProductId = 12;
  private readonly visageImage = '/assets/visage.png';

  searchTerm = '';

  constructor(
    private readonly produitService: ProduitService,
    private readonly categorieService: CategorieService,
    private readonly catalogueService: CatalogueService,
    private readonly typeProduitService: TypeProduitService,
    private readonly favorites: FavoritesService,
    private readonly cart: CartService,
    private readonly giftService: GiftService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly host: ElementRef<HTMLElement>,
    private readonly interactions: InteractionsService,
    private readonly recentlyViewedService: RecentlyViewedService,
    private readonly siteLang: SiteLanguageService,
    readonly productRoutes: ProductRoutingHelper,
    private readonly currencyService: CurrencyService,
    private readonly seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((l) => {
      this.currentLang = l;
      this.isRtl = l === 'ar';
      this.labels = PRODUIT_PAGE_LABELS[l];
      this.seo.set({
        title: l === 'ar' ? 'منتجاتنا' : l === 'en' ? 'Our Products' : 'Nos Produits',
        description: this.labels.heroSubtitle,
      });
      this.recomputeFiltered();
    });
    this.currencyService.currency$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.recomputeFiltered();
    });
    this.route.queryParamMap.pipe(skip(1), takeUntil(this.destroy$)).subscribe(() => this.syncFromRoute());

    forkJoin({
      produits: this.produitService.getAll().pipe(catchError(() => of<Produit[]>([]))),
      categories: this.categorieService.getAll().pipe(catchError(() => of<Categorie[]>([]))),
      catalogues: this.catalogueService.getAll().pipe(catchError(() => of<Catalogue[]>([]))),
    })
      .pipe(take(1))
      .subscribe(({ produits, categories, catalogues }) => {
        this.allProduits = produits ?? [];
        this.categories = (categories ?? []).filter((c) => c.id != null);
        this.allCatalogues = catalogues ?? [];
        const ids = this.allProduits.map((p) => p.id);
        this.interactions
          .getAvisResume(ids)
          .pipe(
            takeUntil(this.destroy$),
            take(1),
            catchError(() => of<AvisProduitResumeDto[]>([])),
          )
          .subscribe((resume) => {
            this.avisByProduitId = new Map((resume ?? []).map((r) => [r.produitId, r]));
            this.readFiltersFromRoute();
            this.sanitizeCategoryAndCatalogueFilters();
            this.loadTypesForCatalogue();
            this.refreshRecentlyViewed();
          });

        this.recentlyViewedService.ids$.pipe(takeUntil(this.destroy$)).subscribe(() => {
          this.refreshRecentlyViewed();
        });
      });

    this.loadCadeauxGifts();
  }

  private loadCadeauxGifts(): void {
    this.isGiftsLoading = true;
    this.giftService.getAll().pipe(
      take(1),
      catchError(() => of<Gift[]>([])),
    ).subscribe((gifts) => {
      this.isGiftsLoading = false;
      this.cadeauxGifts = (gifts ?? []).filter(g => g.nom?.trim().toLowerCase().startsWith('cadeaux'));
    });
  }

  giftImageUrl(gift: Gift): string {
    if (gift.imageUrl?.trim()) return gift.imageUrl.trim();
    return gift.produits?.find(p => !!p.produitImageUrl)?.produitImageUrl?.trim() || '/assets/pack1.jpeg';
  }

  giftName(gift: Gift | undefined): string {
    if (!gift) return '';
    return pick(gift.nom, gift.nomEn, gift.nomAr, this.currentLang) || gift.nom || '';
  }

  giftDescription(gift: Gift | undefined): string {
    if (!gift) return '';
    return pick(gift.description, gift.descriptionEn, gift.descriptionAr, this.currentLang) || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private syncFromRoute(): void {
    this.readFiltersFromRoute();
    this.sanitizeCategoryAndCatalogueFilters();
    this.loadTypesForCatalogue();
  }

  get cataloguesForSelectedCategory(): Catalogue[] {
    if (this.selectedCategoryIds.size === 0) return [];
    return this.allCatalogues.filter((c) => c.categorieId != null && this.selectedCategoryIds.has(c.categorieId));
  }

  /** Single catalogue id when exactly one is selected (for type dropdown). */
  get singleSelectedCatalogueId(): number | null {
    if (this.selectedCatalogueIds.size === 1) return [...this.selectedCatalogueIds][0];
    return null;
  }

  cataloguesForCategory(catId: number): Catalogue[] {
    return this.allCatalogues.filter((c) => c.categorieId === catId);
  }

  pagedItemsForSection(section: { key: string; items: Produit[] }): Produit[] {
    const page = this.sectionPages[section.key] ?? 1;
    const start = (page - 1) * this.pageSize;
    return section.items.slice(start, start + this.pageSize);
  }

  /** First 8 products of the current page (before RV section). */
  firstHalfForSection(section: { key: string; items: Produit[] }): Produit[] {
    const page = this.sectionPages[section.key] ?? 1;
    const start = (page - 1) * this.pageSize;
    return section.items.slice(start, start + 8);
  }

  /** Last 8 products of the current page (after RV section). */
  secondHalfForSection(section: { key: string; items: Produit[] }): Produit[] {
    const page = this.sectionPages[section.key] ?? 1;
    const start = (page - 1) * this.pageSize;
    return section.items.slice(start + 8, start + this.pageSize);
  }

  /** Show RV section only inside the first visible section and when there are RV items. */
  isFirstSection(section: { key: string }): boolean {
    return this.productSections.length === 0 || this.productSections[0].key === section.key;
  }

  private refreshRecentlyViewed(): void {
    const rvIds = this.recentlyViewedService.getIds();
    // Show products from RV list, excluding the current filtered set (or just show any RV product)
    const filtered = new Set(this.filteredProduits.map((p) => p.id));
    this.recentlyViewedItems = rvIds
      .map((id) => this.allProduits.find((p) => p.id === id))
      .filter((p): p is Produit => p != null && (p.rubriqueVisiteur ?? 'disponible') !== 'masque' && !filtered.has(p.id))
      .slice(0, this.rvMaxDisplay);

    // If all products are shown (no filter), just take from allProduits excluding current page context
    if (this.recentlyViewedItems.length === 0 && rvIds.length > 0) {
      this.recentlyViewedItems = rvIds
        .map((id) => this.allProduits.find((p) => p.id === id))
        .filter((p): p is Produit => p != null && (p.rubriqueVisiteur ?? 'disponible') !== 'masque')
        .slice(0, this.rvMaxDisplay);
    }
  }

  pagesForSection(section: { items: Produit[] }): number[] {
    const count = Math.max(1, Math.ceil(section.items.length / this.pageSize));
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  sectionPageCount(section: { items: Produit[] }): number {
    return Math.max(1, Math.ceil(section.items.length / this.pageSize));
  }

  currentSectionPage(sectionKey: string): number {
    return this.sectionPages[sectionKey] ?? 1;
  }

  setSectionPage(sectionKey: string, page: number, section: { items: Produit[] }): void {
    const max = this.sectionPageCount(section);
    if (page < 1 || page > max) return;
    this.sectionPages = { ...this.sectionPages, [sectionKey]: page };
  }

  get selectedTypeLabel(): string {
    const fallback = this.labels.allTypes || 'Type de produit';
    if (this.selectedTypeId == null) return fallback;
    const t = this.typesForCatalogue.find((x) => x.id === this.selectedTypeId);
    if (!t) return fallback;
    return pick(t.nom, t.nomEn, t.nomAr, this.currentLang) || fallback;
  }

  get selectedSortLabel(): string {
    return this.sortOptions.find((o) => o.id === this.sortMode)?.label ?? this.labels.sortBy;
  }

  /** Exclut les produits « masque » (chaîne admin inactive). */
  categoryHasProducts(cat: Categorie): boolean {
    const id = cat.id;
    if (id == null) return false;
    return this.allProduits.some(
      (p) =>
        p.categorieId === id && (p.rubriqueVisiteur ?? 'disponible') !== 'masque',
    );
  }

  isCategoryActive(cat: Categorie): boolean {
    return cat.statut !== false;
  }

  categoryRowSelectable(cat: Categorie): boolean {
    return this.isCategoryActive(cat) && this.categoryHasProducts(cat);
  }

  isCatalogueActive(cat: Catalogue): boolean {
    return cat.statut !== false;
  }

  catalogueHasVisibleProducts(cat: Catalogue, categoryId: number): boolean {
    return this.allProduits.some(
      (p) =>
        p.catalogueId === cat.id &&
        p.categorieId === categoryId &&
        (p.rubriqueVisiteur ?? 'disponible') !== 'masque',
    );
  }

  catalogueRowSelectable(cat: Catalogue, categoryId: number): boolean {
    return this.isCatalogueActive(cat) && this.catalogueHasVisibleProducts(cat, categoryId);
  }

  isTypeActive(t: TypeProduit): boolean {
    return t.statut !== false;
  }

  typeHasVisibleProducts(t: TypeProduit): boolean {
    const catId = this.singleSelectedCatalogueId;
    if (this.selectedCategoryIds.size === 0 || catId == null) return false;
    return this.allProduits.some(
      (p) =>
        p.typeProduitId === t.id &&
        p.catalogueId === catId &&
        p.categorieId != null && this.selectedCategoryIds.has(p.categorieId) &&
        (p.rubriqueVisiteur ?? 'disponible') !== 'masque',
    );
  }

  typeRowSelectable(t: TypeProduit): boolean {
    return this.isTypeActive(t) && this.typeHasVisibleProducts(t);
  }

  isPriceBandChecked(key: string): boolean {
    return this.selectedPriceBandKeys.has(key);
  }

  togglePriceBand(key: string, checked: boolean): void {
    if (checked) this.selectedPriceBandKeys.add(key);
    else this.selectedPriceBandKeys.delete(key);
    this.recomputeFiltered();
    this.navigateQuery();
  }

  openFilters(): void {
    this.filterPanelOpen = true;
  }

  closeFilters(): void {
    this.filterPanelOpen = false;
  }

  applyFiltersAndClosePanel(): void {
    this.recomputeFiltered();
    this.navigateQuery();
    this.filterPanelOpen = false;
  }

  onCategoryChange(catId: number, checked: boolean): void {
    const cat = this.categories.find((c) => c.id === catId);
    if (!cat || !this.categoryRowSelectable(cat)) return;
    if (checked) {
      this.selectedCategoryIds.add(catId);
      this.expandedCategoryId = catId;
    } else {
      this.selectedCategoryIds.delete(catId);
      if (this.expandedCategoryId === catId) this.expandedCategoryId = null;
      // Remove catalogues that belonged to this category
      for (const cid of [...this.selectedCatalogueIds]) {
        const c = this.allCatalogues.find((x) => x.id === cid);
        if (c?.categorieId === catId) this.selectedCatalogueIds.delete(cid);
      }
    }
    this.selectedTypeId = null;
    this.typesForCatalogue = [];
    this.loadTypesForCatalogue();
    this.recomputeFiltered();
    this.navigateQuery();
  }

  onCatalogueChange(catalogueId: number, checked: boolean): void {
    if (this.selectedCategoryIds.size === 0) return;
    // Find the parent category
    const cat = this.allCatalogues.find((c) => c.id === catalogueId);
    if (!cat || cat.categorieId == null) return;
    if (!this.selectedCategoryIds.has(cat.categorieId)) return;
    if (!this.catalogueRowSelectable(cat, cat.categorieId)) return;
    this.selectedTypeId = null;
    if (checked) {
      this.selectedCatalogueIds.add(catalogueId);
    } else {
      this.selectedCatalogueIds.delete(catalogueId);
    }
    this.loadTypesForCatalogue();
    this.recomputeFiltered();
    this.navigateQuery();
  }

  toggleCategoryExpand(catId: number): void {
    const cat = this.categories.find((c) => c.id === catId);
    if (!cat || !this.categoryRowSelectable(cat)) return;
    this.expandedCategoryId = this.expandedCategoryId === catId ? null : catId;
    this.accCatalogueOpen = true;
  }

  onCatalogueChangeForCategory(categoryId: number, catalogueId: number, checked: boolean): void {
    const parent = this.categories.find((c) => c.id === categoryId);
    if (!parent || !this.categoryRowSelectable(parent)) return;

    // Auto-select the parent category when a catalogue is checked
    if (checked && !this.selectedCategoryIds.has(categoryId)) {
      this.selectedCategoryIds.add(categoryId);
      this.selectedTypeId = null;
      this.typesForCatalogue = [];
    }
    this.expandedCategoryId = categoryId;

    const cat = this.allCatalogues.find((c) => c.id === catalogueId);
    if (!cat || !this.catalogueRowSelectable(cat, categoryId)) return;

    if (checked) {
      this.selectedCatalogueIds.add(catalogueId);
    } else {
      this.selectedCatalogueIds.delete(catalogueId);
    }
    this.selectedTypeId = null;
    this.loadTypesForCatalogue();
    this.recomputeFiltered();
    this.navigateQuery();
  }

  isCategoryChecked(id: number): boolean {
    return this.selectedCategoryIds.has(id);
  }

  isCatalogueChecked(id: number): boolean {
    return this.selectedCatalogueIds.has(id);
  }

  selectTypeFromDropdown(t: TypeProduit | null): void {
    if (t != null && !this.typeRowSelectable(t)) return;
    this.selectedTypeId = t?.id ?? null;
    this.typeDropdownOpen = false;
    this.recomputeFiltered();
    this.navigateQuery();
  }

  setSortMode(mode: ProductSortMode): void {
    this.sortMode = mode;
    this.sortDropdownOpen = false;
    this.recomputeFiltered();
  }

  isFavorite(productId: number): boolean {
    return this.favorites.has(productId);
  }

  toggleFavorite(event: Event, p: Produit): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle({
      productId: p.id,
      name: p.nom,
      imageUrl: this.resolveProductImage(p),
      priceLabel: this.getDisplayPrice(p),
      categorieNom: p.categorieNom,
      catalogueNom: p.catalogueNom,
      typeProduitNom: p.typeProduitNom,
      volumeLabel: FavoritesService.volumeSummaryFromProduit(p),
    });
  }

  getDisplayPrice(product: Produit): string {
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

  resolveProductImage(product: Produit): string {
    // 1. Image principale marquée en DB
    const principal = (product.medias ?? []).find(m => m.kind === 'image' && m.estPrincipale && !!m.url);
    if (principal) return principal.url;
    // 2. Première image disponible en DB
    const first = (product.medias ?? []).find(m => m.kind === 'image' && !!m.url);
    if (first) return first.url;
    // 3. Fallback assets locaux pour anciens produits
    if (product.id === this.raffinProductId) return this.raffinImage;
    if (product.id === this.naturelProductId) return this.naturelImage;
    if (product.id === this.mielProductId) return this.mielImage;
    if (product.id === this.amlouProductId) return this.amlouImage;
    if (product.id === this.visageProductId) return this.visageImage;
    if (product.id === this.moyenneGalleryProductId) return this.moyenne1Image;
    return STATIC_PRODUCT_IMAGE_URL;
  }

  typeLine(product: Produit): string {
    return pick(product.typeProduitNom, product.typeProduitNomEn, product.typeProduitNomAr, this.currentLang) || 'Myrass';
  }

  rubriqueBadgeLabel(product: Produit): string | null {
    const r = product.rubriqueVisiteur ?? 'disponible';
    if (r === 'rupture') return this.labels.outOfStock;
    if (r === 'avenir') return this.labels.comingUp;
    return null;
  }

  isRubriqueDimmed(product: Produit): boolean {
    const r = product.rubriqueVisiteur ?? 'disponible';
    return r === 'rupture' || r === 'avenir';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as Node;
    if (!this.host.nativeElement.contains(t)) {
      this.typeDropdownOpen = false;
      this.sortDropdownOpen = false;
    }
  }

  toggleTypeDropdown(ev: Event): void {
    ev.stopPropagation();
    if (this.singleSelectedCatalogueId == null) return;
    this.typeDropdownOpen = !this.typeDropdownOpen;
    this.sortDropdownOpen = false;
  }

  toggleSortDropdown(ev: Event): void {
    ev.stopPropagation();
    this.sortDropdownOpen = !this.sortDropdownOpen;
    this.typeDropdownOpen = false;
  }

  private readFiltersFromRoute(): void {
    const qp = this.route.snapshot.queryParamMap;
    const cats = qp.get('categorieId');
    const catals = qp.get('catalogueId');
    const tp = qp.get('typeProduitId');

    this.selectedCategoryIds = new Set(
      (cats ?? '').split(',').map(Number).filter((n) => n > 0 && Number.isFinite(n)),
    );
    this.selectedCatalogueIds = new Set(
      (catals ?? '').split(',').map(Number).filter((n) => n > 0 && Number.isFinite(n)),
    );
    const tpNum = tp ? +tp : NaN;
    this.selectedTypeId = Number.isFinite(tpNum) && tpNum > 0 ? tpNum : null;
  }

  private sanitizeCategoryAndCatalogueFilters(): void {
    for (const id of [...this.selectedCategoryIds]) {
      const c = this.categories.find((x) => x.id === id);
      if (!c || !this.isCategoryActive(c) || !this.categoryHasProducts(c)) {
        this.selectedCategoryIds.delete(id);
        // Remove catalogues belonging to this removed category
        for (const cid of [...this.selectedCatalogueIds]) {
          const cat = this.allCatalogues.find((x) => x.id === cid);
          if (cat?.categorieId === id) this.selectedCatalogueIds.delete(cid);
        }
        if (this.expandedCategoryId === id) this.expandedCategoryId = null;
      }
    }
    for (const id of [...this.selectedCatalogueIds]) {
      const cat = this.allCatalogues.find((x) => x.id === id);
      if (
        !cat ||
        !this.isCatalogueActive(cat) ||
        cat.categorieId == null ||
        !this.selectedCategoryIds.has(cat.categorieId) ||
        !this.catalogueHasVisibleProducts(cat, cat.categorieId)
      ) {
        this.selectedCatalogueIds.delete(id);
        this.selectedTypeId = null;
      }
    }
  }

  private loadTypesForCatalogue(): void {
    const cid = this.singleSelectedCatalogueId;
    if (cid == null) {
      this.typesForCatalogue = [];
      this.selectedTypeId = null;
      this.recomputeFiltered();
      return;
    }
    this.typeProduitService
      .getAll({ catalogueId: cid })
      .pipe(takeUntil(this.destroy$), take(1), catchError(() => of<TypeProduit[]>([])))
      .subscribe((rows) => {
        this.typesForCatalogue = rows ?? [];
        if (this.selectedTypeId != null) {
          const t = this.typesForCatalogue.find((x) => x.id === this.selectedTypeId);
          if (!t || !this.typeRowSelectable(t)) this.selectedTypeId = null;
        }
        this.recomputeFiltered();
      });
  }

  private navigateQuery(): void {
    const q: Record<string, string> = {};
    if (this.selectedCategoryIds.size > 0) q['categorieId'] = [...this.selectedCategoryIds].join(',');
    if (this.selectedCatalogueIds.size > 0) q['catalogueId'] = [...this.selectedCatalogueIds].join(',');
    if (this.selectedTypeId != null) q['typeProduitId'] = String(this.selectedTypeId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: Object.keys(q).length ? q : {},
      replaceUrl: true,
    });
  }

  /** Prix minimum affiché (USD) pour filtres / tri, y compris fourchette « min – max ». */
  private minPriceUsd(p: Produit): number {
    const label = this.getDisplayPrice(p);
    const matches = label.match(/(\d+(?:\.\d+)?)/g);
    if (matches?.length) {
      const vals = matches.map((x) => parseFloat(x)).filter((n) => Number.isFinite(n));
      if (vals.length) return Math.min(...vals);
    }
    return Number(p.prix ?? 0);
  }

  private priceBandMatches(key: string, usd: number): boolean {
    switch (key) {
      case '0-25':
        return usd >= 0 && usd < 25;
      case '25-50':
        return usd >= 25 && usd < 50;
      case '50-100':
        return usd >= 50 && usd < 100;
      case '100-200':
        return usd >= 100 && usd < 200;
      case '200+':
        return usd >= 200;
      default:
        return false;
    }
  }

  productRating(productId: number): AvisProduitResumeDto | undefined {
    return this.avisByProduitId.get(productId);
  }

  starsArrayCount(n: number): number[] {
    return Array(Math.max(0, Math.round(n))).fill(0);
  }

  starsForProductCard(moyenne: number): number[] {
    return this.starsArrayCount(Math.round(Number(moyenne) || 0));
  }

  private partitionByRubrique(list: Produit[]): { key: string; label: string; items: Produit[] }[] {
    const labels: Record<string, string> = {
      disponible: this.labels.available,
      rupture: this.labels.outOfStock,
      avenir: this.labels.comingUp,
    };
    const order = ['disponible', 'rupture', 'avenir'] as const;
    const groups = new Map<string, Produit[]>();
    for (const k of order) groups.set(k, []);
    for (const p of list) {
      const r = (p.rubriqueVisiteur ?? 'disponible') as string;
      if (groups.has(r)) groups.get(r)!.push(p);
    }
    return order
      .map((key) => ({ key, label: labels[key], items: groups.get(key)! }))
      .filter((s) => s.items.length > 0);
  }

  onSearch(term: string): void {
    this.searchTerm = term ?? '';
    this.recomputeFiltered();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.recomputeFiltered();
    // Réinitialiser la valeur de l'input visuellement
    const input = document.querySelector('.search-bar__input') as HTMLInputElement;
    if (input) input.value = '';
  }

  private recomputeFiltered(): void {
    let list = this.allProduits.filter(
      (p) => (p.rubriqueVisiteur ?? 'disponible') !== 'masque',
    );

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.nom || '').toLowerCase().includes(q) ||
          (p.nomEn || '').toLowerCase().includes(q) ||
          (p.nomAr || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      );
    }

    if (this.selectedCategoryIds.size > 0) {
      list = list.filter((p) => p.categorieId != null && this.selectedCategoryIds.has(p.categorieId));
    }
    if (this.selectedCatalogueIds.size > 0) {
      list = list.filter((p) => p.catalogueId != null && this.selectedCatalogueIds.has(p.catalogueId));
    }
    if (this.selectedTypeId != null) {
      list = list.filter((p) => p.typeProduitId === this.selectedTypeId);
    }

    if (this.selectedPriceBandKeys.size > 0) {
      list = list.filter((p) => {
        const m = this.minPriceUsd(p);
        return [...this.selectedPriceBandKeys].some((k) => this.priceBandMatches(k, m));
      });
    }

    list = this.applySort(list);
    this.filteredProduits = list;
    this.productSections = this.partitionByRubrique(list);
    const nextPages: Record<string, number> = {};
    for (const s of this.productSections) {
      nextPages[s.key] = 1;
    }
    this.sectionPages = nextPages;
    this.refreshRecentlyViewed();
  }

  private applySort(list: Produit[]): Produit[] {
    const out = [...list];
    switch (this.sortMode) {
      case 'priceAsc':
        out.sort((a, b) => this.minPriceUsd(a) - this.minPriceUsd(b));
        break;
      case 'priceDesc':
        out.sort((a, b) => this.minPriceUsd(b) - this.minPriceUsd(a));
        break;
      case 'newProducts':
        out.sort((a, b) => b.id - a.id);
        break;
      case 'bestSellers':
        out.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
        break;
      case 'topRated':
        out.sort((a, b) => {
          const ra = this.avisByProduitId.get(a.id)?.moyenne ?? 0;
          const rb = this.avisByProduitId.get(b.id)?.moyenne ?? 0;
          if (rb !== ra) return rb - ra;
          return (this.avisByProduitId.get(b.id)?.nombre ?? 0) - (this.avisByProduitId.get(a.id)?.nombre ?? 0);
        });
        break;
      default:
        break;
    }
    return out;
  }
}
