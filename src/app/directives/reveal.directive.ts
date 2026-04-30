import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * Directive de scroll-reveal.
 * Ajoute la classe CSS `is-visible` dès que l'élément entre dans le viewport.
 * Utilisation : <section appReveal> ou <section appReveal [revealDelay]="200">
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;

  private observer!: IntersectionObserver;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private revealed = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const el = this.el.nativeElement;
    el.classList.add('will-reveal');
    if (this.revealDelay) {
      el.style.transitionDelay = `${this.revealDelay}ms`;
      el.style.animationDelay = `${this.revealDelay}ms`;
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.markVisible();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.markVisible();
          }
        });
      },
      { threshold: 0.12 }
    );

    this.observer.observe(el);

    // Mobile safety net: avoid long periods where interaction waits for observer timing.
    this.fallbackTimer = setTimeout(() => this.markVisible(), this.revealDelay + 800);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.fallbackTimer != null) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private markVisible(): void {
    if (this.revealed) return;
    this.revealed = true;
    const el = this.el.nativeElement;
    el.classList.add('is-visible');
    this.observer?.unobserve(el);
    if (this.fallbackTimer != null) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }
}
