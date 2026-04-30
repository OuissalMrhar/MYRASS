import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, finalize, take, takeUntil } from 'rxjs';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang, pick } from '../../core/visitor-i18n';
import { Gift } from '../../models/gift.model';
import { GiftService } from '../../services/gift.service';
import { Produit } from '../../models/produit.model';
import { ProduitService } from '../../services/produit.service';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { CurrencyService } from '../../services/currency.service';

interface BestsellerSlide {
  id: number;
  title: string;
  desc: string;
  cardTeaser: string;
  price: string;
  imageUrl: string | null;
  fallbackImageClass: string;
}

@Component({
  selector: 'app-accueil1',
  templateUrl: './accueil1.component.html',
  styleUrls: ['./accueil1.component.scss'],
})
export class Accueil1Component implements OnInit, OnDestroy {
  readonly homeLabels$ = this.siteLang.homeLabels$;
  private readonly destroy$ = new Subject<void>();

  currentLang: SiteLang = 'fr';

  private rawBestsellers: Produit[] = [];
  activeProductIndex = 0;
  isMobileProductsCarousel = false;
  mobileBestsellerDescExpanded = false;
  bestsellerSlides: BestsellerSlide[] = [];
  isBestsellersLoading = false;

  brandStoryExpanded = false;
  aidDescExpanded = false;

  gifts: Gift[] = [];
  isGiftsLoading = false;

  partnerHomeEmail = '';
  newsletterHomeEmail = '';

  readonly partnerFeatures = [
    'Durable Ceramics',
    'Oven Safe',
    'Dishwasher Safe',
    'Easy Care',
    'Microwave Safe',
  ];

  constructor(
    private readonly siteLang: SiteLanguageService,
    private readonly produitService: ProduitService,
    private readonly giftService: GiftService,
    private readonly router: Router,
    private readonly productRoutes: ProductRoutingHelper,
    private readonly currencyService: CurrencyService,
  ) {}

