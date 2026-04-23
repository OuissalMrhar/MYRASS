import { FormBuilder, Validators } from '@angular/forms';
import { Gift, GiftWrite, GiftProduitWrite } from '../../models/gift.model';

export function buildGiftForm(fb: FormBuilder) {
  return fb.group({
    nom: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    produits: fb.array([] as GiftProduitWrite[]),
  });
}

export function mapGiftToWrite(g: Gift): GiftWrite {
  return {
    nom: g.nom,
    description: g.description ?? null,
    produits: (g.produits ?? []).map((p) => ({ produitId: p.produitId, quantite: p.quantite })),
  };
}

