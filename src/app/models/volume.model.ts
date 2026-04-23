export interface Volume {
  id: number;
  label: string;
}

export interface VolumeWrite {
  label: string;
}

export interface ProduitVolumeWrite {
  volumeId: number;
  prix: number;
  stock: number;
}

