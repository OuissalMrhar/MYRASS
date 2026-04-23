import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogueService } from '../../../services/catalogue.service';
import { Catalogue } from '../../../models/catalogue.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-catalogue-afficher',
  templateUrl: './catalogue-afficher.component.html',
  styleUrl: './catalogue-afficher.component.scss',
})
export class CatalogueAfficherComponent implements OnInit {
  rows: Catalogue[] | null = null;
  loading = true;
  errorMessage: string | null = null;
  actionError: string | null = null;

  constructor(
    private catalogueService: CatalogueService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.catalogueService.getAll().subscribe({
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
    void this.router.navigate(['/catalogues/nouveau']);
  }

  modifier(id: number): void {
    void this.router.navigate(['/catalogues', id, 'edit']);
  }

  supprimer(row: Catalogue): void {
    this.actionError = null;
    const ok = confirm(
      `Supprimer le catalogue « ${row.nom} » ? Cette action est irréversible.`,
    );
    if (!ok) return;
    this.catalogueService.delete(row.id).subscribe({
      next: () => this.load(),
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }
}