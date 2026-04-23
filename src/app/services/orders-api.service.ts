import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface LigneCommandeWriteDto {
  produitId: number;
  quantite: number;
}

/** Corps API POST /api/commandes (utilisateur imposé par le JWT). */
export interface CommandeCreateDto {
  lignes: LigneCommandeWriteDto[];
  fraisLivraison?: number;
  codePromo?: string;
}

export interface LigneCommandeResponseDto {
  produitId: number;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface CommandeResponseDto {
  id: number;
  userId: number;
  dateCommande: string;
  statut: string;
  sousTotalArticles: number;
  remiseAppliquee?: number;
  fraisLivraison: number;
  totalCommande: number;
  codePromoUtilise?: string | null;
  pointsGagnes: number;
  userPointsTotal?: number;
  lignes: LigneCommandeResponseDto[];
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  constructor(private readonly http: HttpClient) {}

  create(body: CommandeCreateDto): Observable<CommandeResponseDto> {
    return this.http.post<CommandeResponseDto>(apiUrl('/api/commandes'), body);
  }

  getMy(): Observable<CommandeResponseDto[]> {
    return this.http.get<CommandeResponseDto[]>(apiUrl('/api/commandes/my'));
  }
}
