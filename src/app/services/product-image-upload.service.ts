import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';

export interface ProductImageUploadResponse {
  url: string;
  publicId: string;
}

@Injectable({ providedIn: 'root' })
export class ProductImageUploadService {
  constructor(private readonly http: HttpClient) {}

  /** Envoi vers Cloudinary via l'API (super-admin). Le fichier est stocké dans le dossier configuré côté serveur. */
  uploadProductImage(file: File): Observable<ProductImageUploadResponse> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<ProductImageUploadResponse>(apiUrl('/api/uploads/product-image'), body);
  }
}
