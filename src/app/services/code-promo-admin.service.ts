import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';
import { CodePromo, CodePromoWrite } from '../models/code-promo.model';

@Injectable({ providedIn: 'root' })
export class CodePromoAdminService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<CodePromo[]> {
    return this.http.get<CodePromo[]>(apiUrl('/api/code-promos'));
  }

  getById(id: number): Observable<CodePromo> {
    return this.http.get<CodePromo>(apiUrl(`/api/code-promos/${id}`));
  }

  create(body: CodePromoWrite): Observable<CodePromo> {
    return this.http.post<CodePromo>(apiUrl('/api/code-promos'), body);
  }

  update(id: number, body: CodePromoWrite): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/code-promos/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/code-promos/${id}`));
  }
}
