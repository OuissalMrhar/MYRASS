import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface LigneCommandeWriteDto {
  produitId: number;
  quantite: number;
  tailleId?: number;
}

/** Corps API POST /api/commandes (utilisateur imposé par le JWT). */
export interface CommandeCreateDto {
  lignes: LigneCommandeWriteDto[];
  fraisLivraison?: number;
  codePromo?: string;
  modePaiement?: 'en_ligne' | 'a_la_livraison';
  nomDestinataire?: string;
  telephoneLivraison?: string;
  rueLivraison?: string;
  villeLivraison?: string;
  codePostalLivraison?: string;
}

export interface LigneCommandeResponseDto {
  produitId: number;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  tailleId?: number;
  tailleLabel?: string;
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
  modePaiement: 'en_ligne' | 'a_la_livraison';
  nomDestinataire?: string | null;
  telephoneLivraison?: string | null;
  rueLivraison?: string | null;
  villeLivraison?: string | null;
  codePostalLivraison?: string | null;
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

  getAllAdmin(): Observable<CommandeResponseDto[]> {
    return this.http.get<CommandeResponseDto[]>(apiUrl('/api/commandes'));
  }

  getByIdAdmin(id: number): Observable<CommandeResponseDto> {
    return this.http.get<CommandeResponseDto>(apiUrl(`/api/commandes/${id}`));
  }

  updateStatut(id: number, statut: string): Observable<CommandeResponseDto> {
    return this.http.patch<CommandeResponseDto>(apiUrl(`/api/commandes/${id}/statut`), { statut });
  }
}
