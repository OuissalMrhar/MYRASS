import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Categorie } from '../../../models/categorie.model';
import { CategorieService } from '../../../services/categorie.service';

@Component({
  selector: 'app-categorie-list',
  templateUrl: './categorie-list.component.html',
  styleUrl: './categorie-list.component.scss'
})
export class CategorieListComponent implements OnInit {
  categories: Categorie[] = [];
  loading = true;
  error: string | null = null;
  actionError: string | null = null;

  constructor(private service: CategorieService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.service.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur chargement des catégories';
        console.error(err);
        this.loading = false;
      }
    });
  }

  add(): void {
    // Le routing du projet utilise le chemin `categories/nouveau` (pas `categories/new`)
    this.router.navigate(['/categories/nouveau']);
  }

  edit(id?: number): void {
    if (!id) return;
    this.router.navigate(['/categories', id, 'edit']);
  }

  delete(id?: number): void {
    if (!id) return;
    const ok = confirm('Voulez-vous vraiment supprimer cette catégorie ?');
    if (!ok) return;

    this.actionError = null;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        console.error(err);
        this.actionError = 'Impossible de supprimer la catégorie';
      }
    });
  }
}