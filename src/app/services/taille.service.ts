import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';
import { Taille, TailleWrite } from '../models/taille.model';

@Injectable({ providedIn: 'root' })
export class TailleService {
  constructor(private http: HttpClient) {}

  getAll(params?: { typeProduitId?: number | null }): Observable<Taille[]> {
    let httpParams = new HttpParams();
    if (params?.typeProduitId) httpParams = httpParams.set('typeProduitId', String(params.typeProduitId));
    return this.http.get<Taille[]>(apiUrl('/api/tailles'), { params: httpParams });
  }

  create(body: TailleWrite): Observable<Taille> {
    return this.http.post<Taille>(apiUrl('/api/tailles'), body);
  }

  update(id: number, body: TailleWrite): Observable<Taille> {
    return this.http.put<Taille>(apiUrl(`/api/tailles/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/tailles/${id}`));
  }
}
