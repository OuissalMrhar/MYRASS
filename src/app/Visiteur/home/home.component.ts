import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, finalize, take, takeUntil } from 'rxjs';
import { Categorie } from '../../models/categorie.model';
import { Produit } from '../../models/produit.model';
import { CategorieService } from '../../services/categorie.service';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { STATIC_PRODUCT_IMAGE_URL } from '../../core/static-product-image';
import { ProduitService } from '../../services/produit.service';
import { Gift } from '../../models/gift.model';
import { GiftService } from '../../services/gift.service';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang, pick } from '../../core/visitor-i18n';
import { CurrencyService } from '../../services/currency.service';
import { SeoService } from '../../core/seo.service';

interface HomeCategoryCard extends Categorie {
  isComingSoon?: boolean;
}

export interface BestsellerSlide {
  id: number;
  title: string;
  desc: string;
  cardTeaser: string;
  price: string;
  imageUrl: string | null;
  fallbackImageClass: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  currentLang: SiteLang = 'fr';
  readonly homeLabels$ = this.siteLang.homeLabels$;
  readonly lang$ = this.siteLang.lang$;


  private rawBestsellers: Produit[] = [];

  isLoginOpen = false;
  isRegisterOpen = false;
  activeProductIndex = 0;
  activeCategoryIndex = 0;
  isMobileProductsCarousel = false;
  /** Mobile best-sellers : description tronquée + « Voir plus » */
  mobileBestsellerDescExpanded = false;
  brandStoryExpanded = false;
  /** Grille 2×2 (4 cartes) + pagination sous 768px */
  isMobileCollectionsPaginated = false;
  collectionsPageIndex = 0;
  readonly collectionsPerPage = 4;
  categories: Categorie[] = [];
  isCategoriesLoading = false;
  /** Grille 2×2 : au moins 4 emplacements (réel + « Available soon » si besoin) */
  readonly minCategoriesToDisplay = 3;

  bestsellerSlides: BestsellerSlide[] = [];
  isBestsellersLoading = false;

  gifts: Gift[] = [];
  isGiftsLoading = false;

  private readonly fallbackBestsellerSlides: BestsellerSlide[] = [
    {
      id: -1,
      title: 'Get more with ',
      desc:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation.',
      cardTeaser: 'Set of 4',
      price: '$55.00',
      imageUrl: null,
      fallbackImageClass: 'prod-1',
    },
    {
      id: -2,
      title: 'Harvest Salad Plates Quartet',
      desc:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation.',
      cardTeaser: 'Set of 4',
      price: '$55.00',
      imageUrl: null,
      fallbackImageClass: 'prod-2',
    },
    {
      id: -3,
      title: 'Harvest Salad Plates Quartet',
      desc:
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation.',
      cardTeaser: 'Set of 4',
      price: '$55.00',
      imageUrl: null,
      fallbackImageClass: 'prod-3',
    },
  ];

  readonly partnerFeatures = [
    'Durable Ceramics',
    'Oven Safe',
    'Dishwasher Safe',
    'Easy Care',
    'Microwave Safe'
  ];

  constructor(
    private categorieService: CategorieService,
    private produitService: ProduitService,
    private giftService: GiftService,
    private router: Router,
    private productRoutes: ProductRoutingHelper,
    private siteLang: SiteLanguageService,
    private currencyService: CurrencyService,
    private seo: SeoService,
  ) {}

  switchToRegister() {
    this.isLoginOpen = false;
    setTimeout(() => {
      this.isRegisterOpen = true;
    }, 300);
  }

  prevProduct() {
    const total = this.effectiveBestsellerCount;
    if (total === 0) return;
    this.activeProductIndex = (this.activeProductIndex - 1 + total) % total;
    this.mobileBestsellerDescExpanded = false;
  }

  nextProduct() {
    const total = this.effectiveBestsellerCount;
    if (total === 0) return;
    this.activeProductIndex = (this.activeProductIndex + 1) % total;
    this.mobileBestsellerDescExpanded = false;
  }

