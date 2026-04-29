import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ContactPayload {
  nomComplet: string;
  email: string;
  telephone?: string;
  message: string;
}

export interface PartenariatPayload {
  typePartenariat: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly siteName = 'SITE MYRASS';

  constructor(private readonly http: HttpClient) {}

  sendContact(payload: ContactPayload): Observable<void> {
    return this.http
      .post<{ ok: boolean }>(
        '/api/send-email',
        {
          kind: 'contact',
          siteName: this.siteName,
          nomComplet: payload.nomComplet,
          email: payload.email,
          telephone: payload.telephone,
          message: payload.message,
        },
      )
      .pipe(map(() => undefined));
  }

  sendPartenariat(payload: PartenariatPayload): Observable<void> {
    return this.http
      .post<{ ok: boolean }>(
        '/api/send-email',
        {
          kind: 'partnership',
          siteName: this.siteName,
          typePartenariat: payload.typePartenariat,
          nomComplet: payload.nomComplet,
          email: payload.email,
          telephone: payload.telephone,
          message: payload.message,
        },
      )
      .pipe(map(() => undefined));
  }
}
