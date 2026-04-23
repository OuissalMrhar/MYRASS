import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, map, tap } from 'rxjs';
import { apiUrl } from '../core/api-url';
import { LoyaltyPointsService } from './loyalty-points.service';

export interface VisitorUser {
  id: number;
  nomComplet: string;
  email: string;
  telephone?: string | null;
  /** Points fidélité côté serveur (présent après login). */
  pointsTotal?: number;
}

interface UserAuthApiResponse {
  id: number;
  nomComplet: string;
  email: string;
  telephone?: string | null;
  pointsTotal?: number;
  accessToken?: string;
}

@Injectable({ providedIn: 'root' })
export class UserAuthService {
  private readonly storageKey = 'myrass_visitor_user';
  private readonly accessTokenKey = 'myrass_visitor_access_token';
  private readonly currentUserSubject = new BehaviorSubject<VisitorUser | null>(this.readFromStorage());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly openLoginPanelSubject = new Subject<void>();
  /** Demande d'ouverture du formulaire de connexion (ex. CTA page favoris). */
  readonly openLoginPanelRequest$ = this.openLoginPanelSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loyalty: LoyaltyPointsService,
  ) {
    this.loyalty.syncFromAuthState(this.currentUserSubject.value);
  }

  register(payload: unknown): Observable<unknown> {
    return this.http.post(apiUrl('/api/users'), payload);
  }

  login(payload: { email: string; motDePasse: string }): Observable<VisitorUser> {
    return this.http.post<UserAuthApiResponse>(apiUrl('/api/users/login'), payload).pipe(
      tap((resp) =>
        this.setCurrentUser(this.mapToVisitor(resp), resp.accessToken?.trim() || null),
      ),
      map((resp) => this.mapToVisitor(resp)),
    );
  }

  loginWithGoogle(idToken: string): Observable<VisitorUser> {
    return this.http.post<UserAuthApiResponse>(apiUrl('/api/users/oauth/google'), { idToken }).pipe(
      tap((resp) =>
        this.setCurrentUser(this.mapToVisitor(resp), resp.accessToken?.trim() || null),
      ),
      map((resp) => this.mapToVisitor(resp)),
    );
  }

  loginWithFacebook(accessToken: string): Observable<VisitorUser> {
    return this.http.post<UserAuthApiResponse>(apiUrl('/api/users/oauth/facebook'), { accessToken }).pipe(
      tap((resp) =>
        this.setCurrentUser(this.mapToVisitor(resp), resp.accessToken?.trim() || null),
      ),
      map((resp) => this.mapToVisitor(resp)),
    );
  }

  /** Jeton JWT boutique (commandes, paniers). */
  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.accessTokenKey);
    this.currentUserSubject.next(null);
    this.loyalty.clearAfterLogout();
  }

  /** Met à jour les points stockés avec le client (après commande), sans relancer la synchro fidélité. */
  syncStoredPointsTotal(pointsTotal: number): void {
    const u = this.currentUser;
    if (!u) return;
    const next: VisitorUser = { ...u, pointsTotal: Math.max(0, Math.floor(pointsTotal)) };
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    this.currentUserSubject.next(next);
  }

  get currentUser(): VisitorUser | null {
    return this.currentUserSubject.value;
  }

  requestOpenLoginPanel(): void {
    this.openLoginPanelSubject.next();
  }

  get userInitials(): string {
    const fullName = (this.currentUser?.nomComplet ?? '').trim();
    if (!fullName) return '';

    // "2 premières lettres" du nom complet, sans espaces.
    const condensed = fullName.replace(/\s+/g, '');
    return condensed.slice(0, 2).toUpperCase();
  }

  private mapToVisitor(resp: UserAuthApiResponse): VisitorUser {
    return {
      id: resp.id,
      nomComplet: resp.nomComplet,
      email: resp.email,
      telephone: resp.telephone,
      pointsTotal: resp.pointsTotal,
    };
  }

  private setCurrentUser(user: VisitorUser, accessToken: string | null): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    if (accessToken) {
      localStorage.setItem(this.accessTokenKey, accessToken);
    } else {
      localStorage.removeItem(this.accessTokenKey);
    }
    this.currentUserSubject.next(user);
    this.loyalty.syncFromAuthState(user);
  }

  private readFromStorage(): VisitorUser | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as VisitorUser;
    } catch {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.accessTokenKey);
      return null;
    }
  }
}
