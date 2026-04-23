/** Aligné sur l'API : JSON camelCase, enum MediaKind image | video */
export type MediaKind = 'image' | 'video';

export interface ProduitMediaItem {
  mediaId: number;
  url: string;
  kind: MediaKind;
  ordre: number;
  /** Texte alternatif / légende (SEO, accessibilité). */
  legende?: string | null;
  /** Vignette listes & produits associés. */
  estPrincipale?: boolean;
  /** Si défini, cette image s'affiche uniquement pour cette taille. */
  tailleId?: number | null;
}

export interface Produit {
  id: number;
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  prix?: number | null;
  quantite?: number;
  stock?: number | null;
  /** Actif côté admin (combiné au stock pour la boutique). */
  statut?: boolean;
  stockEffectif?: number;
  /** disponible | rupture | avenir | masque */
  rubriqueVisiteur?: string;
  categorieId?: number;
  catalogueId: number;
  typeProduitId: number;
  catalogueNom?: string;
  catalogueNomEn?: string | null;
  catalogueNomAr?: string | null;
  categorieNom?: string;
  categorieNomEn?: string | null;
  categorieNomAr?: string | null;
  typeProduitNom?: string;
  typeProduitNomEn?: string | null;
  typeProduitNomAr?: string | null;

  medias?: ProduitMediaItem[];

  tailles?: Array<{
    tailleId: number;
    tailleLabel?: string | null;
    tailleLabelEn?: string | null;
    tailleLabelAr?: string | null;
    prix: number;
    stock: number;
  }>;

  volumes?: Array<{
    volumeId: number;
    volumeLabel?: string | null;
    prix: number;
    stock: number;
  }>;
}

export interface ProduitMediaWrite {
  mediaId?: number | null;
  url?: string | null;
  kind: MediaKind;
  ordre: number;
  legende?: string | null;
  estPrincipale?: boolean;
  tailleId?: number | null;
}

/** Ligne média dans les formulaires admin (ajout / édition produit). */
export interface ProduitMediaFormRow {
  mediaId: number | null;
  url: string;
  kind: MediaKind;
  legende: string;
  estPrincipale: boolean;
  uploading: boolean;
  uploadError: string | null;
  /** Taille liée à cette image (optionnel). */
  tailleId: number | null;
}

export interface ProduitTailleWrite {
  tailleId: number;
  prix: number;
  stock: number;
}

export interface ProduitWrite {
  nom: string;
  nomEn?: string | null;
  nomAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  statut?: boolean;
  catalogueId: number;
  typeProduitId: number;
  volumeId?: number | null;
  tailleId?: number | null;
  tailles?: ProduitTailleWrite[] | null;
  medias?: ProduitMediaWrite[] | null;
}
