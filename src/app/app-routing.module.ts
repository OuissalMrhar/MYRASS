import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogueAfficherComponent } from './admin/catalogue/catalogue-afficher/catalogue-afficher.component';
import { CatalogueAjouterComponent } from './admin/catalogue/catalogue-ajouter/catalogue-ajouter.component';
import { CatalogueModifierComponent } from './admin/catalogue/catalogue-modifier/catalogue-modifier.component';
import { TypeProduitAfficherComponent } from './admin/type-produit/type-produit-afficher/type-produit-afficher.component';
import { TypeProduitAjouterComponent } from './admin/type-produit/type-produit-ajouter/type-produit-ajouter.component';
import { TypeProduitModifierComponent } from './admin/type-produit/type-produit-modifier/type-produit-modifier.component';
import { ProduitAfficherComponent } from './admin/produit/produit-afficher/produit-afficher.component';
import { ProduitAjouterComponent } from './admin/produit/produit-ajouter/produit-ajouter.component';
import { ProduitModifierComponent } from './admin/produit/produit-modifier/produit-modifier.component';
import { CategorieFormComponent } from './admin/categories/categorie-form/categorie-form.component';
import { CategorieListComponent } from './admin/categories/categorie-list/categorie-list.component';
import { AdminLoginComponent } from './admin/auth/admin-login/admin-login.component';
import { AdminRegisterComponent } from './admin/auth/admin-register/admin-register.component';
import { AdminAuthGuard } from './admin/auth/guards/admin-auth.guard';
import { SuperAdminGuard } from './admin/auth/guards/super-admin.guard';
import { VolumeAfficherComponent } from './admin/volume/volume-afficher/volume-afficher.component';
import { VolumeAjouterComponent } from './admin/volume/volume-ajouter/volume-ajouter.component';
import { VolumeModifierComponent } from './admin/volume/volume-modifier/volume-modifier.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminAccueilComponent } from './admin/admin-accueil/admin-accueil.component';
import { HomeComponent } from './Visiteur/home/home.component';
import { FaqComponent } from './Visiteur/faq/faq.component';
import { AboutComponent } from './Visiteur/about/about.component';
import { ContactComponent } from './Visiteur/contact/contact.component';
import { ProduitComponent } from './Visiteur/produit/produit.component';
import { ProductDetailComponent } from './Visiteur/product-detail/product-detail.component';
import { CartPageComponent } from './Visiteur/cart-page/cart-page.component';
import { FavoritesPageComponent } from './Visiteur/favorites-page/favorites-page.component';
import { MyOrdersPageComponent } from './Visiteur/my-orders-page/my-orders-page.component';
import { DetailsGiftComponent } from './Visiteur/details-gift/details-gift.component';
import { GuideComponent } from './Visiteur/guide/guide.component';
import { GiftAfficherComponent } from './admin/gift/gift-afficher/gift-afficher.component';
import { GiftAjouterComponent } from './admin/gift/gift-ajouter/gift-ajouter.component';
import { GiftModifierComponent } from './admin/gift/gift-modifier/gift-modifier.component';
import { CodePromoAfficherComponent } from './admin/code-promo/code-promo-afficher/code-promo-afficher.component';
import { CodePromoFormComponent } from './admin/code-promo/code-promo-form/code-promo-form.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'produit', component: ProduitComponent },
  { path: 'product-detail', redirectTo: 'produit', pathMatch: 'full' },
  { path: 'product-detail/:slug', component: ProductDetailComponent },
  { path: 'details-gift/:id', component: DetailsGiftComponent },
  { path: 'about', component: AboutComponent },
  { path: 'guide', component: GuideComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'panier', component: CartPageComponent },
  { path: 'favoris', component: FavoritesPageComponent },
  { path: 'mes-commandes', component: MyOrdersPageComponent },
  { path: 'admin/myrass-secure', component: AdminLoginComponent },
  { path: 'admin/inscription', component: AdminRegisterComponent, canActivate: [SuperAdminGuard] },

  { path: 'dashboard', component: AdminDashboardComponent, canActivate: [SuperAdminGuard] },
  { path: 'accueil', component: AdminAccueilComponent, canActivate: [AdminAuthGuard] },

  { path: 'categories', component: CategorieListComponent, canActivate: [SuperAdminGuard] },
  { path: 'categories/nouveau', component: CategorieFormComponent, canActivate: [SuperAdminGuard] },
  { path: 'categories/:id/edit', component: CategorieFormComponent, canActivate: [SuperAdminGuard] },

  { path: 'catalogues/nouveau', component: CatalogueAjouterComponent, canActivate: [SuperAdminGuard] },
  { path: 'catalogues/:id/edit', component: CatalogueModifierComponent, canActivate: [SuperAdminGuard] },
  { path: 'catalogues', component: CatalogueAfficherComponent, canActivate: [SuperAdminGuard] },

  { path: 'types-produit/nouveau', component: TypeProduitAjouterComponent, canActivate: [SuperAdminGuard] },
  { path: 'types-produit/:id/edit', component: TypeProduitModifierComponent, canActivate: [SuperAdminGuard] },
  { path: 'types-produit', component: TypeProduitAfficherComponent, canActivate: [SuperAdminGuard] },

  { path: 'produits/nouveau', component: ProduitAjouterComponent, canActivate: [SuperAdminGuard] },
  { path: 'produits/:id/edit', component: ProduitModifierComponent, canActivate: [SuperAdminGuard] },
  { path: 'produits', component: ProduitAfficherComponent, canActivate: [SuperAdminGuard] },

  { path: 'tailles/nouveau', component: VolumeAjouterComponent, canActivate: [SuperAdminGuard] },
  { path: 'tailles/:id/edit', component: VolumeModifierComponent, canActivate: [SuperAdminGuard] },
  { path: 'tailles', component: VolumeAfficherComponent, canActivate: [SuperAdminGuard] },
  { path: 'volumes', redirectTo: 'tailles', pathMatch: 'full' },

  { path: 'gifts', component: GiftAfficherComponent, canActivate: [SuperAdminGuard] },
  { path: 'gifts/nouveau', component: GiftAjouterComponent, canActivate: [SuperAdminGuard] },
  { path: 'gifts/:id/edit', component: GiftModifierComponent, canActivate: [SuperAdminGuard] },

  { path: 'codes-promo/nouveau', component: CodePromoFormComponent, canActivate: [SuperAdminGuard] },
  { path: 'codes-promo/:id/edit', component: CodePromoFormComponent, canActivate: [SuperAdminGuard] },
  { path: 'codes-promo', component: CodePromoAfficherComponent, canActivate: [SuperAdminGuard] },

  { path: '**', pathMatch: 'full', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
