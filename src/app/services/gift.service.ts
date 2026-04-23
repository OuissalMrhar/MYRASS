import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';
import { Gift, GiftWrite } from '../models/gift.model';

@Injectable({ providedIn: 'root' })
export class GiftService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Gift[]> {
    return this.http.get<Gift[]>(apiUrl('/api/gifts'));
  }

  getById(id: number): Observable<Gift> {
    return this.http.get<Gift>(apiUrl(`/api/gifts/${id}`));
  }

  create(body: GiftWrite): Observable<Gift> {
    return this.http.post<Gift>(apiUrl('/api/gifts'), body);
  }

  update(id: number, body: GiftWrite): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/gifts/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/gifts/${id}`));
  }
}

