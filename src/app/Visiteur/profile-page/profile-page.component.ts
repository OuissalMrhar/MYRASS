import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserAuthService, VisitorUser, UpdateProfileDto } from '../../services/user-auth.service';
import { parseApiError } from '../../core/http-error';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang } from '../../core/visitor-i18n';

type Section = 'info' | 'password' | 'orders';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  user: VisitorUser | null = null;
  lang: SiteLang = 'fr';
  isRtl = false;
  activeSection: Section = 'info';

  // Profile form
  editMode = false;
  nomComplet = '';
  telephone = '';
  email = '';
  dateNaissance = '';
  genreId = 3;
  profileLoading = false;
  profileError = '';
  profileSuccess = '';

  // Genres
  readonly genres = [
    { id: 1, label: 'M.' },
    { id: 2, label: 'Mme' },
    { id: 3, label: 'Non précisé' },
  ];

  // Password – mode normal
  oldPw = '';
  newPw = '';
  confirmPw = '';
  showOldPw = false;
  showNewPw = false;
  showConfirmPw = false;
  pwLoading = false;
  pwError = '';
  pwSuccess = '';

  // Mot de passe oublié
  forgotMode = false;
  forgotStep: 'send' | 'verify' = 'send';
  forgotLoading = false;
  forgotError = '';
  forgotSuccess = '';
  resetOtpCode = '';
  resetNewPw = '';
  resetConfirmPw = '';
  showResetPw = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private auth: UserAuthService,
    private router: Router,
    private siteLang: SiteLanguageService,
  ) {}

  ngOnInit(): void {
    this.siteLang.lang$.pipe(takeUntil(this.destroy$)).subscribe((l) => {
      this.lang = l;
      this.isRtl = l === 'ar';
    });

    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      if (!u) { this.router.navigate(['/home']); return; }
      this.user = u;
      this.initForm(u);
    });

    this.auth.getProfile().pipe(takeUntil(this.destroy$)).subscribe({
      next: (u) => { this.user = u; this.initForm(u); },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(u: VisitorUser): void {
    this.nomComplet   = u.nomComplet && u.nomComplet !== 'Utilisateur' ? u.nomComplet : '';
    this.telephone    = u.telephone && !u.telephone.startsWith('06') ? u.telephone : (u.telephone || '');
    this.email        = u.email && !u.email.startsWith('placeholder.') ? u.email : '';
    this.dateNaissance = u.dateNaissance
      ? u.dateNaissance.startsWith('1900') ? '' : u.dateNaissance.slice(0, 10)
      : '';
    this.genreId = u.genreId ?? 3;
  }

  get initials(): string { return this.auth.userInitials || '?'; }

  get displayIdentifier(): string {
    const e = this.user?.email ?? '';
    const p = this.user?.telephone ?? '';
    return (!e.startsWith('placeholder.') && e) ? e : p;
  }

  get registeredByEmail(): boolean {
    const e = this.user?.email ?? '';
    return !!e && !e.startsWith('placeholder.');
  }

  get profileCompletion(): number {
    if (!this.user) return 0;
    const real = (v: string | null | undefined, fake?: string) => {
      if (!v) return false;
      if (fake && v.startsWith(fake)) return false;
      if (v === 'Utilisateur') return false;
      if (v.startsWith('1900')) return false;
      return true;
    };
    const fields = [
      real(this.user.nomComplet),
      real(this.user.email, 'placeholder.'),
      real(this.user.telephone),
      real(this.user.dateNaissance),
      (this.user.genreId ?? 3) !== 3,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }

  get pwConditions(): { label: string; ok: boolean }[] {
    const pw = this.forgotMode ? this.resetNewPw : this.newPw;
    return [
      { label: this.t('pwMin'),    ok: pw.length >= 8 },
      { label: this.t('pwUpper'),  ok: /[A-Z]/.test(pw) },
      { label: this.t('pwNumber'), ok: /[0-9]/.test(pw) },
    ];
  }

  setSection(s: Section): void {
    this.activeSection = s;
    this.editMode = false;
    this.profileError = '';
    this.profileSuccess = '';
    this.pwError = '';
    this.pwSuccess = '';
    this.forgotMode = false;
    this.forgotStep = 'send';
  }

  startEdit(): void { this.editMode = true; this.profileError = ''; }

  cancelEdit(): void {
    this.editMode = false;
    if (this.user) this.initForm(this.user);
  }

  saveProfile(): void {
    this.profileError = '';
    this.profileLoading = true;
    const dto: UpdateProfileDto = {
      nomComplet:    this.nomComplet.trim() || undefined,
      telephone:     this.telephone.trim() || undefined,
      email:         this.email.trim() || undefined,
      dateNaissance: this.dateNaissance || undefined,
      genreId:       this.genreId,
    };
    this.auth.updateProfile(dto).subscribe({
      next: (u) => {
        this.user = u; this.initForm(u);
        this.profileLoading = false;
        this.editMode = false;
        this.profileSuccess = this.t('profileSaved');
        setTimeout(() => (this.profileSuccess = ''), 3500);
      },
      error: (e) => { this.profileLoading = false; this.profileError = parseApiError(e); },
    });
  }

  // ── Mot de passe normal ────────────────────────────────────────
  changePassword(): void {
    this.pwError = '';
    if (!this.oldPw || !this.newPw || !this.confirmPw) { this.pwError = this.t('allRequired'); return; }
    if (this.newPw !== this.confirmPw) { this.pwError = this.t('pwMismatch'); return; }
    if (!this.pwConditions.every(c => c.ok)) { this.pwError = this.t('pwRequirements'); return; }
    this.pwLoading = true;
    this.auth.changePassword({ ancienMotDePasse: this.oldPw, nouveauMotDePasse: this.newPw }).subscribe({
      next: () => {
        this.pwLoading = false;
        this.oldPw = ''; this.newPw = ''; this.confirmPw = '';
        this.pwSuccess = this.t('pwChanged');
        setTimeout(() => (this.pwSuccess = ''), 3500);
      },
      error: (e) => { this.pwLoading = false; this.pwError = parseApiError(e); },
    });
  }

  // ── Mot de passe oublié ────────────────────────────────────────
  enterForgotMode(): void {
    this.forgotMode = true;
    this.forgotStep = 'send';
    this.forgotError = '';
    this.forgotSuccess = '';
    this.resetOtpCode = '';
    this.resetNewPw = '';
    this.resetConfirmPw = '';
    this.pwError = '';
  }

  cancelForgot(): void {
    this.forgotMode = false;
    this.forgotStep = 'send';
    this.forgotError = '';
  }

  sendForgotOtp(): void {
    if (!this.user) return;
    this.forgotError = '';
    this.forgotLoading = true;
    const method = this.registeredByEmail ? 'email' : 'phone';
    const value  = this.registeredByEmail ? this.user.email! : this.user.telephone!;
    this.auth.requestPasswordReset({ method: method as 'email' | 'phone', value }).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotStep = 'verify';
        this.forgotSuccess = this.t('resetCodeSent');
      },
      error: (e) => { this.forgotLoading = false; this.forgotError = parseApiError(e); },
    });
  }

  confirmResetPassword(): void {
    this.forgotError = '';
    if (!this.resetOtpCode.trim()) { this.forgotError = this.t('codeRequired'); return; }
    if (!this.resetNewPw || !this.resetConfirmPw) { this.forgotError = this.t('allRequired'); return; }
    if (this.resetNewPw !== this.resetConfirmPw) { this.forgotError = this.t('pwMismatch'); return; }
    if (!this.pwConditions.every(c => c.ok)) { this.forgotError = this.t('pwRequirements'); return; }

    this.forgotLoading = true;
    const method = this.registeredByEmail ? 'email' : 'phone';
    const value  = this.registeredByEmail ? this.user!.email! : this.user!.telephone!;
    this.auth.resetPassword({ otpCode: this.resetOtpCode.trim(), method, value, nouveauMotDePasse: this.resetNewPw }).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotMode = false;
        this.pwSuccess = this.t('pwChanged');
        setTimeout(() => (this.pwSuccess = ''), 3500);
      },
      error: (e) => { this.forgotLoading = false; this.forgotError = parseApiError(e); },
    });
  }

  logout(): void { this.auth.logout(); this.router.navigate(['/home']); }

  t(key: string): string {
    const map: Record<string, Record<SiteLang, string>> = {
      infoTab:        { fr: 'Informations',                           en: 'Information',                  ar: 'المعلومات' },
      pwTab:          { fr: 'Sécurité',                               en: 'Security',                     ar: 'الأمان' },
      ordersTab:      { fr: 'Mes commandes',                          en: 'My orders',                    ar: 'طلباتي' },
      editProfile:    { fr: 'Modifier',                               en: 'Edit',                         ar: 'تعديل' },
      save:           { fr: 'Enregistrer',                            en: 'Save',                         ar: 'حفظ' },
      cancel:         { fr: 'Annuler',                                en: 'Cancel',                       ar: 'إلغاء' },
      profileSaved:   { fr: '✓ Profil mis à jour.',                   en: '✓ Profile updated.',           ar: '✓ تم تحديث الملف.' },
      fullName:       { fr: 'Nom complet',                            en: 'Full name',                    ar: 'الاسم الكامل' },
      emailLabel:     { fr: 'Adresse email',                          en: 'Email address',                ar: 'البريد الإلكتروني' },
      phoneLabel:     { fr: 'Téléphone',                              en: 'Phone',                        ar: 'الهاتف' },
      dobLabel:       { fr: 'Date de naissance',                      en: 'Date of birth',                ar: 'تاريخ الميلاد' },
      genreLabel:     { fr: 'Genre',                                  en: 'Title',                        ar: 'اللقب' },
      oldPw:          { fr: 'Mot de passe actuel',                    en: 'Current password',             ar: 'كلمة المرور الحالية' },
      newPw:          { fr: 'Nouveau mot de passe',                   en: 'New password',                 ar: 'كلمة المرور الجديدة' },
      confirmPw:      { fr: 'Confirmer le nouveau mot de passe',      en: 'Confirm new password',         ar: 'تأكيد كلمة المرور الجديدة' },
      pwMin:          { fr: 'Au moins 8 caractères',                  en: 'At least 8 characters',        ar: '8 أحرف على الأقل' },
      pwUpper:        { fr: 'Au moins 1 majuscule',                   en: 'At least 1 uppercase letter',  ar: 'حرف كبير على الأقل' },
      pwNumber:       { fr: 'Au moins 1 chiffre',                     en: 'At least 1 number',            ar: 'رقم واحد على الأقل' },
      changePw:       { fr: 'Modifier le mot de passe',               en: 'Change password',              ar: 'تغيير كلمة المرور' },
      forgotPw:       { fr: 'Mot de passe oublié ?',                  en: 'Forgot password?',             ar: 'نسيت كلمة المرور؟' },
      resetCodeSent:  { fr: 'Code envoyé. Consultez vos messages.',   en: 'Code sent. Check your messages.', ar: 'تم إرسال الرمز.' },
      codeRequired:   { fr: 'Saisissez le code reçu.',                en: 'Enter the code you received.', ar: 'أدخل الرمز المُستلم.' },
      codeLabel:      { fr: 'Code reçu',                              en: 'Received code',                ar: 'الرمز المُستلم' },
      confirmReset:   { fr: 'Confirmer le nouveau mot de passe',      en: 'Confirm new password',         ar: 'تأكيد كلمة المرور الجديدة' },
      pwChanged:      { fr: '✓ Mot de passe modifié avec succès.',    en: '✓ Password changed.',          ar: '✓ تم تغيير كلمة المرور.' },
      pwMismatch:     { fr: 'Les mots de passe ne correspondent pas.', en: 'Passwords do not match.',     ar: 'كلمتا المرور غير متطابقتين.' },
      pwRequirements: { fr: 'Le mot de passe ne respecte pas les conditions.', en: 'Password does not meet requirements.', ar: 'كلمة المرور لا تستوفي الشروط.' },
      allRequired:    { fr: 'Tous les champs sont requis.',            en: 'All fields are required.',     ar: 'جميع الحقول مطلوبة.' },
      profileHint:    { fr: 'En complétant votre profil, vous accédez à des offres exclusives, des promotions personnalisées et une expérience d\'achat sur mesure.', en: 'By completing your profile, you unlock exclusive offers, personalised promotions and a tailored shopping experience.', ar: 'باكتمال ملفك الشخصي، تحصل على عروض حصرية وترقيات مخصصة وتجربة تسوق متميزة.' },
      notSet:         { fr: 'Non renseigné',                          en: 'Not set',                      ar: 'غير محدد' },
      logout:         { fr: 'Se déconnecter',                         en: 'Sign out',                     ar: 'تسجيل الخروج' },
      sendCode:       { fr: 'Envoyer le code',                        en: 'Send code',                    ar: 'إرسال الرمز' },
      sending:        { fr: 'Envoi…',                                 en: 'Sending…',                    ar: 'جارٍ الإرسال…' },
      backToLogin:    { fr: '← Retour',                               en: '← Back',                      ar: '← رجوع' },
      completion:     { fr: 'Profil complété à',                      en: 'Profile',                      ar: 'اكتمال الملف' },
      viewOrders:     { fr: 'Accéder à mes commandes',                en: 'View my orders',               ar: 'عرض طلباتي' },
    };
    return map[key]?.[this.lang] ?? key;
  }
}
