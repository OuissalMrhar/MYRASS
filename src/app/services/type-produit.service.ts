import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TypeProduit, TypeProduitWrite } from '../models/type-produit.model';
import { apiUrl } from '../core/api-url';

function strOrNull(v: unknown): string | null {
  if (typeof v === 'string') return v.length > 0 ? v : null;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}

function normalizeTypeProduit(raw: unknown): TypeProduit {
  const r = raw as Record<string, unknown>;
  const mediaRaw = r['mediaUrls'] ?? r['MediaUrls'];
  const mediaUrls = Array.isArray(mediaRaw)
    ? (mediaRaw as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : [];
  const statutRaw = r['statut'] ?? r['Statut'];
  return {
    id: Number(r['id'] ?? r['Id'] ?? 0),
    nom: String(r['nom'] ?? r['Nom'] ?? ''),
    nomEn: (r['nomEn'] ?? r['NomEn']) as string | null | undefined,
    nomAr: (r['nomAr'] ?? r['NomAr']) as string | null | undefined,
    catalogueId: Number(r['catalogueId'] ?? r['CatalogueId'] ?? 0),
    catalogueNom: (r['catalogueNom'] ?? r['CatalogueNom']) as string | null | undefined,
    catalogueNomEn: (r['catalogueNomEn'] ?? r['CatalogueNomEn']) as string | null | undefined,
    catalogueNomAr: (r['catalogueNomAr'] ?? r['CatalogueNomAr']) as string | null | undefined,
    categorieId: (r['categorieId'] ?? r['CategorieId']) as number | undefined,
    categorieNom: (r['categorieNom'] ?? r['CategorieNom']) as string | null | undefined,
    categorieNomEn: (r['categorieNomEn'] ?? r['CategorieNomEn']) as string | null | undefined,
    categorieNomAr: (r['categorieNomAr'] ?? r['CategorieNomAr']) as string | null | undefined,
    statut: typeof statutRaw === 'boolean' ? statutRaw : true,
    histoire: strOrNull(r['histoire'] ?? r['Histoire']),
    histoireEn: strOrNull(r['histoireEn'] ?? r['HistoireEn']),
    histoireAr: strOrNull(r['histoireAr'] ?? r['HistoireAr']),
    mediaUrls,
  };
}

@Injectable({ providedIn: 'root' })
export class TypeProduitService {
  constructor(private http: HttpClient) {}

  getAll(params?: { catalogueId?: number }): Observable<TypeProduit[]> {
    const cid = params?.catalogueId;
    const qs = cid ? `?catalogueId=${encodeURIComponent(String(cid))}` : '';
    return this.http.get<unknown[]>(apiUrl(`/api/types-produit${qs}`)).pipe(
      map((rows) => rows.map((row) => normalizeTypeProduit(row))),
    );
  }

  getById(id: number): Observable<TypeProduit> {
    return this.http
      .get<unknown>(apiUrl(`/api/types-produit/${id}`))
      .pipe(map((raw) => normalizeTypeProduit(raw)));
  }

  create(body: TypeProduitWrite): Observable<TypeProduit> {
    return this.http.post<TypeProduit>(apiUrl('/api/types-produit'), body);
  }

  update(id: number, body: TypeProduitWrite): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/types-produit/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/types-produit/${id}`));
  }
}
