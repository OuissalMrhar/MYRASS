import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TypeProduitService } from '../../../services/type-produit.service';
import { CatalogueService } from '../../../services/catalogue.service';
import { Catalogue } from '../../../models/catalogue.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-type-produit-ajouter',
  templateUrl: './type-produit-ajouter.component.html',
  styleUrl: './type-produit-ajouter.component.scss',
})
export class TypeProduitAjouterComponent {
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  catalogues: Catalogue[] = [];
  loadingRefs = true;
  saving = false;
  errorMessage: string | null = null;

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(200)]],
    nomEn: [''],
    nomAr: [''],
    catalogueId: [null as number | null, Validators.required],
    statut: [true],
    histoire: [''],
    histoireEn: [''],
    histoireAr: [''],
    media1: [''],
    media2: [''],
    media3: [''],
  });

  constructor(
    private fb: FormBuilder,
    private typeProduitService: TypeProduitService,
    private catalogueService: CatalogueService,
    private router: Router,
  ) {}

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
    this.catalogueService.getAll().subscribe({
      next: (data) => {
        this.catalogues = data;
        this.loadingRefs = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingRefs = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.errorMessage = null;
    const v = this.form.getRawValue();
    const mediaUrls = [v.media1, v.media2, v.media3].filter((x) => !!x && x.trim().length > 0) as string[];
    this.typeProduitService
      .create({
        nom: v.nom!.trim(),
        nomEn: v.nomEn?.trim() || null,
        nomAr: (v as any).nomAr?.trim() || null,
        catalogueId: v.catalogueId!,
        statut: v.statut ?? true,
        histoire: v.histoire?.trim() || null,
        histoireEn: v.histoireEn?.trim() || null,
        histoireAr: (v as any).histoireAr?.trim() || null,
        mediaUrls,
      })
      .subscribe({
      next: () => void this.router.navigate(['/types-produit']),
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.saving = false;
      },
    });
  }

  annuler(): void {
    void this.router.navigate(['/types-produit']);
  }
}