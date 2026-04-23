import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface ContactPayload {
  nomComplet: string;
  email: string;
  telephone?: string;
  message: string;
}

export interface PartenariatPayload {
  entreprise: string;
  typePartenariat: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private http: HttpClient) {}

  sendContact(payload: ContactPayload): Observable<void> {
    return this.http.post<void>(apiUrl('/api/contact/message'), payload);
  }

  sendPartenariat(payload: PartenariatPayload): Observable<void> {
    return this.http.post<void>(apiUrl('/api/contact/partenariat'), payload);
  }
}
