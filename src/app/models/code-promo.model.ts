export type CodePromoTypeRemise = 'pourcentage' | 'montantFixe';

export interface CodePromo {
  id: number;
  code: string;
  description?: string | null;
  typeRemise: CodePromoTypeRemise;
  valeur: number;
  actif: boolean;
  dateDebutUtc?: string | null;
  dateFinUtc?: string | null;
  utilisationsMax?: number | null;
  utilisationsCount: number;
  montantMinimumPanier?: number | null;
}

export interface CodePromoWrite {
  code: string;
  description?: string | null;
  typeRemise: CodePromoTypeRemise;
  valeur: number;
  actif: boolean;
  dateDebutUtc?: string | null;
  dateFinUtc?: string | null;
  utilisationsMax?: number | null;
  montantMinimumPanier?: number | null;
}
