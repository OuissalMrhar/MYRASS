import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { parseApiError } from '../../../core/http-error';
import { CodePromoTypeRemise, CodePromoWrite } from '../../../models/code-promo.model';
import { CodePromoAdminService } from '../../../services/code-promo-admin.service';

@Component({
  selector: 'app-code-promo-form',
  templateUrl: './code-promo-form.component.html',
  styleUrl: './code-promo-form.component.scss',
})
export class CodePromoFormComponent implements OnInit {
  id: number | null = null;
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  readonly typeOptions: { value: CodePromoTypeRemise; label: string }[] = [
    { value: 'pourcentage', label: 'Pourcentage sur les articles' },
    { value: 'montantFixe', label: 'Montant fixe (DH)' },
  ];

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    description: [''],
    typeRemise: ['pourcentage' as CodePromoTypeRemise, Validators.required],
    valeur: [0, [Validators.required, Validators.min(0)]],
    actif: [true],
    dateDebutLocal: [''],
    dateFinLocal: [''],
    utilisationsMax: ['' as string | number],
    montantMinimumPanier: ['' as string | number],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CodePromoAdminService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.url.some((s) => s.path === 'nouveau')) {
      this.id = null;
      return;
    }
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsed = idParam ? parseInt(idParam, 10) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      void this.router.navigate(['/codes-promo']);
      return;
    }
    this.id = parsed;
    this.loading = true;
    this.service.getById(parsed).subscribe({
      next: (row) => {
        this.form.patchValue({
          code: row.code,
          description: row.description ?? '',
          typeRemise: row.typeRemise,
          valeur: row.valeur,
          actif: row.actif,
          dateDebutLocal: row.dateDebutUtc ? this.toDatetimeLocal(row.dateDebutUtc) : '',
          dateFinLocal: row.dateFinUtc ? this.toDatetimeLocal(row.dateFinUtc) : '',
          utilisationsMax: row.utilisationsMax ?? '',
          montantMinimumPanier: row.montantMinimumPanier ?? '',
        });
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
        this.loading = false;
      },
    });
  }

  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private parseOptionalUtc(local: string): string | null {
    const s = local?.trim();
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  private parseOptionalNumber(raw: string | number): number | null {
    if (raw === '' || raw === null) return null;
    const n = typeof raw === 'number' ? raw : parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }

  save(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const typeRemise = v.typeRemise as CodePromoTypeRemise;
    if (typeRemise === 'pourcentage' && (v.valeur! > 100 || v.valeur! < 0)) {
      this.errorMessage = 'Pour un pourcentage, la valeur doit être entre 0 et 100.';
      return;
    }

    const body: CodePromoWrite = {
      code: v.code!.trim(),
      description: v.description?.trim() || null,
      typeRemise,
      valeur: v.valeur!,
      actif: !!v.actif,
      dateDebutUtc: this.parseOptionalUtc(v.dateDebutLocal ?? ''),
      dateFinUtc: this.parseOptionalUtc(v.dateFinLocal ?? ''),
      utilisationsMax: this.parseOptionalNumber(v.utilisationsMax ?? ''),
      montantMinimumPanier: this.parseOptionalNumber(v.montantMinimumPanier ?? ''),
    };

    if (
      body.dateDebutUtc &&
      body.dateFinUtc &&
      new Date(body.dateFinUtc) < new Date(body.dateDebutUtc)
    ) {
      this.errorMessage = 'La date de fin doit être après la date de début.';
      return;
    }

    this.saving = true;
    if (this.id == null) {
      this.service.create(body).subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/codes-promo']);
        },
        error: (e) => {
          this.saving = false;
          this.errorMessage = parseApiError(e);
        },
      });
    } else {
      this.service.update(this.id, body).subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/codes-promo']);
        },
        error: (e) => {
          this.saving = false;
          this.errorMessage = parseApiError(e);
        },
      });
    }
  }

  annuler(): void {
    void this.router.navigate(['/codes-promo']);
  }
}
