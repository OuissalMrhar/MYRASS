import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { parseApiError } from '../../../core/http-error';
import { Gift, GiftWrite } from '../../../models/gift.model';
import { Produit } from '../../../models/produit.model';
import { GiftService } from '../../../services/gift.service';
import { ProduitService } from '../../../services/produit.service';

@Component({
  selector: 'app-gift-modifier',
  templateUrl: './gift-modifier.component.html',
  styleUrl: './gift-modifier.component.scss',
})
export class GiftModifierComponent implements OnInit {
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  id = 0;
  produits: Produit[] = [];
  loading = true;
  saving = false;
  errorMessage: string | null = null;

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(200)]],
    nomEn: [''],
    nomAr: [''],
    description: [''],
    descriptionEn: [''],
    descriptionAr: [''],
    prix: [null as number | null, [Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['' as string | null],
    produits: this.fb.array([]),
  });

  get produitsArray(): FormArray {
    return this.form.get('produits') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private giftService: GiftService,
    private produitService: ProduitService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    if (!this.id) {
      this.errorMessage = 'Id gift invalide.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.produitService.getAll().subscribe({
      next: (p) => {
        this.produits = p;
        this.loadGift();
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loading = false;
      },
    });
  }

  private loadGift(): void {
    this.giftService.getById(this.id).subscribe({
      next: (g) => {
        this.patchForm(g);
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loading = false;
      },
    });
  }

  private patchForm(g: Gift): void {
    this.form.patchValue({
      nom: g.nom,
      nomEn: g.nomEn ?? '',
      nomAr: g.nomAr ?? '',
      description: g.description ?? '',
      descriptionEn: g.descriptionEn ?? '',
      descriptionAr: g.descriptionAr ?? '',
      prix: g.prix ?? null,
      stock: g.stock ?? 0,
      imageUrl: g.imageUrl ?? '',
    });

    this.produitsArray.clear();
    for (const row of g.produits ?? []) {
      this.produitsArray.push(
        this.fb.group({
          produitId: [row.produitId, Validators.required],
          tailleId: [row.tailleId ?? null],
          quantite: [row.quantite, [Validators.required, Validators.min(1)]],
        }),
      );
    }
    if (this.produitsArray.length === 0) this.addProduitRow();
  }

  addProduitRow(): void {
    this.produitsArray.push(
      this.fb.group({
        produitId: [null as number | null, Validators.required],
        tailleId: [null as number | null],
        quantite: [1, [Validators.required, Validators.min(1)]],
      }),
    );
  }

  removeProduitRow(i: number): void {
    this.produitsArray.removeAt(i);
  }

  onProduitRowChanged(i: number): void {
    const row = this.produitsArray.at(i);
    if (!row) return;
    row.patchValue({ tailleId: null }, { emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.getRawValue();
    const body: GiftWrite = {
      nom: v.nom!.trim(),
      nomEn: v.nomEn?.trim() || null,
      nomAr: (v as any).nomAr?.trim() || null,
      description: v.description?.trim() || null,
      descriptionEn: v.descriptionEn?.trim() || null,
      descriptionAr: (v as any).descriptionAr?.trim() || null,
      prix: v.prix != null && v.prix !== ('' as any) ? Number(v.prix) : null,
      stock: Number(v.stock ?? 0),
      imageUrl: (v as any).imageUrl?.trim() || null,
      produits: (v.produits ?? [])
        .filter((x: any) => !!x && Number(x.produitId) > 0)
        .map((x: any) => ({
          produitId: Number(x.produitId),
          tailleId: x.tailleId != null && Number(x.tailleId) > 0 ? Number(x.tailleId) : null,
          quantite: Number(x.quantite ?? 1),
        })),
    };

    this.saving = true;
    this.errorMessage = null;
    this.giftService.update(this.id, body).subscribe({
      next: () => void this.router.navigate(['/gifts']),
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.saving = false;
      },
    });
  }

  annuler(): void {
    void this.router.navigate(['/gifts']);
  }

  taillesForProduitId(produitId: number | null): Array<{ tailleId: number; tailleLabel?: string | null }> {
    const pid = Number(produitId);
    if (!Number.isFinite(pid) || pid <= 0) return [];
    const p = this.produits.find((x) => x.id === pid);
    return (p?.tailles ?? []).map((t) => ({ tailleId: t.tailleId, tailleLabel: t.tailleLabel }));
  }
}

