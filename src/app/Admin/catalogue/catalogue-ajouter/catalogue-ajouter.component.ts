import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogueService } from '../../../services/catalogue.service';
import { CategorieService } from '../../../services/categorie.service';
import { Categorie } from '../../../models/categorie.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-catalogue-ajouter',
  templateUrl: './catalogue-ajouter.component.html',
  styleUrl: './catalogue-ajouter.component.scss',
})
export class CatalogueAjouterComponent implements OnInit {
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  categories: Categorie[] = [];
  loadingCats = true;
  saving = false;
  errorMessage: string | null = null;

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
    private catalogueService: CatalogueService,
    private categorieService: CategorieService,
    private router: Router,
  ) {}

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
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
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const v = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = null;
    this.catalogueService
      .create({
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