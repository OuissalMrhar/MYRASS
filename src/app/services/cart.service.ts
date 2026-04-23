import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { UserAuthService } from './user-auth.service';

/** Ligne panier (source unique pour le drawer). */
export interface CartLine {
  lineId: string;
  productId: number;
  name: string;
  quantity: number;
  /** Affichage libre (ex. `$12.00` ou `120,00 DH`). */
  priceLabel: string;
  /** Prix unitaire numérique pour le total (DH). */
  unitPriceDhs?: number;
  variantLabel?: string;
  /** ID de la taille/volume sélectionnée — utilisé pour la navigation retour vers la fiche. */
  tailleId?: number;
  imageUrl?: string;
  categoryLabel?: string;
  catalogueLabel?: string;
  typeLabel?: string;
}

export interface CartLineInput {
  productId: number;
  name: string;
  quantity: number;
  priceLabel: string;
  unitPriceDhs?: number;
  variantLabel?: string;
  tailleId?: number;
  imageUrl?: string;
  categoryLabel?: string;
  catalogueLabel?: string;
  typeLabel?: string;
}

const CART_KEY_GUEST = 'myrass-cart-v1-guest';
const CART_KEY_USER_PREFIX = 'myrass-cart-v1-user-';
const CART_KEY_LEGACY = 'myrass-cart-v1';
const CART_REMOVED_KEY = 'myrass-cart-removed-v1';
const CART_REMOVED_MAX = 4;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines: BehaviorSubject<CartLine[]>;
  private activeStorageKey: string;
  private lastUserId: number | null;

  readonly lines$: Observable<CartLine[]>;

  /** Nombre de lignes distinctes (produit + variante) — utilisé par le badge du header. */
  readonly lineCount$: Observable<number>;

  /** Total d'unités (somme des quantités), ex. pour un futur récap commande. */
  readonly itemCount$: Observable<number>;

  private readonly _itemAdded = new Subject<void>();
  /** Émis à chaque appel réussi à `addLine` (feedback visuel sur l'icône panier). */
  readonly itemAdded$: Observable<void> = this._itemAdded.asObservable();

  private readonly _openDrawer = new Subject<void>();
  readonly drawerOpenRequest$: Observable<void> = this._openDrawer.asObservable();

  /** Derniers produits retirés du panier (max 4). */
  private readonly _removedLines = new BehaviorSubject<CartLine[]>(CartService.loadRemovedLines());
  readonly removedLines$: Observable<CartLine[]> = this._removedLines.asObservable();

  constructor(private readonly auth: UserAuthService) {
    CartService.migrateLegacyCartKey();
    const uid = this.auth.currentUser?.id ?? null;
    this.lastUserId = uid;
    this.activeStorageKey = CartService.cartStorageKey(uid);
    this._lines = new BehaviorSubject<CartLine[]>(CartService.loadFromKey(this.activeStorageKey));
    this.lines$ = this._lines.asObservable();
    this.lineCount$ = this.lines$.pipe(map((lines) => lines.length));
    this.itemCount$ = this.lines$.pipe(map((lines) => this.sumLineQuantities(lines)));

    this._lines.subscribe((lines) => CartService.persistToKey(this.activeStorageKey, lines));

    this.auth.currentUser$
      .pipe(
        distinctUntilChanged((a, b) => (a?.id ?? -1) === (b?.id ?? -1)),
        skip(1),
      )
      .subscribe((user) => this.onUserScopeChanged(user?.id ?? null));
  }

  private static cartStorageKey(userId: number | null): string {
    return userId != null ? `${CART_KEY_USER_PREFIX}${userId}` : CART_KEY_GUEST;
  }

  private static migrateLegacyCartKey(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const legacy = localStorage.getItem(CART_KEY_LEGACY);
      if (!legacy?.trim()) return;
      if (localStorage.getItem(CART_KEY_GUEST)) return;
      localStorage.setItem(CART_KEY_GUEST, legacy);
      localStorage.removeItem(CART_KEY_LEGACY);
    } catch {
      /* ignore */
    }
  }

  private onUserScopeChanged(userId: number | null): void {
    const previousUserId = this.lastUserId;
    const isLogin = userId !== null && previousUserId === null;

    // Capture le panier invité avant de changer de clé
    const guestLines = isLogin ? [...this._lines.value] : [];

    // Persiste uniquement si ce n'est pas une connexion (sinon la clé invité sera supprimée)
    if (!isLogin) {
      CartService.persistToKey(this.activeStorageKey, this._lines.value);
    }

    this.lastUserId = userId;
    this.activeStorageKey = CartService.cartStorageKey(userId);

    // Déconnexion : panier vide côté invité
    if (userId === null && previousUserId !== null) {
      this._lines.next([]);
      CartService.persistToKey(this.activeStorageKey, []);
      return;
    }

    // Connexion : fusionner le panier invité avec le panier du compte
    if (isLogin) {
      const userLines = CartService.loadFromKey(this.activeStorageKey);
      const merged = CartService.mergeLines(userLines, guestLines);
      this._lines.next(merged);
      CartService.persistToKey(this.activeStorageKey, merged);
      CartService.clearGuestCartStorage();
      return;
    }

    this._lines.next(CartService.loadFromKey(this.activeStorageKey));
  }

  /** Fusionne deux listes de lignes : si même produit+variante, additionne la quantité. */
  private static mergeLines(base: CartLine[], incoming: CartLine[]): CartLine[] {
    if (incoming.length === 0) return base;
    const merged = [...base];
    for (const gl of incoming) {
      const variantKey = gl.variantLabel?.trim() ?? '';
      const idx = merged.findIndex(
        l => l.productId === gl.productId && (l.variantLabel?.trim() ?? '') === variantKey
      );
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + gl.quantity };
      } else {
        merged.push({ ...gl });
      }
    }
    return merged;
  }

  private static clearGuestCartStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(CART_KEY_GUEST);
    } catch {
      /* ignore */
    }
  }

  requestOpenDrawer(): void {
    this._openDrawer.next();
  }

  /** Ligne panier pour ce produit et cette variante (même clé que `addLine`). */
  findLineByProductAndVariant(productId: number, variantLabel?: string | null): CartLine | undefined {
    const key = variantLabel?.trim() ?? '';
    return this._lines.value.find(
      (l) => l.productId === productId && (l.variantLabel?.trim() ?? '') === key,
    );
  }

  addLine(input: CartLineInput): void {
    const lines = [...this._lines.value];
    const variantKey = input.variantLabel?.trim() ?? '';
    const idx = lines.findIndex(
      (l) => l.productId === input.productId && (l.variantLabel?.trim() ?? '') === variantKey,
    );
    if (idx >= 0) {
      lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + input.quantity };
    } else {
      lines.push({
        ...input,
        lineId: this.newLineId(),
      });
    }
    this._lines.next(lines);
    this._itemAdded.next();
  }

  setLineQuantity(lineId: string, quantity: number): void {
    const q = Math.max(0, Math.floor(quantity));
    if (q === 0) {
      this.removeLine(lineId);
      return;
    }
    const lines = this._lines.value.map((l) => (l.lineId === lineId ? { ...l, quantity: q } : l));
    this._lines.next(lines);
  }

  removeLine(lineId: string): void {
    const line = this._lines.value.find((l) => l.lineId === lineId);
    if (line) {
      this.saveRemovedLine(line);
    }
    this._lines.next(this._lines.value.filter((l) => l.lineId !== lineId));
  }

  /** Re-adds a previously removed line back to the cart. */
  restoreRemovedLine(line: CartLine): void {
    this.addLine({
      productId: line.productId,
      name: line.name,
      quantity: line.quantity,
      priceLabel: line.priceLabel,
      unitPriceDhs: line.unitPriceDhs,
      variantLabel: line.variantLabel,
      imageUrl: line.imageUrl,
      categoryLabel: line.categoryLabel,
      catalogueLabel: line.catalogueLabel,
      typeLabel: line.typeLabel,
    });
  }

  private saveRemovedLine(line: CartLine): void {
    const current = this._removedLines.value.filter((l) => l.productId !== line.productId || l.variantLabel !== line.variantLabel);
    const updated = [{ ...line }, ...current].slice(0, CART_REMOVED_MAX);
    this._removedLines.next(updated);
    CartService.persistRemovedLines(updated);
  }

  private static loadRemovedLines(): CartLine[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CART_REMOVED_KEY);
      if (!raw?.trim()) return [];
      const data = JSON.parse(raw) as unknown;
      if (!Array.isArray(data)) return [];
      const lines: CartLine[] = [];
      for (const item of data) {
        const line = CartService.parseStoredLine(item);
        if (line) lines.push(line);
      }
      return lines.slice(0, CART_REMOVED_MAX);
    } catch {
      return [];
    }
  }

  private static persistRemovedLines(lines: CartLine[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (lines.length === 0) localStorage.removeItem(CART_REMOVED_KEY);
      else localStorage.setItem(CART_REMOVED_KEY, JSON.stringify(lines));
    } catch {
      /* quota */
    }
  }

  clear(): void {
    this._lines.next([]);
  }

  /** Somme des quantités sur toutes les lignes. */
  sumLineQuantities(lines: CartLine[]): number {
    let s = 0;
    for (const l of lines) {
      const q = Math.floor(Number(l.quantity));
      if (Number.isFinite(q) && q > 0) s += q;
    }
    return s;
  }

  /** Sous-total d'une ligne (DH). */
  lineSubtotalDhs(line: CartLine): number {
    const unit = line.unitPriceDhs ?? this.parsePriceLabel(line.priceLabel) ?? 0;
    return unit * line.quantity;
  }

  /** Total panier (DH). */
  computeTotalDhs(lines: CartLine[]): number {
    return lines.reduce((sum, l) => sum + this.lineSubtotalDhs(l), 0);
  }

  /** Extrait un nombre depuis un libellé prix (USD, DH, etc.). */
  parsePriceLabel(s: string): number | null {
    if (!s?.trim()) return null;
    const normalized = s.replace(/\s/g, '').replace(',', '.');
    const matches = normalized.match(/(\d+(?:\.\d+)?)/g);
    if (!matches?.length) return null;
    const last = matches[matches.length - 1];
    const n = parseFloat(last);
    return Number.isFinite(n) ? n : null;
  }

  private newLineId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private static loadFromKey(key: string): CartLine[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw?.trim()) return [];
      const data = JSON.parse(raw) as unknown;
      if (!Array.isArray(data)) return [];
      const lines: CartLine[] = [];
      for (const item of data) {
        const line = CartService.parseStoredLine(item);
        if (line) lines.push(line);
      }
      return lines;
    } catch {
      return [];
    }
  }

  private static persistToKey(key: string, lines: CartLine[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (lines.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(lines));
      }
    } catch {
      /* quota, navigation privée, etc. */
    }
  }

  private static parseStoredLine(item: unknown): CartLine | null {
    if (item === null || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const lineId = o['lineId'];
    const productId = o['productId'];
    const name = o['name'];
    const quantity = o['quantity'];
    const priceLabel = o['priceLabel'];
    if (typeof lineId !== 'string' || !lineId) return null;
    const pid = Number(productId);
    if (!Number.isFinite(pid)) return null;
    if (typeof name !== 'string' || !name.trim()) return null;
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(q) || q < 1) return null;
    if (typeof priceLabel !== 'string') return null;

    const unitRaw = o['unitPriceDhs'];
    const unitPriceDhs =
      unitRaw != null && Number.isFinite(Number(unitRaw)) ? Number(unitRaw) : undefined;

    const tailleRaw = o['tailleId'];
    const tailleId =
      tailleRaw != null && Number.isFinite(Number(tailleRaw)) ? Number(tailleRaw) : undefined;

    const str = (k: string): string | undefined => {
      const v = o[k];
      return typeof v === 'string' ? v : undefined;
    };

    return {
      lineId,
      productId: pid,
      name: name.trim(),
      quantity: q,
      priceLabel,
      unitPriceDhs,
      tailleId,
      variantLabel: str('variantLabel'),
      imageUrl: str('imageUrl'),
      categoryLabel: str('categoryLabel'),
      catalogueLabel: str('catalogueLabel'),
      typeLabel: str('typeLabel'),
    };
  }
}
