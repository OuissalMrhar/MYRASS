import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TypeProduitService } from '../../../services/type-produit.service';
import { CatalogueService } from '../../../services/catalogue.service';
import { Catalogue } from '../../../models/catalogue.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-type-produit-modifier',
  templateUrl: './type-produit-modifier.component.html',
  styleUrl: './type-produit-modifier.component.scss',
})
export class TypeProduitModifierComponent implements OnInit {
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  catalogues: Catalogue[] = [];
  loadingRefs = true;
  loadingRow = true;
  saving = false;
  errorMessage: string | null = null;
  private id = 0;

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
    private route: ActivatedRoute,
    private typeProduitService: TypeProduitService,
    private catalogueService: CatalogueService,
    private router: Router,
  ) {}

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? +idParam : 0;
    if (!this.id) {
      void this.router.navigate(['/types-produit']);
      return;
    }

    forkJoin({
      catalogues: this.catalogueService.getAll(),
      row: this.typeProduitService.getById(this.id),
    }).subscribe({
      next: ({ catalogues, row }) => {
        this.catalogues = catalogues;
        this.loadingRefs = false;
        const urls = row.mediaUrls ?? [];
        this.form.patchValue({
          nom: row.nom,
          nomEn: row.nomEn ?? '',
          nomAr: row.nomAr ?? '',
          catalogueId: row.catalogueId,
          histoire: row.histoire ?? '',
          histoireEn: row.histoireEn ?? '',
          histoireAr: row.histoireAr ?? '',
          media1: urls[0] ?? '',
          media2: urls[1] ?? '',
          media3: urls[2] ?? '',
        });
        this.loadingRow = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loadingRefs = false;
        this.loadingRow = false;
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
      .update(this.id, {
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