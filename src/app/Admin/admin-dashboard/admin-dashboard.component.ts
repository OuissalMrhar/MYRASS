import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdminDashboardApiService } from '../../services/admin-dashboard-api.service';
import { parseApiError } from '../../core/http-error';
import {
  AdminCreateBySuper,
  AdminRegistrationPending,
  AdminSessionOverview,
  AdminUpdateBySuper,
} from '../../models/admin-auth.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  overview: AdminSessionOverview[] = [];
  pending: AdminRegistrationPending[] = [];
  loading = true;
  error: string | null = null;
  actionError: string | null = null;
  successMsg: string | null = null;
  private successTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Formulaire de création ---
  createForm: AdminCreateBySuper = { prenom: '', nom: '', email: '', password: '', roleId: 2 };
  creating = false;

  // --- Formulaire d'édition inline ---
  editRow: AdminSessionOverview | null = null;
  editForm: AdminUpdateBySuper = { prenom: '', nom: '', email: '', password: null, roleId: 2 };
  saving = false;

  // --- Confirmation suppression inline ---
  confirmDeleteId: number | null = null;
  deleting = false;

  constructor(private api: AdminDashboardApiService) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  reload(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      overview: this.api.sessionsOverview(),
      pending: this.api.pendingRegistrations(),
    }).subscribe({
      next: ({ overview, pending }) => {
        this.overview = overview;
        this.pending = pending;
        this.loading = false;
      },
      error: (e) => {
        this.error = parseApiError(e);
        this.loading = false;
      },
    });
  }

  // --- Demandes d'inscription ---
  approve(id: number): void {
    this.actionError = null;
    this.api.approveRegistration(id).subscribe({
      next: () => { this.showSuccess('Demande approuvée.'); this.reload(); },
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }

  reject(id: number): void {
    this.actionError = null;
    this.api.rejectRegistration(id).subscribe({
      next: () => { this.showSuccess('Demande refusée.'); this.reload(); },
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }

  // --- Création ---
  createAdmin(): void {
    this.actionError = null;
    if (
      !this.createForm.prenom.trim() ||
      !this.createForm.nom.trim() ||
      !this.createForm.email.trim() ||
      !this.createForm.password
    ) {
      this.actionError = 'Tous les champs sont requis.';
      return;
    }
    this.creating = true;
    this.api.createAdmin(this.createForm).subscribe({
      next: () => {
        this.creating = false;
        this.createForm = { prenom: '', nom: '', email: '', password: '', roleId: 2 };
        this.showSuccess('Administrateur créé avec succès.');
        this.reload();
      },
      error: (e) => {
        this.creating = false;
        this.actionError = parseApiError(e);
      },
    });
  }

  // --- Édition inline ---
  openEdit(row: AdminSessionOverview): void {
    this.confirmDeleteId = null;
    this.actionError = null;
    this.editRow = row;
    this.editForm = {
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      password: null,
      roleId: row.roleId,
    };
  }

  cancelEdit(): void {
    this.editRow = null;
    this.actionError = null;
  }

  saveEdit(): void {
    if (!this.editRow) return;
    this.actionError = null;

    if (!this.editForm.prenom.trim() || !this.editForm.nom.trim() || !this.editForm.email.trim()) {
      this.actionError = 'Prénom, nom et email sont requis.';
      return;
    }
    if (this.editForm.password !== null && this.editForm.password !== '' && this.editForm.password.length < 8) {
      this.actionError = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (![1, 2].includes(this.editForm.roleId)) {
      this.actionError = 'Rôle invalide (1 ou 2).';
      return;
    }

    const body: AdminUpdateBySuper = {
      ...this.editForm,
      password: this.editForm.password?.trim() || null,
    };

    this.saving = true;
    this.api.updateAdmin(this.editRow.adminId, body).subscribe({
      next: () => {
        this.saving = false;
        this.editRow = null;
        this.showSuccess('Administrateur mis à jour.');
        this.reload();
      },
      error: (e) => {
        this.saving = false;
        this.actionError = parseApiError(e);
      },
    });
  }

  // --- Suppression inline ---
  askDelete(id: number): void {
    this.editRow = null;
    this.actionError = null;
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(): void {
    if (this.confirmDeleteId == null) return;
    const id = this.confirmDeleteId;
    this.deleting = true;
    this.api.deleteAdmin(id).subscribe({
      next: () => {
        this.deleting = false;
        this.confirmDeleteId = null;
        this.showSuccess('Administrateur supprimé.');
        this.reload();
      },
      error: (e) => {
        this.deleting = false;
        this.actionError = parseApiError(e);
        this.confirmDeleteId = null;
      },
    });
  }

  // --- PDF ---
  downloadPdf(): void {
    this.actionError = null;
    this.api.downloadConnectionsPdf().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-connexions-${new Date().toISOString().slice(0, 16)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (e) => (this.actionError = parseApiError(e)),
    });
  }

  // --- Helpers ---
  formatUtc(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', { timeZone: 'UTC' }) + ' UTC';
    } catch {
      return iso;
    }
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => (this.successMsg = null), 3500);
  }
}
