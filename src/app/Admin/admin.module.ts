import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';

import { CatalogueAfficherComponent } from './catalogue/catalogue-afficher/catalogue-afficher.component';
import { CatalogueAjouterComponent } from './catalogue/catalogue-ajouter/catalogue-ajouter.component';
import { CatalogueModifierComponent } from './catalogue/catalogue-modifier/catalogue-modifier.component';
import { TypeProduitAfficherComponent } from './type-produit/type-produit-afficher/type-produit-afficher.component';
import { TypeProduitAjouterComponent } from './type-produit/type-produit-ajouter/type-produit-ajouter.component';
import { TypeProduitModifierComponent } from './type-produit/type-produit-modifier/type-produit-modifier.component';
import { ProduitAfficherComponent } from './produit/produit-afficher/produit-afficher.component';
import { ProduitAjouterComponent } from './produit/produit-ajouter/produit-ajouter.component';
import { ProduitModifierComponent } from './produit/produit-modifier/produit-modifier.component';
import { CategorieListComponent } from './categories/categorie-list/categorie-list.component';
import { CategorieFormComponent } from './categories/categorie-form/categorie-form.component';
import { AdminLoginComponent } from './auth/admin-login/admin-login.component';
import { AdminRegisterComponent } from './auth/admin-register/admin-register.component';
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
import { CommandesAfficherComponent } from './commandes/commandes-afficher/commandes-afficher.component';

@NgModule({
  declarations: [
    CatalogueAfficherComponent,
    CatalogueAjouterComponent,
    CatalogueModifierComponent,
    TypeProduitAfficherComponent,
    TypeProduitAjouterComponent,
    TypeProduitModifierComponent,
    ProduitAfficherComponent,
    ProduitAjouterComponent,
    ProduitModifierComponent,
    CategorieListComponent,
    CategorieFormComponent,
    AdminLoginComponent,
    AdminRegisterComponent,
    VolumeAfficherComponent,
    VolumeAjouterComponent,
    VolumeModifierComponent,
    AdminDashboardComponent,
    AdminAccueilComponent,
    GiftAfficherComponent,
    GiftAjouterComponent,
    GiftModifierComponent,
    CodePromoAfficherComponent,
    CodePromoFormComponent,
    CommandesAfficherComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
  ],
})
export class AdminModule {}
