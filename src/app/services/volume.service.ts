import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';
import { Volume, VolumeWrite } from '../models/volume.model';

@Injectable({ providedIn: 'root' })
export class VolumeService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Volume[]> {
    return this.http.get<Volume[]>(apiUrl('/api/volumes'));
  }

  create(body: VolumeWrite): Observable<Volume> {
    return this.http.post<Volume>(apiUrl('/api/volumes'), body);
  }

  update(id: number, body: VolumeWrite): Observable<Volume> {
    return this.http.put<Volume>(apiUrl(`/api/volumes/${id}`), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/volumes/${id}`));
  }
}

