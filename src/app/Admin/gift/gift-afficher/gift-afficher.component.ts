import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { parseApiError } from '../../../core/http-error';
import { Gift } from '../../../models/gift.model';
import { GiftService } from '../../../services/gift.service';

@Component({
  selector: 'app-gift-afficher',
  templateUrl: './gift-afficher.component.html',
  styleUrl: './gift-afficher.component.scss',
})
export class GiftAfficherComponent implements OnInit {
  rows: Gift[] | null = null;
  loading = true;
  errorMessage: string | null = null;
  actionError: string | null = null;

  constructor(
    private giftService: GiftService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.giftService.getAll().subscribe({
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
    void this.router.navigate(['/gifts/nouveau']);
  }

  modifier(id: number): void {
    void this.router.navigate(['/gifts', id, 'edit']);
  }

  supprimer(row: Gift): void {
    this.actionError = null;
    const ok = confirm(`Supprimer le pack « ${row.nom} » ? Cette action est irréversible.`);
    if (!ok) return;
    this.giftService.delete(row.id).subscribe({
      next: () => this.load(),
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }
}

