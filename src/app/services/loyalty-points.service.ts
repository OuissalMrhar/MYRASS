import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Sous-ensemble du user visiteur pour la fidélité (évite un import circulaire avec UserAuthService). */
export interface LoyaltyAuthUserRef {
  id: number;
  pointsTotal?: number;
}

/** Points par compte (clé localStorage) + invité séparé. */
const PREFIX = 'myrass-loyalty-points-v1';
const LEGACY_KEY = 'myrass-loyalty-points-v1';
/** 1 point pour 10 DH dépensés (partie entière), minimum 1 point par commande simulée si total > 0. */
const POINTS_PER_10_DH = 1;
/** Palier d'affichage de la barre (0–100 % jusqu'au prochain multiple). */
const BAR_STEP = 100;

export interface LoyaltyState {
  totalPoints: number;
  /** Progression vers le prochain palier de 100 pts (affichage navbar). */
  barPercent: number;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyPointsService {
  private activeKey: string;
  private activeUserId: number | null;
  private readonly _state: BehaviorSubject<LoyaltyState>;

  readonly state$: Observable<LoyaltyState>;

  /** Points gagnés sur la dernière commande simulée (affichage ponctuel). */
  private lastEarned = 0;

  get totalPoints(): number {
    return this._state.value.totalPoints;
  }

  get lastOrderEarnedPoints(): number {
    return this.lastEarned;
  }

  constructor() {
    LoyaltyPointsService.migrateLegacyKey();
    this.activeUserId = null;
    this.activeKey = LoyaltyPointsService.storageKeyFor(null);
    const initial = this.readFromKey(this.activeKey);
    this._state = new BehaviorSubject<LoyaltyState>(initial);
    this.state$ = this._state.asObservable();
  }

  clearLastOrderHighlight(): void {
    this.lastEarned = 0;
  }

  /**
   * Après restauration du user depuis le stockage (démarrage app ou login).
   * Sans user connecté : ne fait rien (invité déjà chargé dans le constructeur).
   */
  syncFromAuthState(user: LoyaltyAuthUserRef | null): void {
    if (user?.id == null || !Number.isFinite(user.id)) return;
    this.persistTotalToKey(this.activeKey, this._state.value.totalPoints);
    this.activeUserId = user.id;
    this.activeKey = LoyaltyPointsService.storageKeyFor(user.id);
    if (user.pointsTotal != null && Number.isFinite(user.pointsTotal)) {
      this.applyServerTotal(user.pointsTotal);
    } else {
      this._state.next(this.readFromKey(this.activeKey));
    }
  }

  /**
   * Déconnexion : plus d'affichage points / barre ; invité repart à zéro côté UI.
   */
  clearAfterLogout(): void {
    if (this.activeUserId != null) {
      this.persistTotalToKey(this.activeKey, this._state.value.totalPoints);
    }
    this.activeUserId = null;
    this.activeKey = LoyaltyPointsService.storageKeyFor(null);
    this.lastEarned = 0;
    const zero = this.computeStateFromTotal(0);
    this._state.next(zero);
    try {
      localStorage.removeItem(this.activeKey);
    } catch {
      /* ignore */
    }
  }

  /**
   * Aligne l'affichage sur les points serveur (connexion ou après commande en base).
   */
  applyServerTotal(totalPoints: number, lastEarnedPoints?: number): void {
    const n = Math.max(0, Math.floor(Number(totalPoints) || 0));
    if (lastEarnedPoints != null) {
      this.lastEarned = Math.max(0, Math.floor(lastEarnedPoints));
    }
    const next = this.computeStateFromTotal(n);
    this._state.next(next);
    this.persistTotalToKey(this.activeKey, next.totalPoints);
  }

  /**
   * Simule une commande : ajoute des points selon le total payé (DH).
   * @returns points gagnés sur cet appel
   */
  awardFromOrderTotal(totalDhs: number): number {
    const amount = Math.max(0, Number(totalDhs) || 0);
    if (amount <= 0) return 0;
    let earned = Math.floor((amount / 10) * POINTS_PER_10_DH);
    if (earned < 1) earned = 1;
    const nextTotal = this._state.value.totalPoints + earned;
    this.lastEarned = earned;
    const next = this.computeStateFromTotal(nextTotal);
    this._state.next(next);
    this.persistTotalToKey(this.activeKey, next.totalPoints);
    return earned;
  }

  private computeStateFromTotal(total: number): LoyaltyState {
    const mod = total % BAR_STEP;
    const barPercent = total <= 0 ? 0 : Math.round((mod / BAR_STEP) * 100);
    return { totalPoints: total, barPercent };
  }

  private static storageKeyFor(userId: number | null): string {
    return userId != null ? `${PREFIX}-user-${userId}` : `${PREFIX}-guest`;
  }

  private static migrateLegacyKey(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (!legacy?.trim()) return;
      const guest = LoyaltyPointsService.storageKeyFor(null);
      if (localStorage.getItem(guest)) return;
      localStorage.setItem(guest, legacy);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }

  private readFromKey(key: string): LoyaltyState {
    if (typeof localStorage === 'undefined') {
      return { totalPoints: 0, barPercent: 0 };
    }
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { totalPoints: 0, barPercent: 0 };
      const n = Math.max(0, Math.floor(Number(JSON.parse(raw))));
      return this.computeStateFromTotal(Number.isFinite(n) ? n : 0);
    } catch {
      return { totalPoints: 0, barPercent: 0 };
    }
  }

  private persistTotalToKey(key: string, total: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const n = Math.max(0, Math.floor(total));
      if (n <= 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(n));
      }
    } catch {
      /* ignore */
    }
  }
}
