import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { parseApiError } from '../../../core/http-error';
import { Taille } from '../../../models/taille.model';
import { TailleService } from '../../../services/taille.service';

@Component({
  selector: 'app-volume-afficher',
  templateUrl: './volume-afficher.component.html',
  styleUrl: './volume-afficher.component.scss',
})
export class VolumeAfficherComponent implements OnInit {
  rows: Taille[] | null = null;
  loading = true;
  errorMessage: string | null = null;
  actionError: string | null = null;

  constructor(
    private tailleService: TailleService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.tailleService.getAll().subscribe({
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
    void this.router.navigate(['/tailles/nouveau']);
  }

  modifier(id: number): void {
    void this.router.navigate(['/tailles', id, 'edit']);
  }

  supprimer(row: Taille): void {
    this.actionError = null;
    const ok = confirm(
      `Supprimer la taille « ${row.label} » ? Les produits qui l'utilisent ne pourront plus être mis à jour tant qu'ils référencent cette taille.`,
    );
    if (!ok) return;
    this.tailleService.delete(row.id).subscribe({
      next: () => this.load(),
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }
}