import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface GiftAvisDto {
  id: number;
  userId: number | null;
  guestKey?: string | null;
  giftId: number;
  note: number;
  dateAvis: string;
}

export interface GiftCommentaireDto {
  id: number;
  userId: number | null;
  guestKey?: string | null;
  giftId: number;
  contenu: string;
  dateCommentaire: string;
  nomAuteur: string;
}

@Injectable({ providedIn: 'root' })
export class GiftInteractionsService {
  constructor(private http: HttpClient) {}

  getAvisByGift(giftId: number): Observable<GiftAvisDto[]> {
    return this.http.get<GiftAvisDto[]>(apiUrl(`/api/gift-interactions/avis/gift/${giftId}`));
  }

  upsertAvis(dto: { userId: number; giftId: number; note: number }): Observable<GiftAvisDto> {
    return this.http.post<GiftAvisDto>(apiUrl('/api/gift-interactions/avis'), dto);
  }

  upsertAvisGuest(dto: { guestKey: string; giftId: number; note: number }): Observable<GiftAvisDto> {
    return this.http.post<GiftAvisDto>(apiUrl('/api/gift-interactions/avis/guest'), dto);
  }

  getCommentairesByGift(giftId: number): Observable<GiftCommentaireDto[]> {
    return this.http.get<GiftCommentaireDto[]>(apiUrl(`/api/gift-interactions/commentaires/gift/${giftId}`));
  }

  addCommentaire(dto: { userId: number; giftId: number; contenu: string }): Observable<GiftCommentaireDto> {
    return this.http.post<GiftCommentaireDto>(apiUrl('/api/gift-interactions/commentaires'), dto);
  }

  addCommentaireGuest(dto: { guestKey: string; guestName: string; giftId: number; contenu: string; note: number }): Observable<GiftCommentaireDto> {
    return this.http.post<GiftCommentaireDto>(apiUrl('/api/gift-interactions/commentaires/guest'), dto);
  }

  deleteCommentaire(commentaireId: number, userId: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/gift-interactions/commentaires/${commentaireId}?userId=${userId}`));
  }
}
