import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-global-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-scroll-to-top.component.html',
  styleUrls: ['./global-scroll-to-top.component.scss'],
})
export class GlobalScrollToTopComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Décale le bouton au-dessus de la barre / nav basse (pages visiteur). */
  @Input() visitorSite = false;

  visible = false;
  private readonly thresholdPx = 280;
  private navSub?: Subscription;
  private scrollRaf = 0;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncVisibility());
  }

  ngAfterViewInit(): void {
    this.syncVisibility();
  }

  ngOnDestroy(): void {
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
    this.navSub?.unsubscribe();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scheduleSync();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.scheduleSync();
  }

  private scheduleSync(): void {
    if (this.scrollRaf) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      this.syncVisibility();
    });
  }

  scrollToTop(): void {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private syncVisibility(): void {
    if (typeof window === 'undefined') return;
    const y = window.scrollY || document.documentElement.scrollTop;
    this.visible = y > this.thresholdPx;
  }
}
