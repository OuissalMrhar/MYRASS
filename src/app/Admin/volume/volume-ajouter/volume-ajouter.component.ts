import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  selector: 'app-volume-ajouter',
  templateUrl: './volume-ajouter.component.html',
  styleUrl: './volume-ajouter.component.scss',
})
export class VolumeAjouterComponent {
  activeLang: 'fr' | 'en' = 'fr';
  saving = false;
  loadingTypes = true;
  errorMessage: string | null = null;
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
    private router: Router,
  ) {
    forkJoin({
      categories: this.categorieService.getAll(),
      catalogues: this.catalogueService.getAll(),
      types: this.typeProduitService.getAll(),
    }).subscribe({
      next: ({ categories, catalogues, types }) => {
        this.categories = categories;
        this.catalogues = catalogues;
        this.types = types;
        this.loadingTypes = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingTypes = false;
      },
    });

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

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const typeProduitId = this.form.controls.typeProduitId.value!;
    const valeur = this.form.controls.valeur.value!;
    const unite = this.form.controls.unite.value!.trim();
    const uniteEn = this.form.controls.uniteEn.value?.trim() || null;
    this.saving = true;
    this.errorMessage = null;
    this.tailleService.create({ typeProduitId, valeur, unite, uniteEn }).subscribe({
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