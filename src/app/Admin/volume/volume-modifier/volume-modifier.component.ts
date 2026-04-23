import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { parseApiError } from '../../../core/http-error';
import { TailleService } from '../../../services/taille.service';
import { TypeProduitService } from '../../../services/type-produit.service';
import { TypeProduit } from '../../../models/type-produit.model';
import { Categorie } from '../../../models/categorie.model';
import { Catalogue } from '../../../models/catalogue.model';
import { CategorieService } from '../../../services/categorie.service';
import { CatalogueService } from '../../../services/catalogue.service';

@Component({
  selector: 'app-volume-modifier',
  templateUrl: './volume-modifier.component.html',
  styleUrl: './volume-modifier.component.scss',
})
export class VolumeModifierComponent implements OnInit {
  activeLang: 'fr' | 'en' = 'fr';
  saving = false;
  loading = true;
  loadingTypes = true;
  ready = false;
  errorMessage: string | null = null;
  private tailleId: number | null = null;
  categories: Categorie[] = [];
  catalogues: Catalogue[] = [];
  filteredCatalogues: Catalogue[] = [];
  types: TypeProduit[] = [];
  filteredTypes: TypeProduit[] = [];

  form = this.fb.group({
    categorieId: [null as number | null, Validators.required],
    catalogueId: [null as number | null, Validators.required],
    typeProduitId: [null as number | null, Validators.required],
    valeur: [0, [Validators.required, Validators.min(0.000001)]],
    unite: ['', [Validators.required, Validators.maxLength(50)]],
    uniteEn: [''],
  });

  constructor(
    private fb: FormBuilder,
    private tailleService: TailleService,
    private typeProduitService: TypeProduitService,
    private categorieService: CategorieService,
    private catalogueService: CatalogueService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form.controls.categorieId.valueChanges.subscribe((cid) => {
      this.filteredCatalogues = cid ? this.catalogues.filter((c) => c.categorieId === cid) : [];
      this.form.patchValue({ catalogueId: null, typeProduitId: null });
      this.filteredTypes = [];
    });

    this.form.controls.catalogueId.valueChanges.subscribe((catId) => {
      this.form.patchValue({ typeProduitId: null });
      this.filteredTypes = catId ? this.types.filter((t) => t.catalogueId === catId) : [];
    });
  }

  setLang(l: 'fr' | 'en'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam, 10) : NaN;
    if (!Number.isFinite(id) || id < 1) {
      this.loading = false;
      this.errorMessage = 'Taille introuvable.';
      return;
    }
    this.tailleId = id;

    forkJoin({
      categories: this.categorieService.getAll(),
      catalogues: this.catalogueService.getAll(),
      types: this.typeProduitService.getAll(),
      tailles: this.tailleService.getAll(),
    }).subscribe({
      next: ({ categories, catalogues, types, tailles }) => {
        this.categories = categories;
        this.catalogues = catalogues;
        this.types = types;
        this.loadingTypes = false;

        const v = tailles.find((x) => x.id === id);
        if (!v) {
          this.errorMessage = 'Taille introuvable.';
          this.loading = false;
          this.ready = false;
          return;
        }

        const selectedType = types.find((t) => t.id === v.typeProduitId);
        const selectedCatalogueId = selectedType?.catalogueId ?? null;
        const selectedCategorieId =
          selectedCatalogueId != null
            ? catalogues.find((c) => c.id === selectedCatalogueId)?.categorieId ?? null
            : null;

        this.filteredCatalogues = selectedCategorieId
          ? catalogues.filter((c) => c.categorieId === selectedCategorieId)
          : [];
        this.filteredTypes = selectedCatalogueId
          ? types.filter((t) => t.catalogueId === selectedCatalogueId)
          : [];

        this.form.patchValue({
          categorieId: selectedCategorieId,
          catalogueId: selectedCatalogueId,
          typeProduitId: v.typeProduitId,
          valeur: v.valeur,
          unite: v.unite,
          uniteEn: (v as any).uniteEn ?? '',
        });

        this.loading = false;
        this.ready = true;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loading = false;
        this.loadingTypes = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving || this.tailleId == null) return;
    const typeProduitId = this.form.controls.typeProduitId.value!;
    const valeur = this.form.controls.valeur.value!;
    const unite = this.form.controls.unite.value!.trim();
    const uniteEn = this.form.controls.uniteEn.value?.trim() || null;
    this.saving = true;
    this.errorMessage = null;
    this.tailleService.update(this.tailleId, { typeProduitId, valeur, unite, uniteEn }).subscribe({
      next: () => void this.router.navigate(['/tailles']),
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.saving = false;
      },
    });
  }

  annuler(): void {
    void this.router.navigate(['/tailles']);
  }
}