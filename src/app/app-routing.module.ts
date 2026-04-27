import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
import { ProfilePageComponent } from './Visiteur/profile-page/profile-page.component';

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
  { path: 'mon-profil', component: ProfilePageComponent },

  {
    path: '',
    loadChildren: () => import('./Admin/admin.module').then((m) => m.AdminModule),
  },

  { path: '**', pathMatch: 'full', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
