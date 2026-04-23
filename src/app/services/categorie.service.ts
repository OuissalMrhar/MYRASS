import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../models/categorie.model';
import { apiUrl } from '../core/api-url';

@Injectable({ providedIn: 'root' })
export class CategorieService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(apiUrl('/api/categories'));
  }
  // 🔹 GET BY ID
   getById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(apiUrl(`/api/categories/${id}`));
  }

  create(categorie: Categorie): Observable<Categorie> {
    return this.http.post<Categorie>(apiUrl('/api/categories'), categorie);
  }

  update(id: number, categorie: Categorie): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/categories/${id}`), categorie);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/categories/${id}`));
  }
}
