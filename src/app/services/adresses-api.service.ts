import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface AdresseUserDto {
  id: number;
  nomDestinataire: string;
  telephone: string;
  rue: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  estDefaut: boolean;
}

export interface AdresseUserWriteDto {
  nomDestinataire: string;
  telephone: string;
  rue: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  estDefaut?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdressesApiService {
  constructor(private readonly http: HttpClient) {}

  getMy(): Observable<AdresseUserDto[]> {
    return this.http.get<AdresseUserDto[]>(apiUrl('/api/adresses'));
  }

  create(dto: AdresseUserWriteDto): Observable<number> {
    return this.http.post<number>(apiUrl('/api/adresses'), dto);
  }

  update(id: number, dto: AdresseUserWriteDto): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/adresses/${id}`), dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/adresses/${id}`));
  }
}
