import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, finalize, take, takeUntil } from 'rxjs';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang } from '../../core/visitor-i18n';
import { Gift } from '../../models/gift.model';
import { GiftService } from '../../services/gift.service';

@Component({
  selector: 'app-accueil1',
  templateUrl: './accueil1.component.html',
  styleUrls: ['./accueil1.component.scss'],
})
export class Accueil1Component implements OnInit, OnDestroy {
  readonly homeLabels$ = this.siteLang.homeLabels$;
  private readonly destroy$ = new Subject<void>();

  currentLang: SiteLang = 'fr';

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
    private readonly giftService: GiftService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadGifts();
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

