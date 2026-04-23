import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SiteLanguageService } from '../../core/site-language.service';
import { AUTH_LABELS, AuthLabels, SiteLang } from '../../core/visitor-i18n';
import { UserAuthService } from '../../services/user-auth.service';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

@Component({
  selector: 'app-login-drawer',
  templateUrl: './login-drawer.component.html',
  styleUrls: ['./login-drawer.component.scss']
})
export class LoginDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();

  showPassword = false;
  submitted = false;
  isLoading = false;
  errorMessage = '';
  googleInfoMessage = '';
  loginForm: FormGroup;
  labels: AuthLabels = AUTH_LABELS['fr'];
  isRtl = false;

  private readonly destroy$ = new Subject<void>();
  private static googleSdkPromise: Promise<void> | null = null;
  private static facebookSdkPromise: Promise<void> | null = null;

  constructor(
    private fb: FormBuilder,
    private userAuthService: UserAuthService,
    private siteLang: SiteLanguageService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang: SiteLang) => {
      this.labels = AUTH_LABELS[lang];
      this.isRtl = lang === 'ar';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

 
  close(): void {
    this.resetFormState();
    this.closeDrawer.emit();
  }


  onSwitch(): void {
    this.switchToRegister.emit();
  }

  onGoogleLogin(): void {
    void this.startGoogleLogin();
  }

  onFacebookLogin(): void {
    void this.startFacebookLogin();
  }

  private async startGoogleLogin(): Promise<void> {
    this.googleInfoMessage = '';
    this.errorMessage = '';
    const clientId = (environment.googleClientId ?? '').trim();
    if (!clientId) {
      this.googleInfoMessage = 'Google OAuth non configuré (googleClientId manquant).';
      return;
    }

    try {
      await this.loadGoogleSdk();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          const idToken = String(resp?.credential ?? '').trim();
          if (!idToken) {
            this.errorMessage = 'Connexion Google échouée.';
            return;
          }
          this.isLoading = true;
          this.userAuthService.loginWithGoogle(idToken).subscribe({
            next: () => {
              this.isLoading = false;
              this.close();
            },
            error: (e) => {
              this.isLoading = false;
              this.errorMessage = e?.error?.message ?? "Connexion Google échouée.";
            },
          });
        },
      });
      window.google.accounts.id.prompt();
    } catch {
      this.errorMessage = "Impossible de charger Google. Réessaye plus tard.";
    }
  }

  private async startFacebookLogin(): Promise<void> {
    this.googleInfoMessage = '';
    this.errorMessage = '';
    const appId = (environment.facebookAppId ?? '').trim();
    if (!appId) {
      this.googleInfoMessage = 'Facebook OAuth non configuré (facebookAppId manquant).';
      return;
    }

    try {
      await this.loadFacebookSdk(appId);
      window.FB.login(
        (response: any) => {
          const accessToken = String(response?.authResponse?.accessToken ?? '').trim();
          if (!accessToken) {
            this.errorMessage = 'Connexion Facebook annulée.';
            return;
          }
          this.isLoading = true;
          this.userAuthService.loginWithFacebook(accessToken).subscribe({
            next: () => {
              this.isLoading = false;
              this.close();
            },
            error: (e) => {
              this.isLoading = false;
              this.errorMessage = e?.error?.message ?? "Connexion Facebook échouée.";
            },
          });
        },
        { scope: 'email,public_profile' },
      );
    } catch {
      this.errorMessage = "Impossible de charger Facebook. Réessaye plus tard.";
    }
  }

  private loadGoogleSdk(): Promise<void> {
    if (LoginDrawerComponent.googleSdkPromise) return LoginDrawerComponent.googleSdkPromise;
    LoginDrawerComponent.googleSdkPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('google sdk'));
      document.head.appendChild(script);
    });
    return LoginDrawerComponent.googleSdkPromise;
  }

  private loadFacebookSdk(appId: string): Promise<void> {
    if (LoginDrawerComponent.facebookSdkPromise) return LoginDrawerComponent.facebookSdkPromise;
    LoginDrawerComponent.facebookSdkPromise = new Promise<void>((resolve, reject) => {
      if (window.FB) {
        try {
          window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' });
          resolve();
        } catch {
          reject(new Error('fb init'));
        }
        return;
      }

      window.fbAsyncInit = () => {
        try {
          window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' });
          resolve();
        } catch {
          reject(new Error('fb init'));
        }
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // fbAsyncInit will resolve.
      };
      script.onerror = () => reject(new Error('facebook sdk'));
      document.head.appendChild(script);
    });
    return LoginDrawerComponent.facebookSdkPromise;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.googleInfoMessage = '';

    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading = true;
    this.userAuthService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.close();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message ?? 'Email ou mot de passe incorrect.';
      }
    });
  }

  private resetFormState(): void {
    this.submitted = false;
    this.isLoading = false;
    this.errorMessage = '';
    this.googleInfoMessage = '';
    this.showPassword = false;
    this.loginForm.reset();
  }
}
