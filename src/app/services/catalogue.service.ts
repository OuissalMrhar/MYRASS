import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalogue, CatalogueWrite } from '../models/catalogue.model';
import { apiUrl } from '../core/api-url';

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Catalogue[]> {
    return this.http.get<Catalogue[]>(apiUrl('/api/catalogues'));
  }

  getById(id: number): Observable<Catalogue> {
    return this.http.get<Catalogue>(apiUrl(`/api/catalogues/${id}`));
  }

  create(body: CatalogueWrite): Observable<Catalogue> {
    return this.http.post<Catalogue>(apiUrl('/api/catalogues'), body);
  }

  update(id: number, body: CatalogueWrite): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/catalogues/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/catalogues/${id}`));
  }
}
