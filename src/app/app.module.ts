import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { HomeComponent } from './home/home.component';
import { FooterComponent } from './footer/footer.component';
import { LoginDrawerComponent } from './login-drawer/login-drawer.component';
import { RegisterDrawerComponent } from './register-drawer/register-drawer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AboutComponent } from './about/about.component';
import { GiftComponent } from './gift/gift.component';
import { ContactComponent } from './contact/contact.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FooterComponent,
    LoginDrawerComponent,
    RegisterDrawerComponent,
    NavbarComponent,
    AboutComponent,
    GiftComponent,
    ContactComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,    // <-- AJOUTER ICI
    ReactiveFormsModule  // <-- AJOUTER ICI
  ],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent]
})
export class AppModule { }