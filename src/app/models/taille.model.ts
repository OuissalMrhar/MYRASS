export interface Taille {
  id: number;
  typeProduitId: number;
  typeProduitNom?: string | null;
  valeur: number;
  unite: string;
  uniteEn?: string | null;
  uniteAr?: string | null;
  label: string;
  labelEn?: string | null;
  labelAr?: string | null;
}

export interface TailleWrite {
  typeProduitId: number;
  valeur: number;
  unite: string;
  uniteEn?: string | null;
  uniteAr?: string | null;
}