  goToProduct(index: number) {
    const total = this.effectiveBestsellerCount;
    if (total === 0) return;
    this.activeProductIndex = Math.min(Math.max(0, index), total - 1);
    this.mobileBestsellerDescExpanded = false;
  }

  toggleMobileBestsellerDesc(): void {
    this.mobileBestsellerDescExpanded = !this.mobileBestsellerDescExpanded;
  }

  toggleBrandStory(): void {
    this.brandStoryExpanded = !this.brandStoryExpanded;
  }

  get activeBestsellerSlide(): BestsellerSlide | null {
    const s = this.bestsellerSlides;
    if (!s.length) return null;
    const idx = Math.min(Math.max(0, this.activeProductIndex), s.length - 1);
    return s[idx];
  }

  get bestsellerSidebarTitle(): string {
    return this.activeBestsellerSlide?.title?.trim() || 'Bestsellers';
  }

  get bestsellerSidebarDescription(): string {
    return this.activeBestsellerSlide?.desc ?? '';
  }

  cardBackgroundImage(slide: BestsellerSlide): string | null {
    if (!slide.imageUrl) return null;
    const safe = slide.imageUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `url("${safe}")`;
  }

  onBestsellerCardClick(slide: BestsellerSlide): void {
    if (slide.id > 0) {
      void this.router.navigate(this.productRoutes.detailLink(slide.title, slide.id));
    }
  }

  private get effectiveBestsellerCount(): number {
    return this.bestsellerSlides.length;
  }

  get trackTranslatePercent(): number {
    if (!this.bestsellerSlides.length) return 0;
    return this.activeProductIndex * 100;
  }

  get trackTransform(): string {
    return this.isMobileProductsCarousel ? `translateX(-${this.trackTranslatePercent}%)` : 'translateX(0)';
  }

  get partnerFeaturesLoop(): string[] {
    return [...this.partnerFeatures, ...this.partnerFeatures, ...this.partnerFeatures];
  }

  get displayedCategories(): HomeCategoryCard[] {
    const realCards: HomeCategoryCard[] = this.categories.map((category) => ({
      ...category,
      isComingSoon: false
    }));

    if (realCards.length >= this.minCategoriesToDisplay) {
      return realCards;
    }

    const placeholdersToAdd = this.minCategoriesToDisplay - realCards.length;
    const placeholderCards: HomeCategoryCard[] = Array.from({ length: placeholdersToAdd }, (_, index) => ({
      id: -1000 - index,
      nom: 'Available soon',
      description: '',
      isComingSoon: true
    }));

    return [...realCards, ...placeholderCards];
  }

  get collectionsTotalPages(): number {
    const n = this.displayedCategories.length;
    if (n === 0) return 0;
    return Math.ceil(n / this.collectionsPerPage);
  }

  get visibleCollectionCategories(): HomeCategoryCard[] {
    const all = this.displayedCategories;
    if (!this.isMobileCollectionsPaginated || all.length === 0) {
      return all;
    }
    const start = this.collectionsPageIndex * this.collectionsPerPage;
    return all.slice(start, start + this.collectionsPerPage);
  }

  get collectionsPageIndices(): number[] {
    return Array.from({ length: this.collectionsTotalPages }, (_, i) => i);
  }

  categoryBgClass(localIndex: number): string {
    const globalIdx = this.isMobileCollectionsPaginated
      ? this.collectionsPageIndex * this.collectionsPerPage + localIndex
      : localIndex;
    return 'c-' + ((globalIdx % 3) + 1);
  }

  selectCategory(index: number): void {
    this.activeCategoryIndex = index;
  }

  get activeCategoryDescription(): string {
    const cats = this.visibleCollectionCategories;
    if (!cats.length) return '';
    const cat = cats[this.activeCategoryIndex];
    if (!cat) return '';
    return pick(cat.description, cat.descriptionEn, cat.descriptionAr, this.currentLang)?.trim() || '';
  }

