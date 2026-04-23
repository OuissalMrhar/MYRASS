export interface Catalogue {
  id: number;
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  categorieId: number;
  categorieNom?: string | null;
  categorieNomEn?: string | null;
  categorieNomAr?: string | null;
  statut?: boolean;
}

export interface CatalogueWrite {
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  categorieId: number;
  statut?: boolean;
}
