/**
 * Segments d'URL pour `/product-detail/:slug` (nom lisible + id pour unicité).
 * Ex. « Huile Naturelle » id 9 → `huile-naturelle-9`
 */

export function slugifyForUrl(s: string): string {
  const n = (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return n || 'produit';
}

export function buildProductSlug(nom: string | null | undefined, id: number): string {
  return `${slugifyForUrl(nom?.trim() || '')}-${id}`;
}

/** Extrait l'id produit depuis l'URL (ex. `9` ou `mon-produit-9`). */
export function parseProductIdFromSlugParam(param: string | null | undefined): number | null {
  const p = param?.trim();
  if (!p) return null;
  if (/^\d+$/.test(p)) {
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m = p.match(/-(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
