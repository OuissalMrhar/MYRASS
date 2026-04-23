export interface TypeProduit {
  id: number;
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  catalogueId: number;
  catalogueNom?: string | null;
  catalogueNomEn?: string | null;
  catalogueNomAr?: string | null;
  categorieId?: number;
  categorieNom?: string | null;
  categorieNomEn?: string | null;
  categorieNomAr?: string | null;
  statut?: boolean;
  histoire?: string | null;
  histoireEn?: string | null;
  histoireAr?: string | null;
  mediaUrls?: string[] | null;
}

export interface TypeProduitWrite {
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  catalogueId: number;
  statut?: boolean;
  histoire?: string | null;
  histoireEn?: string | null;
  histoireAr?: string | null;
  mediaUrls?: string[] | null;
}
