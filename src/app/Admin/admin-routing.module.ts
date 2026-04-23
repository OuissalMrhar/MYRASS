import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogueAfficherComponent } from './catalogue/catalogue-afficher/catalogue-afficher.component';
import { CatalogueAjouterComponent } from './catalogue/catalogue-ajouter/catalogue-ajouter.component';
import { CatalogueModifierComponent } from './catalogue/catalogue-modifier/catalogue-modifier.component';
import { TypeProduitAfficherComponent } from './type-produit/type-produit-afficher/type-produit-afficher.component';
import { TypeProduitAjouterComponent } from './type-produit/type-produit-ajouter/type-produit-ajouter.component';
import { TypeProduitModifierComponent } from './type-produit/type-produit-modifier/type-produit-modifier.component';
import { ProduitAfficherComponent } from './produit/produit-afficher/produit-afficher.component';
import { ProduitAjouterComponent } from './produit/produit-ajouter/produit-ajouter.component';
import { ProduitModifierComponent } from './produit/produit-modifier/produit-modifier.component';
import { CategorieFormComponent } from './categories/categorie-form/categorie-form.component';
import { CategorieListComponent } from './categories/categorie-list/categorie-list.component';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { AdminRegisterComponent } from './auth/admin-register/admin-register.component';
import { AdminAuthGuard } from './auth/guards/admin-auth.guard';
import { SuperAdminGuard } from './auth/guards/super-admin.guard';
import { VolumeAfficherComponent } from './volume/volume-afficher/volume-afficher.component';
import { VolumeAjouterComponent } from './volume/volume-ajouter/volume-ajouter.component';
import { VolumeModifierComponent } from './volume/volume-modifier/volume-modifier.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminAccueilComponent } from './admin-accueil/admin-accueil.component';
import { GiftAfficherComponent } from './gift/gift-afficher/gift-afficher.component';
import { GiftAjouterComponent } from './gift/gift-ajouter/gift-ajouter.component';
import { GiftModifierComponent } from './gift/gift-modifier/gift-modifier.component';
import { CodePromoAfficherComponent } from './code-promo/code-promo-afficher/code-promo-afficher.component';
import { CodePromoFormComponent } from './code-promo/code-promo-form/code-promo-form.component';

const routes: Routes = [
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
