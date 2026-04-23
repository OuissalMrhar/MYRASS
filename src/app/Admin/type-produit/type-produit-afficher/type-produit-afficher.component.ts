import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TypeProduitService } from '../../../services/type-produit.service';
import { TypeProduit } from '../../../models/type-produit.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-type-produit-afficher',
  templateUrl: './type-produit-afficher.component.html',
  styleUrl: './type-produit-afficher.component.scss',
})
export class TypeProduitAfficherComponent implements OnInit {
  rows: TypeProduit[] | null = null;
  loading = true;
  errorMessage: string | null = null;
  actionError: string | null = null;

  constructor(
    private typeProduitService: TypeProduitService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.typeProduitService.getAll().subscribe({
      next: (data) => {
        this.rows = data;
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loading = false;
      },
    });
  }

  ajouter(): void {
    void this.router.navigate(['/types-produit/nouveau']);
  }

  modifier(id: number): void {
    void this.router.navigate(['/types-produit', id, 'edit']);
  }

  supprimer(row: TypeProduit): void {
    this.actionError = null;
    const ok = confirm(`Supprimer le type « ${row.nom} » ?`);
    if (!ok) return;
    this.typeProduitService.delete(row.id).subscribe({
      next: () => this.load(),
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }
}