import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { GlobalScrollToTopComponent } from './global-scroll-to-top/global-scroll-to-top.component';

import { AppRoutingModule } from './app-routing.module';
import { CatalogueAfficherComponent } from './Admin/catalogue/catalogue-afficher/catalogue-afficher.component';
import { CatalogueAjouterComponent } from './Admin/catalogue/catalogue-ajouter/catalogue-ajouter.component';
import { CatalogueModifierComponent } from './Admin/catalogue/catalogue-modifier/catalogue-modifier.component';
import { TypeProduitAfficherComponent } from './Admin/type-produit/type-produit-afficher/type-produit-afficher.component';
import { TypeProduitAjouterComponent } from './Admin/type-produit/type-produit-ajouter/type-produit-ajouter.component';
import { TypeProduitModifierComponent } from './Admin/type-produit/type-produit-modifier/type-produit-modifier.component';
import { ProduitAfficherComponent } from './Admin/produit/produit-afficher/produit-afficher.component';
import { ProduitAjouterComponent } from './Admin/produit/produit-ajouter/produit-ajouter.component';
import { ProduitModifierComponent } from './Admin/produit/produit-modifier/produit-modifier.component';
import { CategorieListComponent } from './Admin/categories/categorie-list/categorie-list.component';
import { CategorieFormComponent } from './Admin/categories/categorie-form/categorie-form.component';
import { AdminLoginComponent } from './Admin/auth/admin-login/admin-login.component';
import { AdminRegisterComponent } from './Admin/auth/admin-register/admin-register.component';
import { AuthAdminInterceptor } from './Admin/auth/auth-admin.interceptor';
import { VolumeAfficherComponent } from './Admin/volume/volume-afficher/volume-afficher.component';
import { VolumeAjouterComponent } from './Admin/volume/volume-ajouter/volume-ajouter.component';
import { VolumeModifierComponent } from './Admin/volume/volume-modifier/volume-modifier.component';
import { AdminDashboardComponent } from './Admin/admin-dashboard/admin-dashboard.component';
import { AdminAccueilComponent } from './Admin/admin-accueil/admin-accueil.component';
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
import { GiftAfficherComponent } from './Admin/gift/gift-afficher/gift-afficher.component';
import { GiftAjouterComponent } from './Admin/gift/gift-ajouter/gift-ajouter.component';
import { GiftModifierComponent } from './Admin/gift/gift-modifier/gift-modifier.component';
import { CodePromoAfficherComponent } from './Admin/code-promo/code-promo-afficher/code-promo-afficher.component';
import { CodePromoFormComponent } from './Admin/code-promo/code-promo-form/code-promo-form.component';
import { CurrencyDisplayPipe } from './pipes/currency-display.pipe';
import { RevealDirective } from './directives/reveal.directive';

@NgModule({
  declarations: [
    AppComponent,
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
    GlobalScrollToTopComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthAdminInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
