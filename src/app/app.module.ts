import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { GlobalScrollToTopComponent } from './global-scroll-to-top/global-scroll-to-top.component';

import { AppRoutingModule } from './app-routing.module';
import { AuthAdminInterceptor } from './Admin/auth/auth-admin.interceptor';
import { HttpTimeoutInterceptor } from './core/http-timeout.interceptor';
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
import { ProfilePageComponent } from './Visiteur/profile-page/profile-page.component';
import { CurrencyDisplayPipe } from './pipes/currency-display.pipe';
import { RevealDirective } from './directives/reveal.directive';
import { SecureImageDirective } from './directives/secure-image.directive';

@NgModule({
  declarations: [
    AppComponent,
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
    ProfilePageComponent,
    RevealDirective,
    SecureImageDirective,
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpTimeoutInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
