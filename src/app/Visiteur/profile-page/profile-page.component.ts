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
  profileForm: UpdateProfileDto = {};
  profileLoading = false;
  profileError = '';
  profileSuccess = '';

  // Password change
  oldPw = '';
  newPw = '';
  confirmPw = '';
  showOldPw = false;
  showNewPw = false;
  showConfirmPw = false;
  pwLoading = false;
  pwError = '';
  pwSuccess = '';

  // Forgot password
  forgotMode = false;
  forgotLoading = false;
  forgotError = '';
  forgotSuccess = '';

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

    // Refresh profile from server
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
    this.profileForm = {
      nomComplet: u.nomComplet || '',
      email: u.email || '',
      telephone: u.telephone || '',
      dateNaissance: u.dateNaissance || '',
    };
  }

  get initials(): string {
    if (this.auth.userInitials) return this.auth.userInitials;
    const id = this.user?.email?.[0] ?? this.user?.telephone?.[0] ?? '?';
    return id.toUpperCase();
  }

  get displayIdentifier(): string {
    return this.user?.email || this.user?.telephone || '';
  }

  get profileCompletion(): number {
    if (!this.user) return 0;
    const fields = [this.user.nomComplet, this.user.email, this.user.telephone, this.user.dateNaissance];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }

  get pwConditions(): { label: string; ok: boolean }[] {
    return [
      { label: this.t('pwMin'), ok: this.newPw.length >= 8 },
      { label: this.t('pwUpper'), ok: /[A-Z]/.test(this.newPw) },
      { label: this.t('pwNumber'), ok: /[0-9]/.test(this.newPw) },
    ];
  }

  setSection(s: Section): void {
    this.activeSection = s;
    this.editMode = false;
    this.profileError = '';
    this.profileSuccess = '';
    this.pwError = '';
    this.pwSuccess = '';
  }

  startEdit(): void {
    this.editMode = true;
    this.profileError = '';
    this.profileSuccess = '';
  }

  cancelEdit(): void {
    this.editMode = false;
    if (this.user) this.initForm(this.user);
  }

  saveProfile(): void {
    this.profileError = '';
    this.profileLoading = true;

    this.auth.updateProfile(this.profileForm).subscribe({
      next: (u) => {
        this.user = u;
        this.profileLoading = false;
        this.editMode = false;
        this.profileSuccess = this.t('profileSaved');
        setTimeout(() => (this.profileSuccess = ''), 3500);
      },
      error: (e) => {
        this.profileLoading = false;
        this.profileError = parseApiError(e);
      },
    });
  }

  changePassword(): void {
    this.pwError = '';
    if (!this.oldPw || !this.newPw || !this.confirmPw) {
      this.pwError = this.t('allFieldsRequired'); return;
    }
    if (this.newPw !== this.confirmPw) { this.pwError = this.t('pwMismatch'); return; }
    if (!this.pwConditions.every((c) => c.ok)) { this.pwError = this.t('pwRequirements'); return; }

    this.pwLoading = true;
    this.auth.changePassword({ ancienMotDePasse: this.oldPw, nouveauMotDePasse: this.newPw }).subscribe({
      next: () => {
        this.pwLoading = false;
        this.oldPw = '';
        this.newPw = '';
        this.confirmPw = '';
        this.forgotMode = false;
        this.pwSuccess = this.t('pwChanged');
        setTimeout(() => (this.pwSuccess = ''), 3500);
      },
      error: (e) => {
        this.pwLoading = false;
        this.pwError = parseApiError(e);
      },
    });
  }

  forgotPassword(): void {
    if (!this.user) return;
    this.forgotError = '';
    this.forgotLoading = true;
    const method = this.user.email ? 'email' : 'phone';
    const value  = (this.user.email || this.user.telephone)!;

    this.auth.requestPasswordReset({ method: method as 'email' | 'phone', value }).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotSuccess = this.t('forgotSent');
        this.forgotMode = true;
      },
      error: (e) => {
        this.forgotLoading = false;
        this.forgotError = parseApiError(e);
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }

  t(key: string): string {
    const map: Record<string, Record<SiteLang, string>> = {
      profileTitle:    { fr: 'Mon profil',                          en: 'My profile',                    ar: 'ملفي الشخصي' },
      infoTab:         { fr: 'Informations',                        en: 'Information',                   ar: 'المعلومات' },
      pwTab:           { fr: 'Mot de passe',                        en: 'Password',                      ar: 'كلمة المرور' },
      ordersTab:       { fr: 'Mes commandes',                       en: 'My orders',                     ar: 'طلباتي' },
      editProfile:     { fr: 'Modifier le profil',                  en: 'Edit profile',                  ar: 'تعديل الملف' },
      save:            { fr: 'Enregistrer',                         en: 'Save',                          ar: 'حفظ' },
      cancel:          { fr: 'Annuler',                             en: 'Cancel',                        ar: 'إلغاء' },
      profileSaved:    { fr: 'Profil mis à jour avec succès.',      en: 'Profile updated successfully.',  ar: 'تم تحديث الملف بنجاح.' },
      fullName:        { fr: 'Nom complet',                         en: 'Full name',                     ar: 'الاسم الكامل' },
      emailLabel:      { fr: 'Email',                               en: 'Email',                         ar: 'البريد الإلكتروني' },
      phoneLabel:      { fr: 'Téléphone',                           en: 'Phone',                         ar: 'الهاتف' },
      dobLabel:        { fr: 'Date de naissance',                   en: 'Date of birth',                 ar: 'تاريخ الميلاد' },
      oldPw:           { fr: 'Ancien mot de passe',                 en: 'Current password',              ar: 'كلمة المرور الحالية' },
      newPw:           { fr: 'Nouveau mot de passe',                en: 'New password',                  ar: 'كلمة المرور الجديدة' },
      confirmPw:       { fr: 'Confirmer le nouveau mot de passe',   en: 'Confirm new password',          ar: 'تأكيد كلمة المرور الجديدة' },
      pwMin:           { fr: 'Au moins 8 caractères',               en: 'At least 8 characters',         ar: '8 أحرف على الأقل' },
      pwUpper:         { fr: 'Au moins 1 majuscule',                en: 'At least 1 uppercase letter',   ar: 'حرف كبير واحد على الأقل' },
      pwNumber:        { fr: 'Au moins 1 chiffre',                  en: 'At least 1 number',             ar: 'رقم واحد على الأقل' },
      changePw:        { fr: 'Modifier le mot de passe',            en: 'Change password',               ar: 'تغيير كلمة المرور' },
      forgotPw:        { fr: 'Mot de passe oublié ?',               en: 'Forgot password?',              ar: 'نسيت كلمة المرور؟' },
      sendReset:       { fr: 'Envoyer un code de réinitialisation', en: 'Send reset code',               ar: 'إرسال رمز إعادة التعيين' },
      forgotSent:      { fr: 'Code envoyé. Vérifiez votre email ou téléphone.', en: 'Code sent. Check your email or phone.', ar: 'تم إرسال الرمز. تحقق من بريدك أو هاتفك.' },
      pwChanged:       { fr: 'Mot de passe modifié avec succès.',   en: 'Password changed successfully.', ar: 'تم تغيير كلمة المرور بنجاح.' },
      pwMismatch:      { fr: 'Les mots de passe ne correspondent pas.', en: 'Passwords do not match.', ar: 'كلمتا المرور غير متطابقتين.' },
      pwRequirements:  { fr: 'Le mot de passe ne respecte pas les conditions.', en: 'Password does not meet requirements.', ar: 'كلمة المرور لا تستوفي الشروط.' },
      allFieldsRequired: { fr: 'Tous les champs sont requis.', en: 'All fields are required.', ar: 'جميع الحقول مطلوبة.' },
      profileHint:     { fr: 'Complétez votre profil pour profiter de toutes nos offres et recevoir des recommandations personnalisées.', en: 'Complete your profile to enjoy all our offers and receive personalised recommendations.', ar: 'أكمل ملفك الشخصي للاستمتاع بجميع عروضنا وتلقي توصيات مخصصة.' },
      completion:      { fr: 'Profil complété à',                   en: 'Profile',                       ar: 'اكتمال الملف' },
      logout:          { fr: 'Se déconnecter',                      en: 'Sign out',                      ar: 'تسجيل الخروج' },
      viewOrders:      { fr: 'Voir mes commandes',                  en: 'View my orders',                ar: 'عرض طلباتي' },
    };
    return map[key]?.[this.lang] ?? key;
  }
}
