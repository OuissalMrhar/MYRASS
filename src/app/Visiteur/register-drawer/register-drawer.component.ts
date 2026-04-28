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
import { environment } from '../../../environments/environment';

type Step = 1 | 2 | 3;
type Method = 'email' | 'phone';

interface OtpState {
  code: string;
  expiresAt: number; // ms timestamp
}

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

  emailValue = '';
  phoneValue = '';
  sendingCode = false;
  step1Error = '';

  otpCode = '';
  otpError = '';
  otpVerifying = false;
  resendCooldown = 0;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;
  readonly OTP_TTL = 300;
  otpSecondsLeft = this.OTP_TTL;
  private otpTimer: ReturnType<typeof setInterval> | null = null;
  private otpState: OtpState | null = null;

  emailjsMissing = false;

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

  setMethod(m: Method): void {
    this.method = m;
    this.step1Error = '';
  }

  sendCode(): void {
    const value = this.inputValue.trim();
    if (!value) { this.step1Error = this.l('fieldRequired'); return; }
    if (this.method === 'email' && !this.validEmail(value)) {
      this.step1Error = this.l('emailInvalid'); return;
    }
    if (this.method === 'phone' && value.length < 6) {
      this.step1Error = this.l('phoneInvalid'); return;
    }
    const { serviceId, otpTemplateId, publicKey } = environment.emailjs;
    if (!serviceId || !otpTemplateId || !publicKey) {
      this.emailjsMissing = true;
      this.step1Error = this.l('emailjsNotConfigured');
      return;
    }
    this.emailjsMissing = false;
    this.step1Error = '';
    this.sendingCode = true;

    const code = this.generateOtp();
    this.otpState = { code, expiresAt: Date.now() + this.OTP_TTL * 1000 };

    this.dispatchOtp(value, code).then(() => {
      this.sendingCode = false;
      this.step = 2;
      this.startOtpTimer();
      this.startResendCooldown();
    }).catch(() => {
      this.sendingCode = false;
      this.step1Error = this.l('emailSendFailed');
      this.otpState = null;
    });
  }

  verifyOtp(): void {
    if (!this.otpState) { this.otpError = this.l('otpExpired'); return; }
    if (Date.now() > this.otpState.expiresAt) {
      this.otpError = this.l('otpExpired');
      this.otpState = null;
      return;
    }
    if (this.otpCode.trim().length < 4) { this.otpError = this.l('otpRequired'); return; }
    if (this.otpCode.trim() !== this.otpState.code) {
      this.otpError = this.l('otpWrong'); return;
    }
    this.otpError = '';
    this.otpVerifying = true;
    setTimeout(() => { this.otpVerifying = false; this.step = 3; }, 350);
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;
    const value = this.inputValue.trim();
    const code = this.generateOtp();
    this.otpState = { code, expiresAt: Date.now() + this.OTP_TTL * 1000 };
    this.otpCode = '';
    this.otpError = '';

    this.dispatchOtp(value, code).finally(() => {
      this.startOtpTimer();
      this.startResendCooldown();
    });
  }

  register(): void {
    if (!this.pwValid) { this.step3Error = this.l('pwInvalid'); return; }
    this.step3Error = '';
    this.submitting = true;

    const payload: Record<string, unknown> = {
      motDePasse: this.password,
    };

    if (this.method === 'email') {
      payload['email'] = this.inputValue.trim();
    } else {
      payload['telephone'] = this.inputValue.trim();
    }

    this.http.post<{ accessToken?: string; id: number; nomComplet: string; email: string; telephone?: string }>(
      apiUrl('/api/users'), payload
    ).subscribe({
      next: (resp) => {
        const credentials = this.method === 'email'
          ? { email: this.inputValue.trim(), motDePasse: this.password }
          : { telephone: this.inputValue.trim(), motDePasse: this.password };

        const loginObs = this.method === 'email'
          ? this.auth.login(credentials as { email: string; motDePasse: string })
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

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async dispatchOtp(to: string, code: string): Promise<void> {
    const { serviceId, otpTemplateId, publicKey } = environment.emailjs;
    const emailjs = await this.loadEmailJs();
    if (!emailjs) throw new Error('emailjs_load_failed');

    const target = this.method === 'email' ? to : (this.emailValue.trim() || to);
    await emailjs.send(serviceId, otpTemplateId, {
      to_email: target,
      otp_code: code,
      expiry_minutes: '5',
    }, publicKey);
  }

  private loadEmailJs(): Promise<any> {
    return new Promise((resolve) => {
      if ((window as any).emailjs) { resolve((window as any).emailjs); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = () => resolve((window as any).emailjs);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  private reset(): void {
    this.step = 1; this.method = 'email';
    this.emailValue = ''; this.phoneValue = '';
    this.otpCode = ''; this.password = ''; this.confirm = '';
    this.step1Error = ''; this.otpError = ''; this.step3Error = '';
    this.sendingCode = false; this.otpVerifying = false; this.submitting = false;
    this.showPw = false; this.showConfirm = false;
    this.otpState = null; this.emailjsMissing = false;
    this.clearTimers();
    this.otpSecondsLeft = this.OTP_TTL; this.resendCooldown = 0;
  }

  private startOtpTimer(): void {
    this.clearTimer('otp');
    this.otpSecondsLeft = this.OTP_TTL;
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
    if (w === 'otp' && this.otpTimer)         { clearInterval(this.otpTimer); this.otpTimer = null; }
    if (w === 'cooldown' && this.cooldownTimer) { clearInterval(this.cooldownTimer); this.cooldownTimer = null; }
  }

  private clearTimers(): void { this.clearTimer('otp'); this.clearTimer('cooldown'); }

  private validEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  l(key: string): string {
    const map: Record<string, Record<SiteLang, string>> = {
      fieldRequired:  { fr: 'Ce champ est requis.',                         en: 'This field is required.',            ar: 'هذا الحقل مطلوب.' },
      emailInvalid:   { fr: 'Adresse email invalide.',                       en: 'Invalid email address.',             ar: 'بريد إلكتروني غير صالح.' },
      phoneInvalid:   { fr: 'Numéro invalide (min. 6 chiffres).',           en: 'Invalid phone number (min. 6 digits).', ar: 'رقم غير صالح.' },
      otpRequired:    { fr: 'Saisissez le code reçu.',                       en: 'Enter the code you received.',       ar: 'أدخل الرمز الذي تلقيته.' },
      otpWrong:       { fr: 'Code incorrect. Vérifiez et réessayez.',        en: 'Incorrect code. Check and try again.', ar: 'الرمز غير صحيح. تحقق وحاول مجدداً.' },
      otpExpired:     { fr: 'Code expiré. Renvoyez un nouveau code.',        en: 'Code expired. Resend a new code.',   ar: 'انتهت صلاحية الرمز. أرسل رمزاً جديداً.' },
      pwMin:          { fr: 'Au moins 8 caractères',                         en: 'At least 8 characters',             ar: '8 أحرف على الأقل' },
      pwUpper:        { fr: 'Au moins 1 lettre majuscule',                   en: 'At least 1 uppercase letter',       ar: 'حرف كبير واحد على الأقل' },
      pwNumber:       { fr: 'Au moins 1 chiffre',                            en: 'At least 1 number',                 ar: 'رقم واحد على الأقل' },
      pwInvalid:      { fr: 'Vérifiez les conditions du mot de passe.',       en: 'Check the password requirements.',  ar: 'تحقق من شروط كلمة المرور.' },
      sendCode:       { fr: 'Envoyer le code',                               en: 'Send code',                         ar: 'إرسال الرمز' },
      sending:        { fr: 'Envoi…',                                        en: 'Sending…',                          ar: 'جارٍ الإرسال…' },
      resend:         { fr: 'Renvoyer le code',                              en: 'Resend code',                       ar: 'إعادة إرسال الرمز' },
      verify:         { fr: 'Continuer',                                     en: 'Continue',                          ar: 'متابعة' },
      createAccount:  { fr: 'Créer mon compte',                              en: 'Create account',                    ar: 'إنشاء حساب' },
      creating:       { fr: 'Création…',                                     en: 'Creating…',                         ar: 'جارٍ الإنشاء…' },
      step1Title:     { fr: 'Créer un compte',                               en: 'Create an account',                 ar: 'إنشاء حساب' },
      step2Title:     { fr: 'Vérification',                                  en: 'Verification',                      ar: 'التحقق' },
      step3Title:     { fr: 'Choisissez un mot de passe',                    en: 'Choose a password',                 ar: 'اختر كلمة مرور' },
      byEmail:        { fr: 'Email',                                         en: 'Email',                             ar: 'البريد الإلكتروني' },
      byPhone:        { fr: 'Téléphone',                                     en: 'Phone',                             ar: 'الهاتف' },
      emailPh:        { fr: 'votre@email.com',                               en: 'your@email.com',                    ar: 'بريدك@الإلكتروني.com' },
      phonePh:        { fr: '+33 6 00 00 00 00',                             en: '+1 555 000 0000',                   ar: '+212 6 00 00 00 00' },
      step2Hint:      { fr: 'Code envoyé à',                                 en: 'Code sent to',                      ar: 'تم إرسال الرمز إلى' },
      pwLabel:        { fr: 'Mot de passe',                                  en: 'Password',                          ar: 'كلمة المرور' },
      confirmLabel:   { fr: 'Confirmation',                                  en: 'Confirm password',                  ar: 'تأكيد كلمة المرور' },
      confirmMatch:   { fr: '✓ Les mots de passe correspondent',             en: '✓ Passwords match',                 ar: '✓ كلمتا المرور متطابقتان' },
      chooseMeth:     { fr: 'Choisissez comment vous inscrire',              en: 'Choose how to sign up',             ar: 'اختر طريقة التسجيل' },
      otpLabel:            { fr: 'Code de vérification',                              en: 'Verification code',                              ar: 'رمز التحقق' },
      otpExpiredMsg:       { fr: 'Code expiré. Demandez un nouveau code.',             en: 'Code expired. Request a new code.',               ar: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.' },
      emailjsNotConfigured:{ fr: 'Envoi d\'email non configuré. Renseignez serviceId, otpTemplateId et publicKey dans environment.ts.', en: 'Email sending not configured. Fill in serviceId, otpTemplateId and publicKey in environment.ts.', ar: 'إرسال البريد غير مُهيَّأ. يرجى إعداد EmailJS.' },
      emailSendFailed:     { fr: 'L\'envoi du code a échoué. Vérifiez votre configuration EmailJS.', en: 'Failed to send the code. Check your EmailJS configuration.', ar: 'فشل إرسال الرمز. تحقق من إعداد EmailJS.' },
    };
    return map[key]?.[this.lang] ?? key;
  }
}
