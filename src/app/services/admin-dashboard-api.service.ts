import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-url';
import {
  AdminCreateBySuper,
  AdminRegistrationPending,
  AdminSessionOverview,
  AdminUpdateBySuper,
} from '../models/admin-auth.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService {
  constructor(private http: HttpClient) {}

  sessionsOverview(): Observable<AdminSessionOverview[]> {
    return this.http.get<AdminSessionOverview[]>(apiUrl('/api/admins/sessions/overview'));
  }

  pendingRegistrations(): Observable<AdminRegistrationPending[]> {
    return this.http.get<AdminRegistrationPending[]>(apiUrl('/api/admins/registration-requests'));
  }

  approveRegistration(id: number): Observable<void> {
    return this.http.post<void>(apiUrl(`/api/admins/registration-requests/${id}/approve`), {});
  }

  rejectRegistration(id: number): Observable<void> {
    return this.http.post<void>(apiUrl(`/api/admins/registration-requests/${id}/reject`), {});
  }

  createAdmin(body: AdminCreateBySuper): Observable<unknown> {
    return this.http.post(apiUrl('/api/admins'), body);
  }

  updateAdmin(id: number, body: AdminUpdateBySuper): Observable<void> {
    return this.http.put<void>(apiUrl(`/api/admins/${id}`), body);
  }

  deleteAdmin(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/admins/${id}`));
  }

  downloadConnectionsPdf(): Observable<Blob> {
    return this.http.get(apiUrl('/api/admins/connections/journal.pdf'), { responseType: 'blob' });
  }
}
