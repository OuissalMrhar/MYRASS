import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { CatalogueAfficherComponent } from './admin/catalogue/catalogue-afficher/catalogue-afficher.component';
import { CatalogueAjouterComponent } from './admin/catalogue/catalogue-ajouter/catalogue-ajouter.component';
import { CatalogueModifierComponent } from './admin/catalogue/catalogue-modifier/catalogue-modifier.component';
import { TypeProduitAfficherComponent } from './admin/type-produit/type-produit-afficher/type-produit-afficher.component';
import { TypeProduitAjouterComponent } from './admin/type-produit/type-produit-ajouter/type-produit-ajouter.component';
import { TypeProduitModifierComponent } from './admin/type-produit/type-produit-modifier/type-produit-modifier.component';
import { ProduitAfficherComponent } from './admin/produit/produit-afficher/produit-afficher.component';
import { ProduitAjouterComponent } from './admin/produit/produit-ajouter/produit-ajouter.component';
import { ProduitModifierComponent } from './admin/produit/produit-modifier/produit-modifier.component';
import { CategorieListComponent } from './admin/categories/categorie-list/categorie-list.component';
import { CategorieFormComponent } from './admin/categories/categorie-form/categorie-form.component';
import { AdminLoginComponent } from './admin/auth/admin-login/admin-login.component';
import { AdminRegisterComponent } from './admin/auth/admin-register/admin-register.component';
import { AuthAdminInterceptor } from './admin/auth/auth-admin.interceptor';
import { VolumeAfficherComponent } from './admin/volume/volume-afficher/volume-afficher.component';
import { VolumeAjouterComponent } from './admin/volume/volume-ajouter/volume-ajouter.component';
import { VolumeModifierComponent } from './admin/volume/volume-modifier/volume-modifier.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminAccueilComponent } from './admin/admin-accueil/admin-accueil.component';
import { HomeComponent } from './Visiteur/home/home.component';
import { FaqComponent } from './Visiteur/faq/faq.component';
import { NavbarComponent } from './Visiteur/navbar/navbar.component';
import { FooterComponent } from './Visiteur/footer/footer.component';
import { LoginDrawerComponent } from './Visiteur/login-drawer/login-drawer.component';
import { RegisterDrawerComponent } from './Visiteur/register-drawer/register-drawer.component';
import { CartDrawerComponent } from './Visiteur/cart-drawer/cart-drawer.component';
import { AboutComponent } from './Visiteur/about/about.component';
import { ContactComponent } from './Visiteur/contact/contact.component';
import { ProduitComponent } from './Visiteur/produit/produit.component';
import { ProductDetailComponent } from './Visiteur/product-detail/product-detail.component';
import { CartPageComponent } from './Visiteur/cart-page/cart-page.component';
import { FavoritesPageComponent } from './Visiteur/favorites-page/favorites-page.component';
import { MyOrdersPageComponent } from './Visiteur/my-orders-page/my-orders-page.component';
import { PlainTextFromHtmlPipe } from './core/plain-text-from-html.pipe';
import { LangValuePipe } from './core/lang-value.pipe';
import { LangPipe } from './core/lang.pipe';
import { DetailsGiftComponent } from './Visiteur/details-gift/details-gift.component';
import { GuideComponent } from './Visiteur/guide/guide.component';
import { GiftAfficherComponent } from './admin/gift/gift-afficher/gift-afficher.component';
import { GiftAjouterComponent } from './admin/gift/gift-ajouter/gift-ajouter.component';
import { GiftModifierComponent } from './admin/gift/gift-modifier/gift-modifier.component';
import { CodePromoAfficherComponent } from './admin/code-promo/code-promo-afficher/code-promo-afficher.component';
import { CodePromoFormComponent } from './admin/code-promo/code-promo-form/code-promo-form.component';
import { CurrencyDisplayPipe } from './pipes/currency-display.pipe';
import { RevealDirective } from './directives/reveal.directive';

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
    HomeComponent,
    FaqComponent,
    NavbarComponent,
    FooterComponent,
    LoginDrawerComponent,
    RegisterDrawerComponent,
    AboutComponent,
    ContactComponent,
    ProduitComponent,
    ProductDetailComponent,
    CartPageComponent,
    FavoritesPageComponent,
    MyOrdersPageComponent,
    PlainTextFromHtmlPipe,
    LangValuePipe,
    LangPipe,
    DetailsGiftComponent,
    GuideComponent,
    GiftAfficherComponent,
    GiftAjouterComponent,
    GiftModifierComponent,
    CodePromoAfficherComponent,
    CodePromoFormComponent,
    RevealDirective,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FormsModule,
    CartDrawerComponent,
    CurrencyDisplayPipe,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthAdminInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}
