import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SiteLanguageService } from '../../core/site-language.service';
import { GuideSectionCopy, GuidePageCopy, GUIDE_COPY } from './guide.translations';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss'],
})
export class GuideComponent implements OnInit, OnDestroy {
  copy: GuidePageCopy = GUIDE_COPY['fr'];
  isRtl = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly lang: SiteLanguageService) {}

  ngOnInit(): void {
    this.lang.lang$.pipe(takeUntil(this.destroy$)).subscribe((l) => {
      this.copy = GUIDE_COPY[l];
      this.isRtl = l === 'ar';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackSection(_index: number, s: GuideSectionCopy): string {
    return s.title;
  }
}
