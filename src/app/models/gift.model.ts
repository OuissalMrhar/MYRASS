export interface GiftProduitItem {
  produitId: number;
  produitNom?: string | null;
  produitNomEn?: string | null;
  produitNomAr?: string | null;
  produitPrix?: number | null;
  produitImageUrl?: string | null;
  tailleId?: number | null;
  tailleLabel?: string | null;
  quantite: number;
}

export interface Gift {
  id: number;
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  prix?: number | null;
  stock?: number;
  imageUrl?: string | null;
  produits: GiftProduitItem[];
}

export interface GiftProduitWrite {
  produitId: number;
  tailleId?: number | null;
  quantite: number;
}

export interface GiftWrite {
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  prix?: number | null;
  stock?: number;
  imageUrl?: string | null;
  produits: GiftProduitWrite[];
}
