import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  EMPTY,
  Subject,
  forkJoin,
  of,
  distinctUntilChanged,
  switchMap,
  catchError,
  map,
  tap,
  takeUntil,
} from 'rxjs';
import { skip } from 'rxjs/operators';
import { apiUrl } from '../core/api-url';
import { Produit } from '../models/produit.model';
import { STATIC_PRODUCT_IMAGE_URL } from '../core/static-product-image';
import { ProduitService } from './produit.service';
import { UserAuthService } from './user-auth.service';

export interface FavoriteItem {
  productId: number;
  name: string;
  imageUrl?: string;
  priceLabel?: string;
  categorieNom?: string;
  catalogueNom?: string;
  typeProduitNom?: string;
  /** Volume / format (variante sélectionnée ou récap des tailles). */
  volumeLabel?: string;
}

const FAV_KEY_GUEST = 'myrass-favorites-v1-guest';
const FAV_KEY_LEGACY = 'myrass-favorites-v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService implements OnDestroy {
  private readonly _items = new BehaviorSubject<FavoriteItem[]>([]);
  private readonly destroy$ = new Subject<void>();
  private lastUserId: number | null;
  /** Invité : persistance `localStorage` uniquement ; connecté : API (pas de LS compte). */
  private persistGuest = false;

  readonly items$ = this._items.asObservable();
  readonly count$ = this._items.pipe(map((a) => a.length));

  constructor(
    private readonly http: HttpClient,
    private readonly produitService: ProduitService,
    private readonly auth: UserAuthService,
  ) {
    FavoritesService.migrateLegacyFavoritesToGuest();
    const uid = this.auth.currentUser?.id ?? null;
    this.lastUserId = uid;

    if (uid != null) {
      this.persistGuest = false;
      this.loadFromServer(uid).subscribe();
    } else {
      this.persistGuest = true;
      this._items.next(FavoritesService.loadGuestFromStorage());
    }

    this._items.pipe(takeUntil(this.destroy$)).subscribe((items) => {
      if (this.persistGuest) {
        FavoritesService.persistGuestToStorage(items);
      }
    });

    this.auth.currentUser$
      .pipe(
        distinctUntilChanged((a, b) => a?.id === b?.id),
        skip(1),
        takeUntil(this.destroy$),
      )
      .subscribe((user) => this.onUserScopeChanged(user?.id ?? null));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  has(productId: number): boolean {
    return this._items.value.some((i) => i.productId === productId);
  }

  private add(entry: FavoriteItem): void {
    if (this.has(entry.productId)) return;
    this._items.next([...this._items.value, { ...entry }]);
  }

  private remove(productId: number): void {
    this._items.next(this._items.value.filter((i) => i.productId !== productId));
  }

  removeOne(productId: number): void {
    if (!this.has(productId)) return;
    const user = this.auth.currentUser;
    if (user) {
      this.http
        .delete(apiUrl(`/api/interactions/favoris/${user.id}/${productId}`))
        .subscribe({
          next: () => this.remove(productId),
          error: () => {},
        });
    } else {
      this.remove(productId);
    }
  }

  /** Invité : local uniquement ; connecté : API. */
  toggle(entry: FavoriteItem): void {
    const user = this.auth.currentUser;
    if (user) {
      if (this.has(entry.productId)) {
        this.http
          .delete(apiUrl(`/api/interactions/favoris/${user.id}/${entry.productId}`))
          .subscribe({
            next: () => this.remove(entry.productId),
            error: () => {},
          });
      } else {
        this.http
          .post(apiUrl(`/api/interactions/favoris/${user.id}/${entry.productId}`), {})
          .subscribe({
            next: () => this.add(entry),
            error: () => {},
          });
      }
    } else if (this.has(entry.productId)) {
      this.remove(entry.productId);
    } else {
      this.add(entry);
    }
  }

  private onUserScopeChanged(userId: number | null): void {
    const previousUserId = this.lastUserId;

    if (userId === null) {
      this.lastUserId = null;
      this.persistGuest = true;
      this._items.next(FavoritesService.loadGuestFromStorage());
      return;
    }

    // Capture les favoris invité avant de switcher (connexion depuis l'état invité)
    const guestItems = previousUserId === null ? [...this._items.value] : [];

    this.persistGuest = false;
    this.lastUserId = userId;

    if (previousUserId !== userId) {
      this.loadAndMergeFromServer(userId, guestItems).subscribe();
    }
  }

  /**
   * Charge les favoris depuis le serveur et fusionne les éléments invité non encore présents.
   * Les favoris invité manquants sont poussés vers l'API avant l'affichage.
   */
  private loadAndMergeFromServer(userId: number, guestItems: FavoriteItem[]): Observable<void> {
    return this.http.get<number[]>(apiUrl(`/api/interactions/favoris/user/${userId}`)).pipe(
      switchMap((rawIds) => {
        const serverIdSet = new Set(Array.isArray(rawIds) ? rawIds : []);
        const toMerge = guestItems.filter(gi => !serverIdSet.has(gi.productId));

        // Pousse les favoris invité vers le serveur en parallèle
        const push$ = toMerge.length > 0
          ? forkJoin(
              toMerge.map(gi =>
                this.http.post(apiUrl(`/api/interactions/favoris/${userId}/${gi.productId}`), {}).pipe(
                  tap(() => serverIdSet.add(gi.productId)),
                  catchError(() => of(null)),
                )
              )
            )
          : of([] as unknown[]);

        return push$.pipe(
          switchMap(() => {
            const allIds = [...serverIdSet];
            return this.hydrateFavoriteItems(allIds, guestItems).pipe(
              tap((items) => {
                this._items.next(items);
                FavoritesService.removeGuestStorage();
              }),
              map(() => void 0),
            );
          }),
        );
      }),
      catchError(() => {
        // Fallback : affiche les favoris invité s'il y en a
        this._items.next(guestItems.length > 0 ? guestItems : []);
        return EMPTY;
      }),
    );
  }

  private loadFromServer(userId: number): Observable<void> {
    return this.loadAndMergeFromServer(userId, []);
  }

  private hydrateFavoriteItems(ids: number[], localItems: FavoriteItem[]): Observable<FavoriteItem[]> {
    const byId = new Map(localItems.map((i) => [i.productId, i]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length === 0) {
      return of(ids.map((id) => byId.get(id)).filter((x): x is FavoriteItem => !!x));
    }
    return forkJoin(
      missing.map((id) =>
        this.produitService.getById(id).pipe(catchError(() => of(null as Produit | null))),
      ),
    ).pipe(
      map((products) => {
        for (const p of products) {
          if (p) byId.set(p.id, FavoritesService.favoriteFromProduit(p));
        }
        return ids.map((id) => byId.get(id) ?? { productId: id, name: `Produit ${id}` });
      }),
    );
  }

  static volumeSummaryFromProduit(p: Produit): string | undefined {
    const labelsT = (p.tailles ?? [])
      .map((t) => (typeof t.tailleLabel === 'string' ? t.tailleLabel.trim() : ''))
      .filter(Boolean);
    const labelsV = (p.volumes ?? [])
      .map((v) => (typeof v.volumeLabel === 'string' ? v.volumeLabel.trim() : ''))
      .filter(Boolean);
    const labels = labelsT.length ? labelsT : labelsV;
    if (!labels.length) return undefined;
    if (labels.length === 1) return labels[0];
    const head = labels.slice(0, 3).join(' · ');
    return labels.length > 3 ? `${head}…` : head;
  }

  private static favoriteFromProduit(p: Produit): FavoriteItem {
    // Image principale réelle depuis la base ; fallback placeholder si aucune media
    const mainMedia = p.medias?.find(m => m.kind === 'image' && m.estPrincipale)
      ?? p.medias?.find(m => m.kind === 'image');
    const imageUrl = mainMedia?.url ?? STATIC_PRODUCT_IMAGE_URL;
    const priceLabel = FavoritesService.formatPriceLabel(p);
    const categorieNom = p.categorieNom?.trim() || undefined;
    const catalogueNom = p.catalogueNom?.trim() || undefined;
    const typeProduitNom = p.typeProduitNom?.trim() || undefined;
    const volumeLabel = FavoritesService.volumeSummaryFromProduit(p);
    return {
      productId: p.id,
      name: p.nom?.trim() || `Produit ${p.id}`,
      imageUrl: imageUrl || undefined,
      priceLabel,
      categorieNom,
      catalogueNom,
      typeProduitNom,
      volumeLabel,
    };
  }

  private static formatPriceLabel(p: Produit): string {
    const hasType = !!p.typeProduitId || !!p.typeProduitNom;
    const tailles =
      p.tailles ??
      p.volumes?.map((v) => ({
        tailleId: v.volumeId,
        prix: v.prix,
        stock: v.stock,
      })) ??
      [];
    if (hasType && tailles.length > 0) {
      const min = Math.min(...tailles.map((t) => Number(t.prix ?? 0)));
      const max = Math.max(...tailles.map((t) => Number(t.prix ?? 0)));
      if (Math.abs(max - min) > 0.005) {
        return `€${min.toFixed(2)} – €${max.toFixed(2)}`;
      }
      return `€${min.toFixed(2)}`;
    }
    return `€${Number(p.prix ?? 0).toFixed(2)}`;
  }

  private static migrateLegacyFavoritesToGuest(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const legacy = localStorage.getItem(FAV_KEY_LEGACY);
      if (!legacy?.trim()) return;
      if (localStorage.getItem(FAV_KEY_GUEST)) return;
      localStorage.setItem(FAV_KEY_GUEST, legacy);
      localStorage.removeItem(FAV_KEY_LEGACY);
    } catch {
      /* ignore */
    }
  }

  private static loadGuestFromStorage(): FavoriteItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(FAV_KEY_GUEST);
      if (!raw?.trim()) return [];
      const data = JSON.parse(raw) as unknown;
      if (!Array.isArray(data)) return [];
      const out: FavoriteItem[] = [];
      for (const row of data) {
        if (row && typeof row === 'object' && 'productId' in row && 'name' in row) {
          const o = row as Record<string, unknown>;
          const id = Number(o['productId']);
          const name = o['name'];
          if (!Number.isFinite(id) || typeof name !== 'string' || !name.trim()) continue;
          const readStr = (k: string): string | undefined => {
            const v = o[k];
            return typeof v === 'string' && v.trim() ? v.trim() : undefined;
          };
          out.push({
            productId: id,
            name: name.trim(),
            imageUrl: readStr('imageUrl'),
            priceLabel: readStr('priceLabel'),
            categorieNom: readStr('categorieNom'),
            catalogueNom: readStr('catalogueNom'),
            typeProduitNom: readStr('typeProduitNom'),
            volumeLabel: readStr('volumeLabel'),
          });
        }
      }
      return out;
    } catch {
      return [];
    }
  }

  private static persistGuestToStorage(items: FavoriteItem[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (items.length === 0) {
        localStorage.removeItem(FAV_KEY_GUEST);
      } else {
        localStorage.setItem(FAV_KEY_GUEST, JSON.stringify(items));
      }
    } catch {
      /* ignore */
    }
  }

  private static removeGuestStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(FAV_KEY_GUEST);
    } catch {
      /* ignore */
    }
  }
}
