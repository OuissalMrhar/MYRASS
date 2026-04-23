import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const RV_KEY = 'myrass-recently-viewed-v1';
const MAX_IDS = 10;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private readonly _ids = new BehaviorSubject<number[]>(RecentlyViewedService.load());
  readonly ids$ = this._ids.asObservable();

  track(productId: number): void {
    const current = this._ids.value.filter((id) => id !== productId);
    const updated = [productId, ...current].slice(0, MAX_IDS);
    this._ids.next(updated);
    RecentlyViewedService.persist(updated);
  }

  getIds(): number[] {
    return this._ids.value;
  }

  private static load(): number[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(RV_KEY);
      if (!raw?.trim()) return [];
      const data = JSON.parse(raw) as unknown;
      if (!Array.isArray(data)) return [];
      return data.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
    } catch {
      return [];
    }
  }

  private static persist(ids: number[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (ids.length === 0) localStorage.removeItem(RV_KEY);
      else localStorage.setItem(RV_KEY, JSON.stringify(ids));
    } catch {
      /* quota */
    }
  }
}
