import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Produit, ProduitWrite } from '../models/produit.model';
import { apiUrl } from '../core/api-url';

@Injectable({ providedIn: 'root' })
export class ProduitService {
  constructor(private http: HttpClient) {}

  /** Unifie la description (camelCase / PascalCase, types JSON). */
  private normalizeProduit(body: unknown): Produit {
    const p = body as Produit;
    if (!body || typeof body !== 'object') return p;
    const o = body as Record<string, unknown>;

    const rawDesc = o['description'] ?? o['Description'] ?? p.description;
    let description: string | null = null;
    if (typeof rawDesc === 'string') {
      description = rawDesc.length > 0 ? rawDesc : null;
    } else if (typeof rawDesc === 'number' || typeof rawDesc === 'boolean') {
      description = String(rawDesc);
    }

    const statutRaw = o['statut'] ?? o['Statut'];
    const rubriqueRaw = o['rubriqueVisiteur'] ?? o['RubriqueVisiteur'];
    const stockEffRaw = o['stockEffectif'] ?? o['StockEffectif'];

    return {
      ...p,
      description,
      statut: typeof statutRaw === 'boolean' ? statutRaw : p.statut ?? true,
      rubriqueVisiteur: typeof rubriqueRaw === 'string' ? rubriqueRaw : p.rubriqueVisiteur,
      stockEffectif:
        typeof stockEffRaw === 'number' && Number.isFinite(stockEffRaw) ? stockEffRaw : p.stockEffectif ?? p.stock ?? 0,
    };
  }

  getAll(): Observable<Produit[]> {
    return this.http
      .get<Produit[]>(apiUrl('/api/produits'))
      .pipe(map((list) => (list ?? []).map((item) => this.normalizeProduit(item))));
  }

  /** Produits les plus vendus (quantités cumulées sur les commandes). Paramètre `count` optionnel (défaut : 3). */
  getBestsellers(count = 3): Observable<Produit[]> {
    const n = Math.min(Math.max(count, 1), 24);
    return this.http
      .get<Produit[]>(apiUrl(`/api/produits/bestsellers?count=${n}`))
      .pipe(map((list) => (list ?? []).map((item) => this.normalizeProduit(item))));
  }

  getById(id: number): Observable<Produit> {
    return this.http
      .get<Produit>(apiUrl(`/api/produits/${id}`))
      .pipe(map((item) => this.normalizeProduit(item)));
  }

  create(body: ProduitWrite): Observable<Produit> {
    return this.http
      .post<Produit>(apiUrl('/api/produits'), body)
      .pipe(map((item) => this.normalizeProduit(item)));
  }

  update(id: number, body: ProduitWrite): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/produits/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/produits/${id}`));
  }
}
