import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang } from '../../core/visitor-i18n';
import { SeoService } from '../../core/seo.service';

export interface AboutLabels {
  heroKicker: string;
  heroTitle: string;
  histoireTitle: string;
  histoireText: string;
  ambitionTitle: string;
  ambitionText: string;
  missionTitle: string;
  missionText: string;
}

const ABOUT_LABELS: Record<SiteLang, AboutLabels> = {
  fr: {
    heroKicker: 'Qui sommes-nous',
    heroTitle: "L'excellence\ndu terroir marocain",
    histoireTitle: 'Histoire',
    histoireText:
      "Myrass est née d'une conviction simple : faire rayonner le meilleur du terroir marocain à travers une sélection exigeante, sincère et profondément ancrée dans la tradition. Nous choisissons des produits qui portent une origine, un savoir-faire et une identité",
    ambitionTitle: 'Notre engagement',
    ambitionText:
      "Notre ambition est de relier le patrimoine marocain à une expérience d'achat contemporaine, élégante et fiable. Chaque produit est sélectionné avec rigueur afin d'offrir une qualité constante, une présentation soignée et une véritable relation de confiance.",
    missionTitle: 'Mission',
    missionText:
      "Myrass a pour mission de sélectionner, présenter et distribuer des produits d'exception issus du terroir marocain, avec une exigence constante d'authenticité, de qualité et de transparence. Nous voulons offrir une expérience raffinée, accessible et cohérente avec l'excellence de nos origines.",
  },
  en: {
    heroKicker: 'Who we are',
    heroTitle: 'The excellence\nof Moroccan terroir',
    histoireTitle: 'Our Story',
    histoireText:
      'Myrass was born from a simple conviction: to showcase the finest of Moroccan terroir through a demanding, sincere, and deeply rooted selection. We choose products that carry an origin, a know-how and an identity.',
    ambitionTitle: 'Ambition',
    ambitionText:
      'Our ambition is to connect Moroccan heritage with a contemporary, elegant, and reliable shopping experience. Each product is rigorously selected to offer consistent quality, careful presentation and a genuine relationship of trust.',
    missionTitle: 'Mission',
    missionText:
      'Myrass is on a mission to select, present and distribute exceptional products from Moroccan terroir, with a constant demand for authenticity, quality and transparency. We want to offer a refined, accessible experience consistent with the excellence of our origins.',
  },
  ar: {
    heroKicker: 'من نحن',
    heroTitle: 'تميّز\nالمنتجات المغربية الأصيلة',
    histoireTitle: 'قصتنا',
    histoireText:
      'وُلدت ميراس من قناعة بسيطة: إبراز أفضل ما تنتجه الأرض المغربية من خلال اختيار صارم وصادق وعميق الجذور في التراث. نختار منتجات تحمل هوية وأصلاً وحرفة متوارثة.',
    ambitionTitle: 'طموحنا',
    ambitionText:
      'طموحنا هو ربط التراث المغربي بتجربة تسوق عصرية وأنيقة وموثوقة. يُنتقى كل منتج بعناية فائقة لضمان جودة ثابتة وعرض متميز وعلاقة حقيقية من الثقة.',
    missionTitle: 'مهمتنا',
    missionText:
      'تتمثل مهمة ميراس في اختيار المنتجات الاستثنائية من الأرض المغربية وتقديمها وتوزيعها، مع متطلبات ثابتة من الأصالة والجودة والشفافية. نسعى إلى تقديم تجربة راقية وسهلة المنال، تتسق مع مستوى التميز الذي تزخر به أصولنا.',
  },
};

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  labels: AboutLabels = ABOUT_LABELS['fr'];
  isRtl = false;

  constructor(
    private readonly langService: SiteLanguageService,
    private readonly seo: SeoService,
  ) {}

  get heroTitleLines(): string[] {
    return (this.labels.heroTitle || '').split('\n');
  }

  ngOnInit(): void {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
      this.labels = ABOUT_LABELS[lang];
      this.isRtl = lang === 'ar';
      this.seo.set({
        title: lang === 'ar' ? 'من نحن' : lang === 'en' ? 'Our Story' : 'Notre histoire',
        description: this.labels.histoireText.slice(0, 155),
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
