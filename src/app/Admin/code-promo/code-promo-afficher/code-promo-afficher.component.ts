import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { parseApiError } from '../../../core/http-error';
import { CodePromo } from '../../../models/code-promo.model';
import { CodePromoAdminService } from '../../../services/code-promo-admin.service';

@Component({
  selector: 'app-code-promo-afficher',
  templateUrl: './code-promo-afficher.component.html',
  styleUrl: './code-promo-afficher.component.scss',
})
export class CodePromoAfficherComponent implements OnInit {
  rows: CodePromo[] | null = null;
  loading = true;
  errorMessage: string | null = null;
  actionError: string | null = null;

  constructor(
    private readonly service: CodePromoAdminService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.service.getAll().subscribe({
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
    void this.router.navigate(['/codes-promo/nouveau']);
  }

  modifier(id: number): void {
    void this.router.navigate(['/codes-promo', id, 'edit']);
  }

  supprimer(row: CodePromo): void {
    this.actionError = null;
    const ok = confirm(`Supprimer le code « ${row.code} » ? Les commandes passées gardent l'historique du code utilisé.`);
    if (!ok) return;
    this.service.delete(row.id).subscribe({
      next: () => this.load(),
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }

  typeLabel(t: CodePromo['typeRemise']): string {
    return t === 'pourcentage' ? '%' : 'DH fixe';
  }
}
