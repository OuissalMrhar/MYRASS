import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface AvisDto {
  id: number;
  userId: number | null;
  guestKey?: string | null;
  produitId: number;
  note: number;
  dateAvis: string;
}

export interface CommentaireDto {
  id: number;
  userId: number | null;
  guestKey?: string | null;
  produitId: number;
  contenu: string;
  dateCommentaire: string;
  nomAuteur: string;
}

export interface AvisProduitResumeDto {
  produitId: number;
  moyenne: number;
  nombre: number;
}

@Injectable({ providedIn: 'root' })
export class InteractionsService {
  constructor(private http: HttpClient) {}

  getAvisProduit(produitId: number): Observable<AvisDto[]> {
    return this.http.get<AvisDto[]>(apiUrl(`/api/interactions/avis/produit/${produitId}`));
  }

  /** Résumé moyenne + nombre d'avis (liste produits). */
  getAvisResume(produitIds: number[]): Observable<AvisProduitResumeDto[]> {
    if (produitIds.length === 0) return of([]);
    const q = `?${produitIds.map((id) => `produitIds=${id}`).join('&')}`;
    return this.http.get<AvisProduitResumeDto[]>(apiUrl(`/api/interactions/avis/resume${q}`));
  }

  upsertAvis(dto: { userId: number; produitId: number; note: number }): Observable<AvisDto> {
    return this.http.post<AvisDto>(apiUrl('/api/interactions/avis'), dto);
  }

  upsertAvisGuest(dto: { guestKey: string; produitId: number; note: number }): Observable<AvisDto> {
    return this.http.post<AvisDto>(apiUrl('/api/interactions/avis/guest'), dto);
  }

  getCommentairesProduit(produitId: number): Observable<CommentaireDto[]> {
    return this.http.get<CommentaireDto[]>(apiUrl(`/api/interactions/commentaires/produit/${produitId}`));
  }

  addCommentaire(dto: { userId: number; produitId: number; contenu: string }): Observable<CommentaireDto> {
    return this.http.post<CommentaireDto>(apiUrl('/api/interactions/commentaires'), dto);
  }

  addCommentaireGuest(dto: { guestKey: string; guestName: string; produitId: number; contenu: string; note: number }): Observable<CommentaireDto> {
    return this.http.post<CommentaireDto>(apiUrl('/api/interactions/commentaires/guest'), dto);
  }

  deleteCommentaire(commentaireId: number, userId: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/interactions/commentaires/${commentaireId}?userId=${userId}`));
  }
}
