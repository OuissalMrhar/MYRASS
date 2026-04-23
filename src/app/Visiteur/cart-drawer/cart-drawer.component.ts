import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { map, Observable } from 'rxjs';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { SiteLanguageService } from '../../core/site-language.service';
import { CartDrawerLabels } from '../../core/visitor-i18n';
import { CartLine, CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.scss'],
})
export class CartDrawerComponent {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  readonly lines$: Observable<CartLine[]>;
  readonly totalDhs$: Observable<number>;
  readonly lineCount$: Observable<number>;
  readonly labels$: Observable<CartDrawerLabels>;

  constructor(
    private readonly cart: CartService,
    private readonly router: Router,
    private readonly favorites: FavoritesService,
    private readonly siteLang: SiteLanguageService,
    readonly productRoutes: ProductRoutingHelper,
    private readonly currency: CurrencyService,
  ) {
    this.lines$ = this.cart.lines$;
    this.totalDhs$ = this.cart.lines$.pipe(map((lines) => this.cart.computeTotalDhs(lines)));
    this.lineCount$ = this.cart.lineCount$;
    this.labels$ = this.siteLang.cartDrawerLabels$;
  }

  formatPrice(amountMad: number): string {
    return this.currency.format(amountMad);
  }

  close(): void {
    this.closeDrawer.emit();
  }

  increment(line: CartLine): void {
    this.cart.setLineQuantity(line.lineId, line.quantity + 1);
  }

  decrement(line: CartLine): void {
    if (line.quantity <= 1) {
      this.cart.removeLine(line.lineId);
    } else {
      this.cart.setLineQuantity(line.lineId, line.quantity - 1);
    }
  }

  lineSubtotal(line: CartLine): number {
    return this.cart.lineSubtotalDhs(line);
  }

  isFavorite(productId: number): boolean {
    return this.favorites.has(productId);
  }

  toggleFavorite(event: Event, line: CartLine): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle({
      productId: line.productId,
      name: line.name,
      imageUrl: line.imageUrl,
      priceLabel: line.priceLabel,
      categorieNom: line.categoryLabel,
      catalogueNom: line.catalogueLabel,
      typeProduitNom: line.typeLabel,
      volumeLabel: line.variantLabel,
    });
  }

  validateCart(): void {
    this.close();
    void this.router.navigate(['/panier']);
  }
}
