import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../core/api-url';
import { parseApiError } from '../../core/http-error';
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

export interface Country {
  code: string;
  flag: string;
  dial: string;
  name: string;
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('motDePasse')?.value;
  const cpw = group.get('confirmMotDePasse')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register-drawer',
  templateUrl: './register-drawer.component.html',
  styleUrls: ['./register-drawer.component.scss']
})
export class RegisterDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closeDrawer = new EventEmitter<void>();

  @ViewChild('dayInput') dayInput!: ElementRef<HTMLInputElement>;
  @ViewChild('monthInput') monthInput!: ElementRef<HTMLInputElement>;
  @ViewChild('yearInput') yearInput!: ElementRef<HTMLInputElement>;

  userForm!: FormGroup;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  showConfirm = false;
  selectedFlag = '🇫🇷';
  labels: AuthLabels = AUTH_LABELS['fr'];
  isRtl = false;

  private readonly destroy$ = new Subject<void>();
  genres: any[] = [];
  private static googleSdkPromise: Promise<void> | null = null;
  private static facebookSdkPromise: Promise<void> | null = null;

  countries: Country[] = [
    { code: 'FR', flag: '🇫🇷', dial: '+33', name: 'France' },
    { code: 'MA', flag: '🇲🇦', dial: '+212', name: 'Maroc' },
    { code: 'BE', flag: '🇧🇪', dial: '+32', name: 'Belgique' },
    { code: 'CH', flag: '🇨🇭', dial: '+41', name: 'Suisse' },
    { code: 'DZ', flag: '🇩🇿', dial: '+213', name: 'Algérie' },
    { code: 'TN', flag: '🇹🇳', dial: '+216', name: 'Tunisie' },
    { code: 'SN', flag: '🇸🇳', dial: '+221', name: 'Sénégal' },
    { code: 'CI', flag: '🇨🇮', dial: '+225', name: "Côte d'Ivoire" },
    { code: 'CM', flag: '🇨🇲', dial: '+237', name: 'Cameroun' },
    { code: 'GB', flag: '🇬🇧', dial: '+44', name: 'Royaume-Uni' },
    { code: 'DE', flag: '🇩🇪', dial: '+49', name: 'Allemagne' },
    { code: 'ES', flag: '🇪🇸', dial: '+34', name: 'Espagne' },
    { code: 'IT', flag: '🇮🇹', dial: '+39', name: 'Italie' },
    { code: 'PT', flag: '🇵🇹', dial: '+351', name: 'Portugal' },
    { code: 'NL', flag: '🇳🇱', dial: '+31', name: 'Pays-Bas' },
    { code: 'SE', flag: '🇸🇪', dial: '+46', name: 'Suède' },
    { code: 'NO', flag: '🇳🇴', dial: '+47', name: 'Norvège' },
    { code: 'DK', flag: '🇩🇰', dial: '+45', name: 'Danemark' },
    { code: 'PL', flag: '🇵🇱', dial: '+48', name: 'Pologne' },
    { code: 'RU', flag: '🇷🇺', dial: '+7', name: 'Russie' },
    { code: 'US', flag: '🇺🇸', dial: '+1', name: 'États-Unis' },
    { code: 'CA', flag: '🇨🇦', dial: '+1', name: 'Canada' },
    { code: 'MX', flag: '🇲🇽', dial: '+52', name: 'Mexique' },
    { code: 'BR', flag: '🇧🇷', dial: '+55', name: 'Brésil' },
    { code: 'AR', flag: '🇦🇷', dial: '+54', name: 'Argentine' },
    { code: 'AE', flag: '🇦🇪', dial: '+971', name: 'Émirats arabes unis' },
    { code: 'SA', flag: '🇸🇦', dial: '+966', name: 'Arabie saoudite' },
    { code: 'QA', flag: '🇶🇦', dial: '+974', name: 'Qatar' },
    { code: 'EG', flag: '🇪🇬', dial: '+20', name: 'Égypte' },
    { code: 'LB', flag: '🇱🇧', dial: '+961', name: 'Liban' },
    { code: 'TR', flag: '🇹🇷', dial: '+90', name: 'Turquie' },
    { code: 'IN', flag: '🇮🇳', dial: '+91', name: 'Inde' },
    { code: 'CN', flag: '🇨🇳', dial: '+86', name: 'Chine' },
    { code: 'JP', flag: '🇯🇵', dial: '+81', name: 'Japon' },
    { code: 'KR', flag: '🇰🇷', dial: '+82', name: 'Corée du Sud' },
    { code: 'AU', flag: '🇦🇺', dial: '+61', name: 'Australie' },
    { code: 'NZ', flag: '🇳🇿', dial: '+64', name: 'Nouvelle-Zélande' },
    { code: 'ZA', flag: '🇿🇦', dial: '+27', name: 'Afrique du Sud' },
    { code: 'NG', flag: '🇳🇬', dial: '+234', name: 'Nigeria' },
    { code: 'KE', flag: '🇰🇪', dial: '+254', name: 'Kenya' },
    { code: 'GH', flag: '🇬🇭', dial: '+233', name: 'Ghana' },
    { code: 'CL', flag: '🇨🇱', dial: '+56', name: 'Chili' },
    { code: 'CO', flag: '🇨🇴', dial: '+57', name: 'Colombie' },
    { code: 'IL', flag: '🇮🇱', dial: '+972', name: 'Israël' },
    { code: 'PK', flag: '🇵🇰', dial: '+92', name: 'Pakistan' },
    { code: 'BD', flag: '🇧🇩', dial: '+880', name: 'Bangladesh' },
    { code: 'SG', flag: '🇸🇬', dial: '+65', name: 'Singapour' },
    { code: 'MY', flag: '🇲🇾', dial: '+60', name: 'Malaisie' },
    { code: 'TH', flag: '🇹🇭', dial: '+66', name: 'Thaïlande' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private userAuthService: UserAuthService,
    private siteLang: SiteLanguageService,
  ) {}

  ngOnInit(): void {
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang: SiteLang) => {
      this.labels = AUTH_LABELS[lang];
      this.isRtl = lang === 'ar';
    });

    this.userForm = this.formBuilder.group({
      title: ['', Validators.required],
      nomComplet: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmMotDePasse: ['', Validators.required],
      phonePrefix: ['+33'],
      telephone: ['', Validators.required],
      dateDay: [''],
      dateMonth: [''],
      dateYear: [''],
      dateNaissance: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    this.loadGenres();
  }

  loadGenres(): void {
    this.http.get<any[]>(apiUrl('/api/genres')).subscribe({
      next: (data) => { this.genres = data; },
      error: () => {
        this.genres = [
          { id: 1, nom: 'M.' },
          { id: 2, nom: 'Mme' },
          { id: 3, nom: 'Mx' },
          { id: 4, nom: 'Dr' },
        ];
      }
    });
  }

  get f() { return this.userForm.controls; }

  onDateInput(event: Event, field: 'day' | 'month' | 'year'): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');

    const maxLen = field === 'year' ? 4 : 2;

    if (input.value.length >= maxLen) {
      const padded = field === 'year'
        ? input.value.slice(0, 4)
        : input.value.slice(0, 2).padStart(2, '0');
      input.value = padded;

      const ctrl = field === 'day' ? 'dateDay' : field === 'month' ? 'dateMonth' : 'dateYear';
      this.userForm.patchValue({ [ctrl]: padded });

      if (field === 'day') { this.monthInput.nativeElement.focus(); this.monthInput.nativeElement.select(); }
      if (field === 'month') { this.yearInput.nativeElement.focus(); this.yearInput.nativeElement.select(); }

      this.buildDateNaissance();
    } else {
      const ctrl = field === 'day' ? 'dateDay' : field === 'month' ? 'dateMonth' : 'dateYear';
      this.userForm.patchValue({ [ctrl]: input.value });
    }
  }

  private buildDateNaissance(): void {
    const d = String(this.userForm.get('dateDay')?.value || '');
    const m = String(this.userForm.get('dateMonth')?.value || '');
    const y = String(this.userForm.get('dateYear')?.value || '');
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      this.userForm.patchValue({ dateNaissance: `${y}-${m}-${d}` });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
    this.closeDrawer.emit();
    this.submitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.showPassword = false;
    this.showConfirm = false;
    this.selectedFlag = '🇫🇷';
    this.userForm.reset({ phonePrefix: '+33' });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.userForm.invalid) return;

    const rawPhone = `${this.userForm.value.phonePrefix ?? ''}${String(this.userForm.value.telephone ?? '').replace(/\s/g, '')}`;
    const genreId = parseInt(String(this.userForm.value.title), 10);
    if (!Number.isFinite(genreId) || genreId < 1) {
      this.errorMessage = 'Veuillez choisir un genre.';
      return;
    }

    const userData = {
      nomComplet: String(this.userForm.value.nomComplet ?? '').trim(),
      email: String(this.userForm.value.email ?? '').trim(),
      motDePasse: this.userForm.value.motDePasse,
      telephone: rawPhone,
      genreId,
      dateNaissance: this.userForm.value.dateNaissance,
    };

    this.userAuthService.register(userData).subscribe({
      next: () => {
        this.successMessage = "Compte créé avec succès ! Un code d'activation a été envoyé à votre email.";
        setTimeout(() => this.close(), 3000);
      },
      error: (e) => {
        this.errorMessage = parseApiError(e);
      },
    });
  }

  onGoogleRegister(): void {
    void this.startGoogleSignup();
  }

  onFacebookRegister(): void {
    void this.startFacebookSignup();
  }

  private async startGoogleSignup(): Promise<void> {
    this.errorMessage = '';
    const clientId = (environment.googleClientId ?? '').trim();
    if (!clientId) {
      this.errorMessage = 'Google OAuth non configuré (googleClientId manquant).';
      return;
    }

    try {
      await this.loadGoogleSdk();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => {
          const idToken = String(resp?.credential ?? '').trim();
          if (!idToken) {
            this.errorMessage = 'Inscription Google échouée.';
            return;
          }
          this.userAuthService.loginWithGoogle(idToken).subscribe({
            next: () => this.close(),
            error: (e) => {
              this.errorMessage = parseApiError(e);
            },
          });
        },
      });
      window.google.accounts.id.prompt();
    } catch {
      this.errorMessage = "Impossible de charger Google. Réessaye plus tard.";
    }
  }

  private async startFacebookSignup(): Promise<void> {
    this.errorMessage = '';
    const appId = (environment.facebookAppId ?? '').trim();
    if (!appId) {
      this.errorMessage = 'Facebook OAuth non configuré (facebookAppId manquant).';
      return;
    }

    try {
      await this.loadFacebookSdk(appId);
      window.FB.login(
        (response: any) => {
          const accessToken = String(response?.authResponse?.accessToken ?? '').trim();
          if (!accessToken) {
            this.errorMessage = 'Inscription Facebook annulée.';
            return;
          }
          this.userAuthService.loginWithFacebook(accessToken).subscribe({
            next: () => this.close(),
            error: (e) => {
              this.errorMessage = parseApiError(e);
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
    if (RegisterDrawerComponent.googleSdkPromise) return RegisterDrawerComponent.googleSdkPromise;
    RegisterDrawerComponent.googleSdkPromise = new Promise<void>((resolve, reject) => {
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
    return RegisterDrawerComponent.googleSdkPromise;
  }

  private loadFacebookSdk(appId: string): Promise<void> {
    if (RegisterDrawerComponent.facebookSdkPromise) return RegisterDrawerComponent.facebookSdkPromise;
    RegisterDrawerComponent.facebookSdkPromise = new Promise<void>((resolve, reject) => {
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
    return RegisterDrawerComponent.facebookSdkPromise;
  }

}
