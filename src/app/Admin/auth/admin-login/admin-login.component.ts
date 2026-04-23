import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';
import { AdminLoginRequest } from '../../../models/admin-auth.model';
import { parseApiError } from '../../../core/http-error';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  form: AdminLoginRequest = { email: '', password: '' };
  error: string | null = null;
  loading = false;

  constructor(
    private auth: AdminAuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  login(): void {
    this.error = null;

    if (!this.form.email.trim() || !this.form.password) {
      this.error = 'Email et mot de passe requis';
      return;
    }

    this.loading = true;
    this.auth.login(this.form).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          void this.router.navigateByUrl(returnUrl);
        } else if (this.auth.isSuperAdmin()) {
          void this.router.navigate(['/dashboard']);
        } else {
          void this.router.navigate(['/accueil']);
        }
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
        this.error = parseApiError(e);
      },
    });
  }
}
