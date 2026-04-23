import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitService } from '../../../services/produit.service';
import { Produit } from '../../../models/produit.model';
import { parseApiError } from '../../../core/http-error';
import { forkJoin } from 'rxjs';
import { CategorieService } from '../../../services/categorie.service';
import { CatalogueService } from '../../../services/catalogue.service';
import { TypeProduitService } from '../../../services/type-produit.service';
import { Categorie } from '../../../models/categorie.model';
import { Catalogue } from '../../../models/catalogue.model';
import { TypeProduit } from '../../../models/type-produit.model';

@Component({
  selector: 'app-produit-afficher',
  templateUrl: './produit-afficher.component.html',
  styleUrl: './produit-afficher.component.scss',
})
export class ProduitAfficherComponent implements OnInit {
  rows: Produit[] | null = null;
  displayedRows: Produit[] = [];
  loading = true;
  errorMessage: string | null = null;
  actionError: string | null = null;

  categories: Categorie[] = [];
  catalogues: Catalogue[] = [];
  filteredCatalogues: Catalogue[] = [];
  types: TypeProduit[] = [];

  filters = {
    categorieIds: [] as number[],
    catalogueIds: [] as number[],
    typeProduitId: null as number | null,
  };

  constructor(
    private produitService: ProduitService,
    private categorieService: CategorieService,
    private catalogueService: CatalogueService,
    private typeProduitService: TypeProduitService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      produits: this.produitService.getAll(),
      categories: this.categorieService.getAll(),
      catalogues: this.catalogueService.getAll(),
    }).subscribe({
      next: ({ produits, categories, catalogues }) => {
        this.rows = produits;
        this.categories = categories;
        this.catalogues = catalogues;
        this.filteredCatalogues = catalogues;
        this.types = [];
        this.applyFilters();
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loading = false;
      },
    });
  }

  private applyFilters(): void {
    const base = this.rows ?? [];
    this.displayedRows = base.filter((p) => {
      const matchCategorie =
        this.filters.categorieIds.length === 0 ||
        (p.categorieId != null && this.filters.categorieIds.includes(p.categorieId));
      const matchCatalogue =
        this.filters.catalogueIds.length === 0 ||
        (p.catalogueId != null && this.filters.catalogueIds.includes(p.catalogueId));
      const matchType =
        this.filters.typeProduitId == null ||
        (p.typeProduitId != null && p.typeProduitId === this.filters.typeProduitId);
      return matchCategorie && matchCatalogue && matchType;
    });
  }

  resetFilters(): void {
    this.filters = { categorieIds: [], catalogueIds: [], typeProduitId: null };
    this.filteredCatalogues = this.catalogues;
    this.types = [];
    this.applyFilters();
  }

  isCategorieSelected(id: number): boolean {
    return this.filters.categorieIds.includes(id);
  }

  isCatalogueSelected(id: number): boolean {
    return this.filters.catalogueIds.includes(id);
  }

  toggleCategorie(id: number): void {
    this.filters.categorieIds = this.filters.categorieIds.includes(id)
      ? this.filters.categorieIds.filter((x) => x !== id)
      : [...this.filters.categorieIds, id];

    this.filters.typeProduitId = null;
    this.types = [];

    this.filteredCatalogues =
      this.filters.categorieIds.length === 0
        ? this.catalogues
        : this.catalogues.filter((c) => this.filters.categorieIds.includes(c.categorieId));

    // Conserver les catalogues sélectionnés qui restent dans la liste filtrée
    const validIds = new Set(this.filteredCatalogues.map((c) => c.id));
    this.filters.catalogueIds = this.filters.catalogueIds.filter((cid) => validIds.has(cid));

    this.applyFilters();
  }

  toggleCatalogue(id: number): void {
    this.filters.catalogueIds = this.filters.catalogueIds.includes(id)
      ? this.filters.catalogueIds.filter((x) => x !== id)
      : [...this.filters.catalogueIds, id];

    this.filters.typeProduitId = null;
    this.types = [];
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  hasTailles(p: Produit): boolean {
    return this.getVolumeRows(p).length > 0;
  }

  tailleMinPrix(p: Produit): number {
    const rows = this.getVolumeRows(p);
    if (rows.length === 0) return p.prix ?? 0;
    return Math.min(...rows.map((v) => v.prix));
  }

  tailleMaxPrix(p: Produit): number {
    const rows = this.getVolumeRows(p);
    if (rows.length === 0) return p.prix ?? 0;
    return Math.max(...rows.map((v) => v.prix));
  }

  /** Vrai si les prix des tailles ne sont pas tous identiques (évite « 152 - 152 € »). */
  taillePricesDiffer(p: Produit): boolean {
    return Math.abs(this.tailleMinPrix(p) - this.tailleMaxPrix(p)) > 0.005;
  }

  totalStockForRow(p: Produit): number {
    const rows = this.getVolumeRows(p);
    if (rows.length === 0) return p.stock ?? 0;
    return rows.reduce((sum, v) => sum + v.stock, 0);
  }

  getVolumeRows(p: Produit): Array<{ tailleId: number; tailleLabel?: string | null; prix: number; stock: number }> {
    if (p.tailles && p.tailles.length > 0) return p.tailles;
    if (p.volumes && p.volumes.length > 0) {
      return p.volumes.map((v) => ({
        tailleId: v.volumeId,
        tailleLabel: v.volumeLabel,
        prix: v.prix,
        stock: v.stock,
      }));
    }
    return [];
  }

  ajouter(): void {
    void this.router.navigate(['/produits/nouveau']);
  }

  modifier(id: number): void {
    void this.router.navigate(['/produits', id, 'edit']);
  }

  supprimer(row: Produit): void {
    this.actionError = null;
    const ok = confirm(`Supprimer le produit « ${row.nom} » ? Les médias associés seront supprimés.`);
    if (!ok) return;
    this.produitService.delete(row.id).subscribe({
      next: () => this.load(),
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }


}