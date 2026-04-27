import { Component, OnInit } from '@angular/core';
import { CommandeResponseDto, OrdersApiService } from '../../../services/orders-api.service';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-commandes-afficher',
  templateUrl: './commandes-afficher.component.html',
  styleUrl: './commandes-afficher.component.scss',
})
export class CommandesAfficherComponent implements OnInit {
  commandes: CommandeResponseDto[] = [];
  filtered: CommandeResponseDto[] = [];
  loading = true;
  error: string | null = null;
  successMsg: string | null = null;

  searchTerm = '';
  statutFilter = '';
  expandedId: number | null = null;
  updatingId: number | null = null;

  readonly statuts = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];

  private successTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: OrdersApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.getAllAdmin().subscribe({
      next: (data) => {
        this.commandes = (data ?? []).sort(
          (a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime(),
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (e) => {
        this.error = parseApiError(e);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();
    this.filtered = this.commandes.filter((c) => {
      const matchSearch =
        !q ||
        String(c.id).includes(q) ||
        String(c.userId).includes(q) ||
        c.statut.toLowerCase().includes(q);
      const matchStatut = !this.statutFilter || c.statut === this.statutFilter;
      return matchSearch && matchStatut;
    });
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  setStatut(commande: CommandeResponseDto, statut: string): void {
    this.updatingId = commande.id;
    this.api.updateStatut(commande.id, statut).subscribe({
      next: (updated) => {
        const i = this.commandes.findIndex((c) => c.id === commande.id);
        if (i !== -1) this.commandes[i] = updated;
        this.applyFilters();
        this.updatingId = null;
        this.flash('Statut mis à jour.');
      },
      error: (e) => {
        this.updatingId = null;
        this.error = parseApiError(e);
      },
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      expediee: 'Expédiée',
      livree: 'Livrée',
      annulee: 'Annulée',
    };
    return map[s] ?? s;
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'badge--pending',
      confirmee: 'badge--confirmed',
      expediee: 'badge--shipped',
      livree: 'badge--delivered',
      annulee: 'badge--cancelled',
    };
    return map[s] ?? '';
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => (this.successMsg = null), 3000);
  }
}
