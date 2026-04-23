import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

export interface CartItem {
  id: number;
  name: string;
  type: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  wishlisted: boolean;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  @Output() closed = new EventEmitter<void>();

  items: CartItem[] = [
    {
      id: 1,
      name: 'Couverture Passeport',
      type: '1 Litr',
      category: 'OLIVE OIL',
      price: 300,
      quantity: 2,
      image: 'assets/images/olive-oil.png',
      wishlisted: true
    },
    {
      id: 2,
      name: 'Couverture Passeport',
      type: '1 Litr',
      category: 'OLIVE OIL',
      price: 400,
      quantity: 1,
      image: 'assets/images/olive-oil.png',
      wishlisted: true
    }
  ];

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  increment(item: CartItem): void {
    item.quantity++;
  }

  decrement(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: CartItem): void {
    this.items = this.items.filter(i => i.id !== item.id);
  }

  toggleWishlist(item: CartItem): void {
    item.wishlisted = !item.wishlisted;
  }

  close(): void {
    this.closed.emit();
  }
}