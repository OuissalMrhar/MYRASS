import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminAuthService } from './Admin/auth/admin-auth.service';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  loggedIn = false;
  isSuperAdmin = false;
  isNormalAdmin = false;
  showSidebar = true;
  isVisitorPage = false;
  displayName = '';
  private sub: Subscription | null = null;
  private routeSub: Subscription | null = null;

  constructor(private auth: AdminAuthService, private router: Router) {}

  ngOnInit(): void {
    this.applyAuth();
    this.sub = this.auth.authState$.subscribe(() => this.applyAuth());

    const applyRoute = (url: string) => {
      // Ne pas utiliser startsWith('/produit') seul : ça inclurait par erreur '/produits', '/produits/…'
      const visitorProduitPath =
        url === '/produit' ||
        url.startsWith('/produit?') ||
        url.startsWith('/produit/');
      this.isVisitorPage =
        url.startsWith('/home') ||
        visitorProduitPath ||
        url.startsWith('/product-detail') ||
        url.startsWith('/details-gift') ||
        url.startsWith('/about') ||
        url.startsWith('/guide') ||
        url.startsWith('/contact') ||
        url.startsWith('/faq') ||
        url.startsWith('/panier') ||
        url.startsWith('/favoris') ||
        url.startsWith('/mes-commandes') ||
        url.startsWith('/mon-profil');
      const isAdminAuthPage =
        url.startsWith('/admin/login') || url.startsWith('/admin/inscription');
      this.showSidebar = !this.isVisitorPage && !isAdminAuthPage;
    };

    applyRoute(this.router.url);
    this.routeSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) applyRoute(e.urlAfterRedirects);
    });
  }

  private applyAuth(): void {
    this.loggedIn = this.auth.hasAdminAccess();
    this.isSuperAdmin = this.auth.isSuperAdmin();
    this.isNormalAdmin = this.auth.isNormalAdmin();
    this.displayName = this.auth.getDisplayName();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }
}
