import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { apiUrl } from '../../core/api-url';
import {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminRegisterRequest,
} from '../../models/admin-auth.model';

type AdminAuthState = {
  token: string | null;
  roleId: number | null;
  adminId: number | null;
  prenom: string | null;
  nom: string | null;
  email: string | null;
};

const LS_TOKEN = 'admin_auth_token';
const LS_ROLE_ID = 'admin_auth_roleId';
const LS_ADMIN_ID = 'admin_auth_adminId';
const LS_PRENOM = 'admin_auth_prenom';
const LS_NOM = 'admin_auth_nom';
const LS_EMAIL = 'admin_auth_email';

const ADMIN_LOGIN_PATH = '/api/admins/login';
const ADMIN_REGISTER_REQUEST_PATH = '/api/admins/register-request';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes d'inactivité

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly authStateSubject = new BehaviorSubject<AdminAuthState>({
    token: localStorage.getItem(LS_TOKEN),
    roleId: localStorage.getItem(LS_ROLE_ID) ? Number(localStorage.getItem(LS_ROLE_ID)) : null,
    adminId: localStorage.getItem(LS_ADMIN_ID) ? Number(localStorage.getItem(LS_ADMIN_ID)) : null,
    prenom: localStorage.getItem(LS_PRENOM),
    nom: localStorage.getItem(LS_NOM),
    email: localStorage.getItem(LS_EMAIL),
  });

  readonly authState$ = this.authStateSubject.asObservable();

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly idleEvents = ['click', 'keydown', 'touchstart', 'scroll'] as const;
  private readonly boundResetIdle = (): void => this.resetIdleTimer();

  constructor(private http: HttpClient, private router: Router) {
    this.idleEvents.forEach(evt =>
      document.addEventListener(evt, this.boundResetIdle, { passive: true })
    );
    this.resetIdleTimer();
  }

  /** Remet le compte à rebours d'inactivité à zéro. */
  private resetIdleTimer(): void {
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    if (!this.isLoggedIn()) return;
    this.idleTimer = setTimeout(() => {
      if (this.isLoggedIn()) {
        this.logout();
        void this.router.navigate(['/admin/myrass-secure']);
      }
    }, IDLE_TIMEOUT_MS);
  }

  /** Vérifie si le JWT stocké est expiré en lisant le claim `exp`. */
  isTokenExpired(): boolean {
    const token = this.authStateSubject.value.token;
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const exp = payload.exp as number | undefined;
      if (!exp) return false; // pas de claim exp → considéré valide
      return Date.now() / 1000 > exp;
    } catch {
      return true;
    }
  }

  isLoggedIn(): boolean {
    if (!this.authStateSubject.value.token) return false;
    if (this.isTokenExpired()) {
      this.logout(); // purge automatiquement le token expiré
      return false;
    }
    return true;
  }

  /** Super-administrateur (rôle API = 1). */
  isSuperAdmin(): boolean {
    return this.authStateSubject.value.roleId === 1 && this.isLoggedIn();
  }

  /** Administrateur normal (rôle 2). */
  isNormalAdmin(): boolean {
    return this.authStateSubject.value.roleId === 2 && this.isLoggedIn();
  }

  hasAdminAccess(): boolean {
    const r = this.authStateSubject.value.roleId;
    return this.isLoggedIn() && (r === 1 || r === 2);
  }

  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  getDisplayName(): string {
    const { prenom, nom } = this.authStateSubject.value;
    const p = (prenom ?? '').trim();
    const n = (nom ?? '').trim();
    if (p && n) return `${p} ${n}`;
    return p || n || 'Admin';
  }

  login(body: AdminLoginRequest): Observable<AdminAuthResponse> {
    return this.http.post<AdminAuthResponse>(apiUrl(ADMIN_LOGIN_PATH), body).pipe(
      tap((resp) => {
        this.applyAuthResponse(resp);
        this.idleEvents.forEach(evt =>
          document.addEventListener(evt, this.boundResetIdle, { passive: true })
        );
        this.resetIdleTimer();
      }),
    );
  }

  registerRequest(body: AdminRegisterRequest): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(apiUrl(ADMIN_REGISTER_REQUEST_PATH), body);
  }

  logout(): void {
    if (this.idleTimer !== null) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    this.idleEvents.forEach(evt =>
      document.removeEventListener(evt, this.boundResetIdle)
    );
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_ROLE_ID);
    localStorage.removeItem(LS_ADMIN_ID);
    localStorage.removeItem(LS_PRENOM);
    localStorage.removeItem(LS_NOM);
    localStorage.removeItem(LS_EMAIL);
    this.authStateSubject.next({
      token: null,
      roleId: null,
      adminId: null,
      prenom: null,
      nom: null,
      email: null,
    });
  }

  isAuthRequest(url: string, method?: string): boolean {
    const m = (method ?? '').toUpperCase();
    if (m === 'POST' && url.includes(ADMIN_LOGIN_PATH)) return true;
    if (m === 'POST' && url.includes(ADMIN_REGISTER_REQUEST_PATH)) return true;
    return false;
  }

  private applyAuthResponse(resp: AdminAuthResponse): void {
    // Le backend sérialise en camelCase → resp.token, resp.roleId, etc.
    const token = resp.token ?? resp.accessToken ?? resp.jwt ?? null;
    const roleId = resp.roleId ?? resp.role?.id ?? null;
    const adminId = resp.adminId ?? null;
    const prenom = resp.prenom ?? '';
    const nom = resp.nom ?? '';
    const email = resp.email ?? '';

    if (!token || roleId == null) return;

    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_ROLE_ID, String(roleId));
    if (adminId != null) localStorage.setItem(LS_ADMIN_ID, String(adminId));
    localStorage.setItem(LS_PRENOM, prenom);
    localStorage.setItem(LS_NOM, nom);
    localStorage.setItem(LS_EMAIL, email);

    this.authStateSubject.next({ token, roleId, adminId, prenom, nom, email });
  }
}
