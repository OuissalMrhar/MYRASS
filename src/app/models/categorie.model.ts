export interface Categorie {
  id?: number;
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  /** Actif = visible / sélectionnable côté boutique. */
  statut?: boolean;
}
