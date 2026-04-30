import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, finalize, take, takeUntil } from 'rxjs';
import { SiteLanguageService } from '../../core/site-language.service';
import { pick, SiteLang } from '../../core/visitor-i18n';
import { Categorie } from '../../models/categorie.model';
import { Gift } from '../../models/gift.model';
import { CategorieService } from '../../services/categorie.service';
import { GiftService } from '../../services/gift.service';

interface HomeCategoryCard extends Categorie {
  isComingSoon?: boolean;
}

@Component({
  selector: 'app-accueil1',
  templateUrl: './accueil1.component.html',
  styleUrls: ['./accueil1.component.scss'],
})
export class Accueil1Component implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly homeLabels$ = this.siteLang.homeLabels$;
  brandStoryExpanded = false;

  currentLang: SiteLang = 'fr';

  categories: Categorie[] = [];
  isCategoriesLoading = false;
  activeCategoryIndex = 0;
  isMobileCollectionsPaginated = false;
  collectionsPageIndex = 0;
  readonly collectionsPerPage = 4;
  readonly minCategoriesToDisplay = 3;

  gifts: Gift[] = [];
  isGiftsLoading = false;
  aidDescExpanded = false;

  partnerHomeEmail = '';
  newsletterHomeEmail = '';

  constructor(
    private readonly siteLang: SiteLanguageService,
    private readonly categorieService: CategorieService,
    private readonly giftService: GiftService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.updateViewportFlags();
    this.loadCategories();
    this.loadAidAdhaGifts();

    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
      this.currentLang = lang;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleBrandStory(): void {
    this.brandStoryExpanded = !this.brandStoryExpanded;
  }

  toggleAidDesc(): void {
    this.aidDescExpanded = !this.aidDescExpanded;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportFlags();
  }

  private updateViewportFlags(): void {
    const prevCollectionsMobile = this.isMobileCollectionsPaginated;
    this.isMobileCollectionsPaginated = window.innerWidth <= 768;
    if (prevCollectionsMobile !== this.isMobileCollectionsPaginated) {
      this.collectionsPageIndex = 0;
      this.activeCategoryIndex = 0;
    }
    this.clampCollectionsPageIndex();
  }

  get displayedCategories(): HomeCategoryCard[] {
    const realCards: HomeCategoryCard[] = this.categories.map((category) => ({
      ...category,
      isComingSoon: false,
    }));
    if (realCards.length >= this.minCategoriesToDisplay) return realCards;

    const placeholdersToAdd = this.minCategoriesToDisplay - realCards.length;
    const placeholderCards: HomeCategoryCard[] = Array.from(
      { length: placeholdersToAdd },
      (_, index) => ({
        id: -1000 - index,
        nom: 'Available soon',
        description: '',
        isComingSoon: true,
      }),
    );
    return [...realCards, ...placeholderCards];
  }

  get collectionsTotalPages(): number {
    const n = this.displayedCategories.length;
    if (n === 0) return 0;
    return Math.ceil(n / this.collectionsPerPage);
  }

  get visibleCollectionCategories(): HomeCategoryCard[] {
    const all = this.displayedCategories;
    if (!this.isMobileCollectionsPaginated || all.length === 0) return all;
    const start = this.collectionsPageIndex * this.collectionsPerPage;
    return all.slice(start, start + this.collectionsPerPage);
  }

  get collectionsPageIndices(): number[] {
    return Array.from({ length: this.collectionsTotalPages }, (_, i) => i);
  }

  private normalizeCategoryKey(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private isCosmetiqueCategory(category: HomeCategoryCard): boolean {
    const fr = this.normalizeCategoryKey(category.nom);
    const en = this.normalizeCategoryKey((category as any).nomEn);
    const ar = this.normalizeCategoryKey((category as any).nomAr);
    const hay = `${fr} ${en} ${ar}`.trim();
    return hay.includes('cosmet');
  }

  categoryBgClass(category: HomeCategoryCard, localIndex: number): string {
    if (this.isCosmetiqueCategory(category)) return 'c-cosmetique';
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
    return (
      pick(cat.description, cat.descriptionEn, cat.descriptionAr, this.currentLang)?.trim() || ''
    );
  }

  prevCollectionsPage(): void {
    if (this.collectionsPageIndex > 0) {
      this.collectionsPageIndex--;
      this.activeCategoryIndex = 0;
    }
  }

  nextCollectionsPage(): void {
    if (this.collectionsPageIndex < this.collectionsTotalPages - 1) {
      this.collectionsPageIndex++;
      this.activeCategoryIndex = 0;
    }
  }

  goCollectionsPage(p: number): void {
    if (p >= 0 && p < this.collectionsTotalPages) {
      this.collectionsPageIndex = p;
      this.activeCategoryIndex = 0;
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

  private loadCategories(): void {
    this.isCategoriesLoading = true;
    this.categorieService
      .getAll()
      .pipe(
        take(1),
        finalize(() => {
          this.isCategoriesLoading = false;
        }),
      )
      .subscribe({
        next: (items: any) => {
          const normalized = Array.isArray(items)
            ? items.map((item: any) => ({
                id: item?.id ?? item?.Id,
                nom: item?.nom ?? item?.Nom ?? '',
                nomEn: item?.nomEn ?? item?.NomEn ?? null,
                nomAr: item?.nomAr ?? item?.NomAr ?? null,
                description: item?.description ?? item?.Description ?? '',
                descriptionEn: item?.descriptionEn ?? item?.DescriptionEn ?? null,
                descriptionAr: item?.descriptionAr ?? item?.DescriptionAr ?? null,
                statut: item?.statut ?? item?.Statut ?? true,
              }))
            : [];
          this.categories = normalized.filter((c: Categorie) => !!c.nom?.trim());
          this.activeCategoryIndex = 0;
          this.clampCollectionsPageIndex();
        },
        error: () => {
          this.categories = [];
          this.collectionsPageIndex = 0;
          this.activeCategoryIndex = 0;
        },
      });
  }

  private loadAidAdhaGifts(): void {
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
          const aidOnly = list.filter((g) => {
            const nom = (g.nom || '').toLowerCase();
            return nom.includes('aid') || nom.includes('adha') || nom.includes('aïd');
          });
          this.gifts = (aidOnly.length > 0 ? aidOnly : list).slice(0, 1);
        },
        error: () => {
          this.gifts = [];
        },
      });
  }

  giftImageUrl(gift: Gift): string {
    if (gift.imageUrl?.trim()) return gift.imageUrl.trim();
    const fromProduit = gift.produits?.find((p) => !!p.produitImageUrl)?.produitImageUrl?.trim();
    return (
      fromProduit ||
      'https://res.cloudinary.com/dzajgsdwg/image/upload/f_auto,q_auto:eco,c_limit,w_900/v1777159305/ChatGPT_Image_26_avr._2026_00_20_16_styg3q.png'
    );
  }

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

