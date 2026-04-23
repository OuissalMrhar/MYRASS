import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface PromoValidateRequest {
  code?: string | null;
  sousTotalPanier: number;
}

export interface PromoValidateResponse {
  valide: boolean;
  montantRemise: number;
  message?: string | null;
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PromoPublicService {
  constructor(private readonly http: HttpClient) {}

  validate(body: PromoValidateRequest): Observable<PromoValidateResponse> {
    return this.http.post<PromoValidateResponse>(apiUrl('/api/promo/validate'), body);
  }
}