  ngOnInit(): void {
    this.updateViewportFlags();
    this.loadBestsellers();
    this.loadGifts();
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
      this.currentLang = lang;
      if (this.rawBestsellers.length > 0) {
        this.bestsellerSlides = this.rawBestsellers.map((p, i) => this.mapProduitToSlide(p, i));
      }
    });

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

  toggleBrandStory(): void {
    this.brandStoryExpanded = !this.brandStoryExpanded;
  }

  prevProduct(): void {
    const total = this.bestsellerSlides.length;
    if (total === 0) return;
    this.activeProductIndex = (this.activeProductIndex - 1 + total) % total;
    this.mobileBestsellerDescExpanded = false;
  }

  nextProduct(): void {
    const total = this.bestsellerSlides.length;
    if (total === 0) return;
    this.activeProductIndex = (this.activeProductIndex + 1) % total;
    this.mobileBestsellerDescExpanded = false;
  }

  goToProduct(index: number): void {
    const total = this.bestsellerSlides.length;
    if (total === 0) return;
    this.activeProductIndex = Math.min(Math.max(0, index), total - 1);
    this.mobileBestsellerDescExpanded = false;
  }

  toggleMobileBestsellerDesc(): void {
    this.mobileBestsellerDescExpanded = !this.mobileBestsellerDescExpanded;
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
    const optimized = this.cloudinaryOptimize(slide.imageUrl, this.isMobileProductsCarousel ? 720 : 980);
    const safe = optimized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `url("${safe}")`;
  }

  private cloudinaryOptimize(url: string, width: number, force = false): string {
    if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
    const [prefix, rest] = url.split('/upload/');
    if (!rest) return url;
    const hasTransformSegment = !/^v\d+\//.test(rest);
    if (!force && hasTransformSegment && /w_\d+/.test(rest) && /q_auto(?::eco)?/.test(rest)) {
      return url;
    }
    const pathWithoutTransform = hasTransformSegment ? rest.slice(rest.indexOf('/') + 1) : rest;
    return `${prefix}/upload/f_auto,q_auto:eco,c_limit,w_${width}/${pathWithoutTransform}`;
  }

  onBestsellerCardClick(slide: BestsellerSlide): void {
    if (slide.id > 0) {
      void this.router.navigate(this.productRoutes.detailLink(slide.title, slide.id));
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportFlags();
  }

  private updateViewportFlags(): void {
    this.isMobileProductsCarousel = window.innerWidth <= 992;
  }

  toggleAidDesc(): void {
    this.aidDescExpanded = !this.aidDescExpanded;
  }

  get partnerFeaturesLoop(): string[] {
    return [...this.partnerFeatures, ...this.partnerFeatures, ...this.partnerFeatures];
  }

  giftImageUrl(gift: Gift): string {
    if (gift.imageUrl?.trim()) return gift.imageUrl.trim();
    const fromProduit = gift.produits?.find((p) => !!p.produitImageUrl)?.produitImageUrl?.trim();
    if (fromProduit) return fromProduit;
    return 'https://res.cloudinary.com/dzajgsdwg/image/upload/f_auto,q_auto:eco,c_limit,w_900/v1777159305/ChatGPT_Image_26_avr._2026_00_20_16_styg3q.png';
  }

  goToGiftDetail(gift: Gift): void {
    void this.router.navigate(['/details-gift', gift.id]);
  }

  private loadGifts(): void {
    this.isGiftsLoading = true;
    this.giftService
      .getAll()
      .pipe(
        take(1),
        finalize(() => {
          this.isGiftsLoading = false;
        }),
      )
      .subscribe({
        next: (gifts) => {
          const list = gifts ?? [];
          // Prefer Aid/Adha coffret if present.
          const aidOnly = list.filter((g) => {
            const nom = (g.nom || '').toLowerCase();
            return nom.includes('aid') || nom.includes('adha') || nom.includes('aïd');
          });
          this.gifts = (aidOnly.length ? aidOnly : list).slice(0, 1);
        },
        error: () => {
          this.gifts = [];
        },
      });
  }

  private loadBestsellers(): void {
    this.isBestsellersLoading = true;
    this.produitService
      .getAll()
      .pipe(
        take(1),
        finalize(() => {
          this.isBestsellersLoading = false;
        }),
      )
      .subscribe({
        next: (all) => {
          const pickList = (all ?? []).slice(0, 3);
          if (pickList.length > 0) {
            this.rawBestsellers = pickList;
            this.bestsellerSlides = pickList.map((p: Produit, i: number) => this.mapProduitToSlide(p, i));
            this.activeProductIndex = 0;
            return;
          }
          this.bestsellerSlides = [...this.fallbackBestsellerSlides];
          this.activeProductIndex = 0;
        },
        error: () => {
          this.bestsellerSlides = [...this.fallbackBestsellerSlides];
          this.activeProductIndex = 0;
        },
      });
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
    const images = (product.medias ?? []).filter((m) => m.kind === 'image');
    if (!images.length) return null;
    const primary =
      images.find((m) => (m as any).estPrincipale) ??
      images.sort((a: any, b: any) => (a.ordre ?? 0) - (b.ordre ?? 0))[0];
    return (primary as any)?.url ?? null;
  }

  private formatBestsellerPrice(p: Produit): string {
    const hasType = !!(p as any).typeProduitId || !!(p as any).typeProduitNom;
    const tailles =
      (p as any).tailles ??
      (p as any).volumes?.map((v: any) => ({
        tailleId: v.volumeId,
        prix: v.prix,
        stock: v.stock,
      })) ??
      [];

    if (hasType && tailles.length > 0) {
      const min = Math.min(...tailles.map((t: any) => Number(t.prix ?? 0)));
      const max = Math.max(...tailles.map((t: any) => Number(t.prix ?? 0)));
      return this.currencyService.formatRange(min, max);
    }

    if (tailles.length > 1) {
      const prices = tailles.map((t: any) => Number(t.prix ?? 0));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return this.currencyService.formatRange(min, max);
    }
    if (tailles.length === 1) {
      return this.currencyService.format(Number(tailles[0].prix ?? (p as any).prix ?? 0));
    }
    return this.currencyService.format(Number((p as any).prix ?? 0));
  }

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

  private static isValidHomeEmail(s: string): boolean {
    const t = s.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }

  submitPartnerEmailFromHome(ev: Event): void {
    ev.preventDefault();
    const e = this.partnerHomeEmail.trim();
    if (!Accueil1Component.isValidHomeEmail(e)) return;
    void this.router.navigate(['/contact'], { queryParams: { tab: 'partnership', email: e } });
  }

  submitNewsletterEmailFromHome(ev: Event): void {
    ev.preventDefault();
    const e = this.newsletterHomeEmail.trim();
    if (!Accueil1Component.isValidHomeEmail(e)) return;
    void this.router.navigate(['/contact'], { queryParams: { tab: 'contact', email: e } });
  }
}

