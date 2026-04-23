import { Injectable } from '@angular/core';
import { buildProductSlug } from './product-slug';

@Injectable({ providedIn: 'root' })
export class ProductRoutingHelper {
  /** Segments pour `[routerLink]` vers la fiche produit. */
  detailLink(nom: string | null | undefined, id: number): string[] {
    return ['/product-detail', buildProductSlug(nom, id)];
  }
}
