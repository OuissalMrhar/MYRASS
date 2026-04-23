import { Component, OnInit } from '@angular/core';
import { CategorieService } from '../../../services/categorie.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Categorie } from '../../../models/categorie.model';

@Component({
  selector: 'app-categorie-form',
  templateUrl: './categorie-form.component.html',
  styleUrl: './categorie-form.component.scss'
})
export class CategorieFormComponent implements OnInit {
  id?: number;
  activeLang: 'fr' | 'en' | 'ar' = 'fr';
  saving = false;
  errorMessage: string | null = null;
  form: Categorie = {
    nom: '',
    nomEn: null,
    nomAr: null,
    description: '',
    descriptionEn: null,
    descriptionAr: null,
    statut: true,
  };

  setLang(l: 'fr' | 'en' | 'ar'): void {
    this.activeLang = l;
  }

  constructor(
    private service: CategorieService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id) {
      this.service.getById(this.id).subscribe((data) => {
        this.form = { ...data, statut: data.statut !== false };
        this.form.nomEn = (data.nomEn ?? null) as any;
        this.form.descriptionEn = (data.descriptionEn ?? null) as any;
      });
    }
  }

  save(): void {
    if (this.saving) return;
    this.errorMessage = null;
    if (!this.form.nom.trim()) {
      alert('Nom requis');
      return;
    }

    this.saving = true;
    if (this.id) {
      this.service.update(this.id, this.form).subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/categories']);
        },
        error: (e) => {
          this.errorMessage = e?.error?.message ?? e?.message ?? "Erreur lors de l'enregistrement.";
          this.saving = false;
        },
      });
    } else {
      this.service.create(this.form).subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/categories']);
        },
        error: (e) => {
          this.errorMessage = e?.error?.message ?? e?.message ?? "Erreur lors de l'enregistrement.";
          this.saving = false;
        },
      });
    }
  }

  annuler(): void {
    this.router.navigate(['/categories']);
  }
}