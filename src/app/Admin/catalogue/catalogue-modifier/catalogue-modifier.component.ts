import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogueService } from '../../../services/catalogue.service';
import { CategorieService } from '../../../services/categorie.service';
import { Categorie } from '../../../models/categorie.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-catalogue-modifier',
  templateUrl: './catalogue-modifier.component.html',
  styleUrl: './catalogue-modifier.component.scss',
})
export class CatalogueModifierComponent implements OnInit {
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  categories: Categorie[] = [];
  loadingCats = true;
  loadingRow = true;
  saving = false;
  errorMessage: string | null = null;
  private id = 0;

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(200)]],
    nomEn: [''],
    nomAr: [''],
    description: [''],
    descriptionEn: [''],
    descriptionAr: [''],
    categorieId: [null as number | null, Validators.required],
    statut: [true],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private catalogueService: CatalogueService,
    private categorieService: CategorieService,
    private router: Router,
  ) {}

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? +idParam : 0;
    if (!this.id) {
      void this.router.navigate(['/catalogues']);
      return;
    }

    this.categorieService.getAll().subscribe({
      next: (c) => {
        this.categories = c;
        this.loadingCats = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingCats = false;
      },
    });

    this.catalogueService.getById(this.id).subscribe({
      next: (row) => {
        this.form.patchValue({
          nom: row.nom,
          nomEn: row.nomEn ?? '',
          nomAr: row.nomAr ?? '',
          description: row.description ?? '',
          descriptionEn: row.descriptionEn ?? '',
          descriptionAr: row.descriptionAr ?? '',
          categorieId: row.categorieId,
        });
        this.loadingRow = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingRow = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = null;
    this.catalogueService
      .update(this.id, {
        nom: v.nom!.trim(),
        nomEn: v.nomEn?.trim() || null,
        nomAr: (v as any).nomAr?.trim() || null,
        description: v.description?.trim() || null,
        descriptionEn: v.descriptionEn?.trim() || null,
        descriptionAr: (v as any).descriptionAr?.trim() || null,
        categorieId: v.categorieId!,
        statut: v.statut ?? true,
      })
      .subscribe({
        next: () => void this.router.navigate(['/catalogues']),
        error: (e) => {
          this.errorMessage = parseApiError(e);
          this.saving = false;
        },
      });
  }

  annuler(): void {
    void this.router.navigate(['/catalogues']);
  }
}