import { Component } from '@angular/core';
import { AdminAuthService } from '../admin-auth.service';
import { AdminRegisterRequest } from '../../../models/admin-auth.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrl: './admin-register.component.scss',
})
export class AdminRegisterComponent {
  form: AdminRegisterRequest = {
    prenom: '',
    nom: '',
    email: '',
    password: '',
  };

  error: string | null = null;
  success: string | null = null;
  loading = false;

  constructor(private auth: AdminAuthService) {}

  register(): void {
    this.error = null;
    this.success = null;

    if (!this.form.prenom.trim()) {
      this.error = 'Prénom requis';
      return;
    }
    if (!this.form.nom.trim()) {
      this.error = 'Nom requis';
      return;
    }
    if (!this.form.email.trim()) {
      this.error = 'Email requis';
      return;
    }
    if (!this.form.password || this.form.password.length < 6) {
      this.error = 'Mot de passe (min. 6 caractères) requis';
      return;
    }

    this.loading = true;
    this.auth.registerRequest(this.form).subscribe({
      next: (resp) => {
        this.loading = false;
        this.success = resp?.message ?? 'Demande envoyée. Un super-admin doit approuver votre compte.';
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
        this.error = parseApiError(e);
      },
    });
  }
}
