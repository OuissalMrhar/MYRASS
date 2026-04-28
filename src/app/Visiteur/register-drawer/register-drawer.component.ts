import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang } from '../../core/visitor-i18n';
import { UserAuthService } from '../../services/user-auth.service';
import { parseApiError } from '../../core/http-error';
import { apiUrl } from '../../core/api-url';

type Step = 1 | 2 | 3;
type Method = 'email' | 'phone';

@Component({
  selector: 'app-register-drawer',
  templateUrl: './register-drawer.component.html',
  styleUrls: ['./register-drawer.component.scss'],
})
export class RegisterDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closeDrawer = new EventEmitter<void>();

  step: Step = 1;
  method: Method = 'email';
  lang: SiteLang = 'fr';
  isRtl = false;

  // Step 1
  emailValue = '';
  phoneValue = '';
  sendingCode = false;
  step1Error = '';

  // Step 2 — OTP (Twilio vérifie côté backend)
  otpCode = '';
  otpError = '';
  otpVerifying = false;
  otpVerified = false;
  resendCooldown = 0;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;
  readonly OTP_TTL = 300;
  otpSecondsLeft = this.OTP_TTL;
  private otpTimer: ReturnType<typeof setInterval> | null = null;

  // Step 3 — Password
  password = '';
  confirm = '';
  showPw = false;
  showConfirm = false;
  submitting = false;
  step3Error = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private auth: UserAuthService,
    private http: HttpClient,
    private router: Router,
    private siteLang: SiteLanguageService,
  ) {}

  ngOnInit(): void {
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((l) => {
      this.lang = l;
      this.isRtl = l === 'ar';
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get inputValue(): string {
    return this.method === 'email' ? this.emailValue : this.phoneValue;
  }

  get otpMinSec(): string {
    const m = Math.floor(this.otpSecondsLeft / 60);
    const s = this.otpSecondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get pwConditions(): { label: string; ok: boolean }[] {
    return [
      { label: this.l('pwMin'),    ok: this.password.length >= 8 },
      { label: this.l('pwUpper'),  ok: /[A-Z]/.test(this.password) },
      { label: this.l('pwNumber'), ok: /[0-9]/.test(this.password) },
    ];
  }

  get pwValid(): boolean {
    return this.pwConditions.every((c) => c.ok) && this.password === this.confirm && this.confirm.length > 0;
  }

  setMethod(m: Method): void { this.method = m; this.step1Error = ''; }

  // ── Étape 1 : envoyer le code via backend (Twilio) ──────────────
  sendCode(): void {
    const value = this.inputValue.trim();
    if (!value) { this.step1Error = this.l('fieldRequired'); return; }
    if (this.method === 'email' && !this.validEmail(value)) { this.step1Error = this.l('emailInvalid'); return; }
    if (this.method === 'phone' && value.length < 6) { this.step1Error = this.l('phoneInvalid'); return; }

    this.step1Error = '';
    this.sendingCode = true;

    this.http.post<{ message: string }>(apiUrl('/api/users/request-otp'), {
      method: this.method,
      value,
    }).subscribe({
      next: () => {
        this.sendingCode = false;
        this.step = 2;
        this.otpSecondsLeft = this.OTP_TTL;
        this.startOtpTimer();
        this.startResendCooldown();
      },
      error: (e) => {
        this.sendingCode = false;
        this.step1Error = parseApiError(e);
      },
    });
  }

  // ── Étape 2 : vérifier le code via backend (Twilio) ─────────────
  verifyOtp(): void {
    if (this.otpCode.trim().length < 4) { this.otpError = this.l('otpRequired'); return; }
    this.otpError = '';
    this.otpVerifying = true;

    this.http.post<{ message: string }>(apiUrl('/api/users/verify-otp'), {
      method: this.method,
      value:  this.inputValue.trim(),
      code:   this.otpCode.trim(),
    }).subscribe({
      next: () => {
        this.otpVerifying = false;
        this.otpVerified = true;
        this.step = 3;
        this.clearTimer('otp');
      },
      error: (e) => {
        this.otpVerifying = false;
        this.otpError = parseApiError(e);
      },
    });
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;
    this.otpCode = '';
    this.otpError = '';

    this.http.post<{ message: string }>(apiUrl('/api/users/request-otp'), {
      method: this.method,
      value:  this.inputValue.trim(),
    }).subscribe({
      next: () => {
        this.otpSecondsLeft = this.OTP_TTL;
        this.startOtpTimer();
        this.startResendCooldown();
      },
      error: (e) => { this.otpError = parseApiError(e); },
    });
  }

  // ── Étape 3 : inscription ────────────────────────────────────────
  register(): void {
    if (!this.pwValid) { this.step3Error = this.l('pwInvalid'); return; }
    this.step3Error = '';
    this.submitting = true;

    const payload: Record<string, unknown> = { motDePasse: this.password };
    if (this.method === 'email') payload['email'] = this.inputValue.trim();
    else payload['telephone'] = this.inputValue.trim();

    this.http.post<{ accessToken?: string; id: number; email: string; telephone?: string }>(
      apiUrl('/api/users'), payload
    ).subscribe({
      next: () => {
        const loginObs = this.method === 'email'
          ? this.auth.login({ email: this.inputValue.trim(), motDePasse: this.password })
          : this.auth.loginWithPhone({ telephone: this.inputValue.trim(), motDePasse: this.password });

        loginObs.subscribe({
          next: () => { this.submitting = false; this.close(); this.router.navigate(['/home']); },
          error: () => { this.submitting = false; this.close(); this.router.navigate(['/home']); },
        });
      },
      error: (e) => {
        this.submitting = false;
        this.step3Error = parseApiError(e);
      },
    });
  }

  close(): void {
    this.reset();
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.closeDrawer.emit();
  }

  private reset(): void {
    this.step = 1; this.method = 'email';
    this.emailValue = ''; this.phoneValue = '';
    this.otpCode = ''; this.password = ''; this.confirm = '';
    this.step1Error = ''; this.otpError = ''; this.step3Error = '';
    this.sendingCode = false; this.otpVerifying = false; this.submitting = false;
    this.otpVerified = false;
    this.showPw = false; this.showConfirm = false;
    this.clearTimers();
    this.otpSecondsLeft = this.OTP_TTL; this.resendCooldown = 0;
  }

  private startOtpTimer(): void {
    this.clearTimer('otp');
    this.otpTimer = setInterval(() => {
      this.otpSecondsLeft = Math.max(0, this.otpSecondsLeft - 1);
      if (this.otpSecondsLeft === 0) this.clearTimer('otp');
    }, 1000);
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    this.clearTimer('cooldown');
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown = Math.max(0, this.resendCooldown - 1);
      if (this.resendCooldown === 0) this.clearTimer('cooldown');
    }, 1000);
  }

  private clearTimer(w: 'otp' | 'cooldown'): void {
    if (w === 'otp' && this.otpTimer)           { clearInterval(this.otpTimer); this.otpTimer = null; }
    if (w === 'cooldown' && this.cooldownTimer) { clearInterval(this.cooldownTimer); this.cooldownTimer = null; }
  }

  private clearTimers(): void { this.clearTimer('otp'); this.clearTimer('cooldown'); }

  private validEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  l(key: string): string {
    const map: Record<string, Record<SiteLang, string>> = {
      fieldRequired:  { fr: 'Ce champ est requis.',               en: 'This field is required.',          ar: 'هذا الحقل مطلوب.' },
      emailInvalid:   { fr: 'Adresse email invalide.',             en: 'Invalid email address.',           ar: 'بريد إلكتروني غير صالح.' },
      phoneInvalid:   { fr: 'Numéro invalide (min. 6 chiffres).', en: 'Invalid phone number.',            ar: 'رقم غير صالح.' },
      otpRequired:    { fr: 'Saisissez le code reçu.',            en: 'Enter the code you received.',     ar: 'أدخل الرمز الذي تلقيته.' },
      otpWrong:       { fr: 'Code incorrect.',                     en: 'Incorrect code.',                  ar: 'الرمز غير صحيح.' },
      otpExpired:     { fr: 'Code expiré.',                        en: 'Code expired.',                    ar: 'انتهت صلاحية الرمز.' },
      otpExpiredMsg:  { fr: 'Code expiré. Demandez un nouveau code.', en: 'Code expired. Request a new code.', ar: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.' },
      pwMin:          { fr: 'Au moins 8 caractères',              en: 'At least 8 characters',            ar: '8 أحرف على الأقل' },
      pwUpper:        { fr: 'Au moins 1 lettre majuscule',        en: 'At least 1 uppercase letter',      ar: 'حرف كبير على الأقل' },
      pwNumber:       { fr: 'Au moins 1 chiffre',                 en: 'At least 1 number',                ar: 'رقم واحد على الأقل' },
      pwInvalid:      { fr: 'Vérifiez les conditions.',           en: 'Check the requirements.',          ar: 'تحقق من الشروط.' },
      sendCode:       { fr: 'Envoyer le code',                    en: 'Send code',                        ar: 'إرسال الرمز' },
      sending:        { fr: 'Envoi…',                             en: 'Sending…',                         ar: 'جارٍ الإرسال…' },
      resend:         { fr: 'Renvoyer le code',                   en: 'Resend code',                      ar: 'إعادة إرسال الرمز' },
      verify:         { fr: 'Continuer',                          en: 'Continue',                         ar: 'متابعة' },
      createAccount:  { fr: 'Créer mon compte',                   en: 'Create account',                   ar: 'إنشاء حساب' },
      creating:       { fr: 'Création…',                          en: 'Creating…',                        ar: 'جارٍ الإنشاء…' },
      step1Title:     { fr: 'Créer un compte',                    en: 'Create an account',                ar: 'إنشاء حساب' },
      step2Title:     { fr: 'Vérification',                       en: 'Verification',                     ar: 'التحقق' },
      step3Title:     { fr: 'Choisissez un mot de passe',         en: 'Choose a password',                ar: 'اختر كلمة مرور' },
      byEmail:        { fr: 'Email',                              en: 'Email',                            ar: 'البريد الإلكتروني' },
      byPhone:        { fr: 'Téléphone',                          en: 'Phone',                            ar: 'الهاتف' },
      emailPh:        { fr: 'votre@email.com',                    en: 'your@email.com',                   ar: 'بريدك@الإلكتروني.com' },
      phonePh:        { fr: '+212 6 00 00 00 00',                 en: '+1 555 000 0000',                  ar: '+212 6 00 00 00 00' },
      step2Hint:      { fr: 'Code envoyé à',                      en: 'Code sent to',                     ar: 'تم إرسال الرمز إلى' },
      step2HintWA:    { fr: 'Message WhatsApp envoyé à',          en: 'WhatsApp message sent to',         ar: 'تم إرسال رسالة WhatsApp إلى' },
      pwLabel:        { fr: 'Mot de passe',                       en: 'Password',                         ar: 'كلمة المرور' },
      confirmLabel:   { fr: 'Confirmation',                       en: 'Confirm password',                 ar: 'تأكيد كلمة المرور' },
      confirmMatch:   { fr: '✓ Les mots de passe correspondent',  en: '✓ Passwords match',               ar: '✓ كلمتا المرور متطابقتان' },
      chooseMeth:     { fr: 'Choisissez comment vous inscrire',   en: 'Choose how to sign up',            ar: 'اختر طريقة التسجيل' },
      otpLabel:       { fr: 'Code de vérification',               en: 'Verification code',                ar: 'رمز التحقق' },
      whatsappHint:   { fr: 'via WhatsApp',                       en: 'via WhatsApp',                     ar: 'عبر WhatsApp' },
    };
    return map[key]?.[this.lang] ?? key;
  }
}