  prevCollectionsPage(): void {
    if (this.collectionsPageIndex > 0) this.collectionsPageIndex--;
  }

  nextCollectionsPage(): void {
    if (this.collectionsPageIndex < this.collectionsTotalPages - 1) {
      this.collectionsPageIndex++;
    }
  }

  goCollectionsPage(p: number): void {
    if (p >= 0 && p < this.collectionsTotalPages) {
      this.collectionsPageIndex = p;
    }
  }

  private clampCollectionsPageIndex(): void {
    const n = this.displayedCategories.length;
    if (n === 0) {
      this.collectionsPageIndex = 0;
      return;
    }
    const pages = Math.ceil(n / this.collectionsPerPage);
    if (this.collectionsPageIndex > pages - 1) {
      this.collectionsPageIndex = Math.max(0, pages - 1);
    }
  }

  ngOnInit(): void {
    this.seo.set({
      title: 'Accueil',
      description: "Myrass – Coffrets cadeaux et produits gourmets marocains d'exception : huile d'argan, miel, amlou.",
    });
    this.updateViewportFlags();
    this.loadCategories();
    this.loadBestsellers();
    this.loadGifts();

    // Re-mapper les slides quand la langue change
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
      this.currentLang = lang;
      if (this.rawBestsellers.length > 0) {
        this.bestsellerSlides = this.rawBestsellers.map((p, i) => this.mapProduitToSlide(p, i));
      }
    });

    // Re-mapper les slides quand la devise change
    this.currencyService.currency$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.rawBestsellers.length > 0) {
        this.bestsellerSlides = this.rawBestsellers.map((p, i) => this.mapProduitToSlide(p, i));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  giftImageUrl(gift: Gift): string {
    if (gift.imageUrl?.trim()) return gift.imageUrl.trim();
    const fromProduit = gift.produits?.find(p => !!p.produitImageUrl)?.produitImageUrl?.trim();
    if (fromProduit) return fromProduit;
    // Fallback Aïd Al-Adha
    const nom = (gift.nom || '').toLowerCase();
    if (nom.includes('aid') || nom.includes('adha') || nom.includes('aïd'))
      return 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1777159305/ChatGPT_Image_26_avr._2026_00_20_16_styg3q.png';
    return 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1777159305/ChatGPT_Image_26_avr._2026_00_20_16_styg3q.png';
  }

  goToGiftDetail(gift: Gift): void {
    void this.router.navigate(['/details-gift', gift.id]);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportFlags();
  }

  private updateViewportFlags(): void {
    const prevCollectionsMobile = this.isMobileCollectionsPaginated;
    this.isMobileProductsCarousel = window.innerWidth <= 992;
    this.isMobileCollectionsPaginated = window.innerWidth <= 768;
    if (prevCollectionsMobile !== this.isMobileCollectionsPaginated) {
      this.collectionsPageIndex = 0;
    }
    this.clampCollectionsPageIndex();
  }

  private loadBestsellers(): void {
    this.isBestsellersLoading = true;
    this.produitService
      .getBestsellers(3)
      .pipe(
        take(1),
        finalize(() => {
          this.isBestsellersLoading = false;
        }),
      )
      .subscribe({
        next: (list) => {
          if (list.length > 0) {
            this.applyBestsellerList(list);
            return;
          }
          this.tryBestsellerFallbackFromAll();
        },
        error: () => {
          this.tryBestsellerFallbackFromAll();
        },
      });
  }

  private tryBestsellerFallbackFromAll(): void {
    this.produitService
      .getAll()
      .pipe(take(1))
      .subscribe({
        next: (all) => {
          const pick = all.slice(0, 3);
          if (pick.length > 0) {
            this.applyBestsellerList(pick);
          } else {
            this.bestsellerSlides = [...this.fallbackBestsellerSlides];
            this.activeProductIndex = 0;
          }
        },
        error: () => {
          this.bestsellerSlides = [...this.fallbackBestsellerSlides];
          this.activeProductIndex = 0;
        },
      });
  }

  private applyBestsellerList(products: Produit[]): void {
    this.rawBestsellers = products;
    this.bestsellerSlides = products.map((p, i) => this.mapProduitToSlide(p, i));
    this.activeProductIndex = 0;
  }

  private mapProduitToSlide(p: Produit, index: number): BestsellerSlide {
    const nom = pick(p.nom, p.nomEn, p.nomAr, this.currentLang) || 'Produit';
    const desc = pick(p.description, p.descriptionEn, p.descriptionAr, this.currentLang);
    const plain = this.plainProductDescription(desc, 2400);
    const teaser =
      (plain.length <= 90 ? plain : plain.slice(0, 90).trim() + '…') ||
      pick(p.typeProduitNom, p.typeProduitNomEn, p.typeProduitNomAr, this.currentLang) ||
      pick(p.catalogueNom, p.catalogueNomEn, p.catalogueNomAr, this.currentLang) ||
      '';
    return {
      id: p.id,
      title: nom,
      desc: plain,
      cardTeaser: teaser,
      price: this.formatBestsellerPrice(p),
      imageUrl: this.resolveBestsellerImage(p),
      fallbackImageClass: 'prod-' + ((index % 3) + 1),
    };
  }

  private plainProductDescription(raw: string | null | undefined, maxLen = 420): string {
    if (!raw) return '';
    const text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim() + '…';
  }

  private resolveBestsellerImage(product: Produit): string | null {
    const images = (product.medias ?? []).filter(m => m.kind === 'image');
    if (!images.length) return null;
    const primary = images.find(m => m.estPrincipale) ?? images.sort((a, b) => a.ordre - b.ordre)[0];
    return primary?.url ?? null;
  }

  private formatBestsellerPrice(p: Produit): string {
    const hasType = !!p.typeProduitId || !!p.typeProduitNom;
    const tailles =
      p.tailles ??
      p.volumes?.map((v) => ({
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

    if (tailles.length > 1) {
      const prices = tailles.map((t) => Number(t.prix ?? 0));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return this.currencyService.formatRange(min, max);
    }
    if (tailles.length === 1) {
      return this.currencyService.format(Number(tailles[0].prix ?? p.prix ?? 0));
    }
    return this.currencyService.format(Number(p.prix ?? 0));
  }

  private loadGifts(): void {
    this.isGiftsLoading = true;
    this.giftService.getAll().pipe(
      take(1),
      finalize(() => { this.isGiftsLoading = false; })
    ).subscribe({
      next: (gifts) => {
        // Home shows only packs NOT starting with "cadeaux" (e.g. Pack Ramadan)
        this.gifts = gifts.filter(g => !g.nom?.trim().toLowerCase().startsWith('cadeaux'));
      },
      error: () => { this.gifts = []; }
    });
  }

  private loadCategories(): void {
    this.isCategoriesLoading = true;
    this.categorieService.getAll().pipe(
      take(1),
      finalize(() => {
        this.isCategoriesLoading = false;
      })
    ).subscribe({
      next: (items: any) => {
        const normalized = Array.isArray(items) ? items.map((item: any) => ({
          id: item?.id ?? item?.Id,
          nom: item?.nom ?? item?.Nom ?? '',
          nomEn: item?.nomEn ?? item?.NomEn ?? null,
          nomAr: item?.nomAr ?? item?.NomAr ?? null,
          description: item?.description ?? item?.Description ?? '',
          descriptionEn: item?.descriptionEn ?? item?.DescriptionEn ?? null,
          descriptionAr: item?.descriptionAr ?? item?.DescriptionAr ?? null,
          statut: item?.statut ?? item?.Statut ?? true,
        })) : [];

        this.categories = normalized.filter((c: Categorie) => !!c.nom?.trim());
        this.clampCollectionsPageIndex();
      },
      error: () => {
        this.categories = [];
        this.collectionsPageIndex = 0;
      }
    });
  }
}
