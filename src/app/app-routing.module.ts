import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogueAfficherComponent } from './Admin/catalogue/catalogue-afficher/catalogue-afficher.component';
import { CatalogueAjouterComponent } from './Admin/catalogue/catalogue-ajouter/catalogue-ajouter.component';
import { CatalogueModifierComponent } from './Admin/catalogue/catalogue-modifier/catalogue-modifier.component';
import { TypeProduitAfficherComponent } from './Admin/type-produit/type-produit-afficher/type-produit-afficher.component';
import { TypeProduitAjouterComponent } from './Admin/type-produit/type-produit-ajouter/type-produit-ajouter.component';
import { TypeProduitModifierComponent } from './Admin/type-produit/type-produit-modifier/type-produit-modifier.component';
import { ProduitAfficherComponent } from './Admin/produit/produit-afficher/produit-afficher.component';
import { ProduitAjouterComponent } from './Admin/produit/produit-ajouter/produit-ajouter.component';
import { ProduitModifierComponent } from './Admin/produit/produit-modifier/produit-modifier.component';
import { CategorieFormComponent } from './Admin/categories/categorie-form/categorie-form.component';
import { CategorieListComponent } from './Admin/categories/categorie-list/categorie-list.component';
import { AdminLoginComponent } from './Admin/auth/admin-login/admin-login.component';
import { AdminRegisterComponent } from './Admin/auth/admin-register/admin-register.component';
import { AdminAuthGuard } from './Admin/auth/guards/admin-auth.guard';
import { SuperAdminGuard } from './Admin/auth/guards/super-admin.guard';
import { VolumeAfficherComponent } from './Admin/volume/volume-afficher/volume-afficher.component';
import { VolumeAjouterComponent } from './Admin/volume/volume-ajouter/volume-ajouter.component';
import { VolumeModifierComponent } from './Admin/volume/volume-modifier/volume-modifier.component';
import { AdminDashboardComponent } from './Admin/admin-dashboard/admin-dashboard.component';
import { AdminAccueilComponent } from './Admin/admin-accueil/admin-accueil.component';
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
import { GiftAfficherComponent } from './Admin/gift/gift-afficher/gift-afficher.component';
import { GiftAjouterComponent } from './Admin/gift/gift-ajouter/gift-ajouter.component';
import { GiftModifierComponent } from './Admin/gift/gift-modifier/gift-modifier.component';
import { CodePromoAfficherComponent } from './Admin/code-promo/code-promo-afficher/code-promo-afficher.component';
import { CodePromoFormComponent } from './Admin/code-promo/code-promo-form/code-promo-form.component';

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
