import { environment } from '../../environments/environment';

/** Préfixe API (vide en dev avec proxy). */
export function apiBase(): string {
  return environment.apiBaseUrl.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase()}${p}`;
}
