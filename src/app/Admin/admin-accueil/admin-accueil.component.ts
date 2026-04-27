import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminAuthService } from '../auth/admin-auth.service';
import { ProduitService } from '../../services/produit.service';
import { OrdersApiService, CommandeResponseDto } from '../../services/orders-api.service';
import { GiftService } from '../../services/gift.service';

@Component({
  selector: 'app-admin-accueil',
  templateUrl: './admin-accueil.component.html',
  styleUrl: './admin-accueil.component.scss',
})
export class AdminAccueilComponent implements OnInit {
  greeting = '';

  statsLoading = true;
  totalProduits = 0;
  totalCommandes = 0;
  totalGifts = 0;
  chiffreAffaires = 0;
  recentCommandes: CommandeResponseDto[] = [];

  constructor(
    private auth: AdminAuthService,
    private produitService: ProduitService,
    private ordersApi: OrdersApiService,
    private giftService: GiftService,
  ) {
    const h = new Date().getHours();
    this.greeting = h >= 5 && h < 18 ? 'Bonjour' : 'Bonsoir';
  }

  ngOnInit(): void {
    forkJoin({
      produits: this.produitService.getAll().pipe(catchError(() => of([]))),
      commandes: this.ordersApi.getAllAdmin().pipe(catchError(() => of([]))),
      gifts: this.giftService.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ produits, commandes, gifts }) => {
      this.totalProduits = produits.length;
      this.totalGifts = gifts.length;
      const cmds = commandes as CommandeResponseDto[];
      this.totalCommandes = cmds.length;
      this.chiffreAffaires = cmds
        .filter((c) => c.statut !== 'annulee')
        .reduce((sum, c) => sum + (c.totalCommande ?? 0), 0);
      this.recentCommandes = [...cmds]
        .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
        .slice(0, 5);
      this.statsLoading = false;
    });
  }

  displayName(): string {
    return this.auth.getDisplayName();
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  statutClass(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'st--pending', confirmee: 'st--confirmed',
      expediee: 'st--shipped', livree: 'st--delivered', annulee: 'st--cancelled',
    };
    return map[s] ?? '';
  }

  statutLabel(s: string): string {
    const map: Record<string, string> = {
      en_attente: 'En attente', confirmee: 'Confirmée',
      expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
    };
    return map[s] ?? s;
  }
}
