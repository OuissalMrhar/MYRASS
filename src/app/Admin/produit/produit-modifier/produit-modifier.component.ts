import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { ProduitService } from '../../../services/produit.service';
import { CatalogueService } from '../../../services/catalogue.service';
import { TypeProduitService } from '../../../services/type-produit.service';
import { Catalogue } from '../../../models/catalogue.model';
import { TypeProduit } from '../../../models/type-produit.model';
import { CategorieService } from '../../../services/categorie.service';
import { Categorie } from '../../../models/categorie.model';
import { TailleService } from '../../../services/taille.service';
import { Taille } from '../../../models/taille.model';
import {
  MediaKind,
  ProduitMediaFormRow,
  ProduitMediaWrite,
  ProduitTailleWrite,
} from '../../../models/produit.model';
import { parseApiError } from '../../../core/http-error';
import { STATIC_PRODUCT_IMAGE_URL } from '../../../core/static-product-image';

@Component({
  selector: 'app-produit-modifier',
  templateUrl: './produit-modifier.component.html',
  styleUrl: './produit-modifier.component.scss',
})
export class ProduitModifierComponent implements OnInit {
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  categories: Categorie[] = [];
  mediaRows: ProduitMediaFormRow[] = [];
  catalogues: Catalogue[] = [];
  filteredCatalogues: Catalogue[] = [];
  types: TypeProduit[] = [];
  tailles: Taille[] = [];
  tailleRows: ProduitTailleWrite[] = [];
  loadingRefs = true;
  loadingRow = true;
  saving = false;
  errorMessage: string | null = null;
  private id = 0;

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(300)]],
    nomEn: [''],
    nomAr: [''],
    description: [''],
    descriptionEn: [''],
    descriptionAr: [''],
    categorieId: [null as number | null, Validators.required],
    catalogueId: [null as number | null, Validators.required],
    typeProduitId: [null as number | null, Validators.required],
    statut: [true],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private produitService: ProduitService,
    private categorieService: CategorieService,
    private catalogueService: CatalogueService,
    private typeProduitService: TypeProduitService,
    private tailleService: TailleService,
    private router: Router,
  ) {}

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? +idParam : 0;
    if (!this.id) {
      void this.router.navigate(['/produits']);
      return;
    }

    forkJoin({
      categories: this.categorieService.getAll(),
      catalogues: this.catalogueService.getAll(),
    }).subscribe({
      next: ({ categories, catalogues }) => {
        this.categories = categories;
        this.catalogues = catalogues;
        const cid = this.form.getRawValue().categorieId;
        this.filteredCatalogues = cid
          ? this.catalogues.filter((c) => c.categorieId === cid)
          : [];
        // Ne pas vider types/tailles : getById peut déjà les avoir remplis (course avec forkJoin).
        this.loadingRefs = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingRefs = false;
      },
    });

    // Charger le produit puis — immédiatement après — les tailles, pour que le
    // menu déroulant "Taille liée" des médias ait ses options avant le rendu.
    this.produitService.getById(this.id).pipe(
      switchMap((row) => forkJoin({
        row: of(row),
        tailles: row.typeProduitId
          ? this.tailleService.getAll({ typeProduitId: row.typeProduitId })
          : of<Taille[]>([]),
        types: row.catalogueId
          ? this.typeProduitService.getAll({ catalogueId: row.catalogueId })
          : of<TypeProduit[]>([]),
      })),
    ).subscribe({
      next: ({ row, tailles, types }) => {
        this.tailles = tailles;
        this.types = types;
        const cid = row.categorieId ?? null;
        this.filteredCatalogues = cid ? this.catalogues.filter((c) => c.categorieId === cid) : [];
        this.form.patchValue(
          {
            nom: row.nom,
            nomEn: row.nomEn ?? '',
            nomAr: row.nomAr ?? '',
            description: row.description ?? '',
            descriptionEn: row.descriptionEn ?? '',
            descriptionAr: row.descriptionAr ?? '',
            categorieId: cid,
            catalogueId: row.catalogueId,
            typeProduitId: row.typeProduitId,
            statut: row.statut !== false,
          },
          { emitEvent: false },
        );
        if (row.tailles && row.tailles.length > 0) {
          this.tailleRows = row.tailles.map((t) => ({
            tailleId: t.tailleId,
            prix: t.prix,
            stock: t.stock,
          }));
        } else if (row.volumes && row.volumes.length > 0) {
          this.tailleRows = row.volumes.map((v) => ({
            tailleId: v.volumeId,
            prix: v.prix,
            stock: v.stock,
          }));
        } else {
          this.tailleRows = [];
        }

        // tailles déjà chargées → les options du select existent avant le rendu
        const medias = row.medias ?? [];
        this.mediaRows = medias.map((m) => ({
          mediaId: m.mediaId,
          url: m.url,
          kind: m.kind,
          legende: m.legende ?? '',
          estPrincipale: !!(m.estPrincipale && m.kind === 'image'),
          uploading: false,
          uploadError: null,
          tailleId: m.tailleId ?? null,
        }));
        const imgRows = this.mediaRows.filter((r) => r.kind === 'image');
        if (imgRows.length > 0 && !imgRows.some((r) => r.estPrincipale)) {
          imgRows[0].estPrincipale = true;
        }
        this.loadingRow = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingRow = false;
      },
    });

    this.form.controls.categorieId.valueChanges.subscribe((cid) => {
      this.filteredCatalogues = cid
        ? this.catalogues.filter((c) => c.categorieId === cid)
        : [];
      // emitEvent:false évite la cascade vers catalogueId → typeProduitId.valueChanges
      this.form.patchValue({ catalogueId: null, typeProduitId: null }, { emitEvent: false });
      this.types = [];
      this.tailles = [];
      this.tailleRows = [];
    });

    this.form.controls.catalogueId.valueChanges.subscribe((catId) => {
      // emitEvent:false évite la cascade vers typeProduitId.valueChanges
      this.form.patchValue({ typeProduitId: null }, { emitEvent: false });
      this.tailles = [];
      this.tailleRows = [];
      if (!catId) {
        this.types = [];
        return;
      }
      this.typeProduitService.getAll({ catalogueId: catId }).subscribe({
        next: (data) => (this.types = data),
        error: (e) => (this.errorMessage = parseApiError(e)),
      });
    });

    // Ne se déclenche QUE quand l'admin change manuellement le type de produit
    this.form.controls.typeProduitId.valueChanges.subscribe((typeId) => {
      this.tailleRows = [];
      if (!typeId) {
        this.tailles = [];
        return;
      }
      this.tailleService.getAll({ typeProduitId: typeId }).subscribe({
        next: (rows: Taille[]) => (this.tailles = rows),
        error: (e: unknown) => (this.errorMessage = parseApiError(e)),
      });
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.getRawValue();
    const tailles = this.buildTaillesWrite();
    const primaryTaille = this.getPrimaryTaille(tailles);
    this.saving = true;
    this.errorMessage = null;
    this.produitService
      .update(this.id, {
        nom: v.nom!.trim(),
        nomEn: v.nomEn?.trim() || null,
        nomAr: (v as any).nomAr?.trim() || null,
        description: v.description?.trim() || null,
        descriptionEn: v.descriptionEn?.trim() || null,
        descriptionAr: (v as any).descriptionAr?.trim() || null,
        statut: v.statut ?? true,
        catalogueId: v.catalogueId!,
        typeProduitId: v.typeProduitId!,
        volumeId: primaryTaille?.tailleId ?? null,
        tailles,
        medias: this.buildMediasWrite(),
      })
      .subscribe({
        next: () => void this.router.navigate(['/produits']),
        error: (e: unknown) => {
          this.errorMessage = parseApiError(e);
          this.saving = false;
        },
      });
  }

  addMediaRow(kind: MediaKind = 'image'): void {
    const isFirstImage =
      kind === 'image' && this.mediaRows.filter((r) => r.kind === 'image').length === 0;
    this.mediaRows.push({
      mediaId: null,
      url: STATIC_PRODUCT_IMAGE_URL,
      kind,
      legende: '',
      estPrincipale: isFirstImage && this.mediaRows.every((r) => !r.estPrincipale),
      uploading: false,
      uploadError: null,
      tailleId: null,
    });
  }

  onPrincipalChange(idx: number): void {
    const row = this.mediaRows[idx];
    if (!row || row.kind !== 'image') return;
    this.mediaRows.forEach((r, i) => {
      if (r.kind === 'image') r.estPrincipale = i === idx;
    });
  }

  addTailleRow(): void {
    this.tailleRows.push({ tailleId: 0, prix: 0, stock: 0 });
  }

  removeTailleRow(idx: number): void {
    this.tailleRows.splice(idx, 1);
  }

  removeMediaRow(idx: number): void {
    this.mediaRows.splice(idx, 1);
  }

  private buildMediasWrite(): ProduitMediaWrite[] {
    const out: ProduitMediaWrite[] = [];
    this.mediaRows.forEach((r, i) => {
      const url = r.url?.trim() ?? '';
      const hasId = r.mediaId != null && r.mediaId > 0;
      if (!hasId && !url) return;
      out.push({
        mediaId: hasId ? r.mediaId : null,
        url: hasId ? null : url || null,
        kind: r.kind,
        ordre: i,
        legende: r.legende?.trim() || null,
        estPrincipale: r.kind === 'image' && r.estPrincipale,
        tailleId: r.tailleId || null,
      });
    });
    return out;
  }

  annuler(): void {
    void this.router.navigate(['/produits']);
  }

  private buildTaillesWrite(): ProduitTailleWrite[] {
    const used = new Set<number>();
    const out: ProduitTailleWrite[] = [];
    for (const row of this.tailleRows) {
      if (!row.tailleId || row.tailleId <= 0) continue;
      if (used.has(row.tailleId)) continue;
      used.add(row.tailleId);
      out.push({
        tailleId: row.tailleId,
        prix: row.prix,
        stock: row.stock,
      });
    }
    return out;
  }

  private getPrimaryTaille(rows: ProduitTailleWrite[]): ProduitTailleWrite | null {
    return rows.length > 0 ? rows[0] : null;
  }
}