import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserAuthService } from '../../services/user-auth.service';
import { ContactService } from '../../services/contact.service';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang } from '../../core/visitor-i18n';

export interface ContactLabels {
  // Coordonnées
  coordTitle: string;
  emailLabel: string; phoneLabel: string; addressLabel: string;
  emailValue: string; phoneValue: string; addressValue: string;
  followTitle: string; followSub: string;
  // Onglets
  tabContact: string; tabPartnership: string;
  // Formulaire contact
  contactTitle: string;
  nameLabel: string; namePlaceholder: string;
  emailFormLabel: string; emailPlaceholder: string;
  phoneFormLabel: string; phonePlaceholder: string;
  messageLabel: string; messagePlaceholder: string;
  sendBtn: string; sendingBtn: string;
  successMsg: string; errorMsg: string;
  // Formulaire partenariat
  partnerTitle: string;
  companyLabel: string; companyPlaceholder: string;
  partnerTypeLabel: string;
  partnerTypes: { value: string; label: string }[];
  partnerNameLabel: string; partnerNamePlaceholder: string;
  partnerEmailLabel: string; partnerEmailPlaceholder: string;
  partnerPhoneLabel: string; partnerPhonePlaceholder: string;
  partnerMsgLabel: string; partnerMsgPlaceholder: string;
  partnerSendBtn: string; partnerSendingBtn: string;
  partnerSuccessMsg: string; partnerErrorMsg: string;
}

const CONTACT_LABELS: Record<SiteLang, ContactLabels> = {
  fr: {
    coordTitle: 'Nos Coordonnées',
    emailLabel: 'Email', phoneLabel: 'Téléphone', addressLabel: 'Adresse',
    emailValue: 'contact@myrass.com', phoneValue: '+212 648 060 670', addressValue: 'Rue Bani Marine, Immeuble Laalaj, 2ᵉ étage, N°15, Oujda, Maroc',
    followTitle: 'Suivez-nous',
    followSub: 'Restez informés de nos actualités sur les réseaux sociaux.',
    tabContact: 'Contact', tabPartnership: 'Partenariat',
    contactTitle: 'Envoyez-nous un Message',
    nameLabel: 'Nom complet *', namePlaceholder: 'Votre nom',
    emailFormLabel: 'Email *', emailPlaceholder: 'votre.email@exemple.com',
    phoneFormLabel: 'Téléphone', phonePlaceholder: '+212 XXXX XX XX',
    messageLabel: 'Message *', messagePlaceholder: 'Décrivez votre demande...',
    sendBtn: 'Envoyer', sendingBtn: 'Envoi en cours...',
    successMsg: 'Message envoyé avec succès. Nous vous répondrons bientôt !',
    errorMsg: "Impossible d'envoyer le message. Veuillez réessayer.",
    partnerTitle: 'Proposition de Partenariat',
    companyLabel: 'Entreprise *', companyPlaceholder: 'Nom de votre entreprise',
    partnerTypeLabel: 'Type de partenariat *',
    partnerTypes: [
      { value: 'Distributeur', label: 'Distributeur' },
      { value: 'Fournisseur', label: 'Fournisseur' },
      { value: 'Revendeur', label: 'Revendeur' },
      { value: 'Investisseur', label: 'Investisseur' },
      { value: 'Autre', label: 'Autre' },
    ],
    partnerNameLabel: 'Nom complet *', partnerNamePlaceholder: 'Votre nom',
    partnerEmailLabel: 'Email *', partnerEmailPlaceholder: 'votre.email@exemple.com',
    partnerPhoneLabel: 'Téléphone', partnerPhonePlaceholder: '+212 XXXX XX XX',
    partnerMsgLabel: 'Message *', partnerMsgPlaceholder: 'Décrivez votre proposition...',
    partnerSendBtn: 'Envoyer la Proposition', partnerSendingBtn: 'Envoi en cours...',
    partnerSuccessMsg: 'Proposition envoyée. Nous vous contacterons bientôt.',
    partnerErrorMsg: "Impossible d'envoyer. Veuillez réessayer.",
  },
  en: {
    coordTitle: 'Our Contact Details',
    emailLabel: 'Email', phoneLabel: 'Phone', addressLabel: 'Address',
    emailValue: 'contact@myrass.com', phoneValue: '+212 648 060 670', addressValue: 'Bani Marine Street, Laalaj Building, 2nd Floor, No. 15, Oujda, Morocco',
    followTitle: 'Follow Us',
    followSub: 'Stay informed about our latest news on social media.',
    tabContact: 'Contact', tabPartnership: 'Partnership',
    contactTitle: 'Send Us a Message',
    nameLabel: 'Full name *', namePlaceholder: 'Your name',
    emailFormLabel: 'Email *', emailPlaceholder: 'your.email@example.com',
    phoneFormLabel: 'Phone', phonePlaceholder: '+212 XXXX XX XX',
    messageLabel: 'Message *', messagePlaceholder: 'Describe your request...',
    sendBtn: 'Send', sendingBtn: 'Sending...',
    successMsg: 'Message sent successfully. We will reply soon!',
    errorMsg: 'Unable to send the message. Please try again.',
    partnerTitle: 'Partnership Proposal',
    companyLabel: 'Company *', companyPlaceholder: 'Your company name',
    partnerTypeLabel: 'Partnership type *',
    partnerTypes: [
      { value: 'Distributor', label: 'Distributor' },
      { value: 'Supplier', label: 'Supplier' },
      { value: 'Reseller', label: 'Reseller' },
      { value: 'Investor', label: 'Investor' },
      { value: 'Other', label: 'Other' },
    ],
    partnerNameLabel: 'Full name *', partnerNamePlaceholder: 'Your name',
    partnerEmailLabel: 'Email *', partnerEmailPlaceholder: 'your.email@example.com',
    partnerPhoneLabel: 'Phone', partnerPhonePlaceholder: '+212 XXXX XX XX',
    partnerMsgLabel: 'Message *', partnerMsgPlaceholder: 'Describe your proposal...',
    partnerSendBtn: 'Send Proposal', partnerSendingBtn: 'Sending...',
    partnerSuccessMsg: 'Proposal sent. We will contact you soon.',
    partnerErrorMsg: 'Unable to send. Please try again.',
  },
  ar: {
    coordTitle: 'معلومات الاتصال',
    emailLabel: 'البريد الإلكتروني', phoneLabel: 'الهاتف', addressLabel: 'العنوان',
    emailValue: 'contact@myrass.com', phoneValue: '+212 648 060 670', addressValue: 'شارع بني مارين، عمارة العلاج، الطابق الثاني، رقم 15، وجدة، المغرب',
    followTitle: 'تابعونا',
    followSub: 'ابقَ على اطلاع بآخر أخبارنا على منصات التواصل الاجتماعي.',
    tabContact: 'تواصل', tabPartnership: 'شراكة',
    contactTitle: 'أرسل لنا رسالة',
    nameLabel: 'الاسم الكامل *', namePlaceholder: 'اسمك',
    emailFormLabel: 'البريد الإلكتروني *', emailPlaceholder: 'your.email@example.com',
    phoneFormLabel: 'الهاتف', phonePlaceholder: '+212 XXXX XX XX',
    messageLabel: 'الرسالة *', messagePlaceholder: 'صف طلبك...',
    sendBtn: 'إرسال', sendingBtn: 'جارٍ الإرسال...',
    successMsg: 'تم إرسال الرسالة بنجاح. سنرد عليك قريباً!',
    errorMsg: 'تعذّر إرسال الرسالة. يرجى المحاولة مجدداً.',
    partnerTitle: 'اقتراح شراكة',
    companyLabel: 'الشركة *', companyPlaceholder: 'اسم شركتك',
    partnerTypeLabel: 'نوع الشراكة *',
    partnerTypes: [
      { value: 'موزّع', label: 'موزّع' },
      { value: 'مورّد', label: 'مورّد' },
      { value: 'موزّع بالتجزئة', label: 'موزّع بالتجزئة' },
      { value: 'مستثمر', label: 'مستثمر' },
      { value: 'أخرى', label: 'أخرى' },
    ],
    partnerNameLabel: 'الاسم الكامل *', partnerNamePlaceholder: 'اسمك',
    partnerEmailLabel: 'البريد الإلكتروني *', partnerEmailPlaceholder: 'your.email@example.com',
    partnerPhoneLabel: 'الهاتف', partnerPhonePlaceholder: '+212 XXXX XX XX',
    partnerMsgLabel: 'الرسالة *', partnerMsgPlaceholder: 'صف اقتراحك...',
    partnerSendBtn: 'إرسال الاقتراح', partnerSendingBtn: 'جارٍ الإرسال...',
    partnerSuccessMsg: 'تم إرسال الاقتراح. سنتواصل معك قريباً.',
    partnerErrorMsg: 'تعذّر الإرسال. يرجى المحاولة مجدداً.',
  },
};

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit, OnDestroy {
  // Contact form
  form!: FormGroup;
  isAutofilled = false;
  isSending = false;
  sendState: 'idle' | 'success' | 'error' = 'idle';

  // Partnership form
  partnerForm!: FormGroup;
  isPartnerSending = false;
  partnerSendState: 'idle' | 'success' | 'error' = 'idle';

  // Tab state
  activeTab: 'contact' | 'partnership' = 'contact';
  formKey = 0;

  // i18n
  labels: ContactLabels = CONTACT_LABELS['fr'];
  isRtl = false;

  get phoneTelHref(): string {
    return 'tel:' + this.labels.phoneValue.replace(/\s/g, '');
  }

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: UserAuthService,
    private readonly contactService: ContactService,
    private readonly langService: SiteLanguageService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nomComplet: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      message: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.partnerForm = this.fb.group({
      company: ['', [Validators.required]],
      partnerType: ['', [Validators.required]],
      nomComplet: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      message: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      if (u) {
        this.isAutofilled = true;
        this.form.patchValue(
          { nomComplet: u.nomComplet ?? '', email: u.email ?? '', telephone: u.telephone ?? '' },
          { emitEvent: false },
        );
        this.partnerForm.patchValue(
          { nomComplet: u.nomComplet ?? '', email: u.email ?? '', telephone: u.telephone ?? '' },
          { emitEvent: false },
        );
      } else {
        this.isAutofilled = false;
        this.form.patchValue({ nomComplet: '', email: '', telephone: '', message: '' }, { emitEvent: false });
        this.partnerForm.patchValue({ company: '', partnerType: '', nomComplet: '', email: '', telephone: '', message: '' }, { emitEvent: false });
      }
    });

    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
      this.labels = CONTACT_LABELS[lang];
      this.isRtl = lang === 'ar';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: 'contact' | 'partnership'): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    this.formKey++;
    this.sendState = 'idle';
    this.partnerSendState = 'idle';
  }

  send(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.isSending) return;

    this.isSending = true;
    this.sendState = 'idle';

    this.contactService.sendContact({
      nomComplet: String(this.form.value.nomComplet ?? '').trim(),
      email: String(this.form.value.email ?? '').trim(),
      telephone: String(this.form.value.telephone ?? '').trim() || undefined,
      message: String(this.form.value.message ?? '').trim(),
    }).subscribe({
      next: () => {
        this.sendState = 'success';
        this.form.patchValue({ message: '' }, { emitEvent: false });
        this.isSending = false;
      },
      error: () => {
        this.sendState = 'error';
        this.isSending = false;
      },
    });
  }

  sendPartnership(): void {
    if (this.partnerForm.invalid) { this.partnerForm.markAllAsTouched(); return; }
    if (this.isPartnerSending) return;

    this.isPartnerSending = true;
    this.partnerSendState = 'idle';

    this.contactService.sendPartenariat({
      entreprise: String(this.partnerForm.value.company ?? '').trim(),
      typePartenariat: String(this.partnerForm.value.partnerType ?? '').trim(),
      nomComplet: String(this.partnerForm.value.nomComplet ?? '').trim(),
      email: String(this.partnerForm.value.email ?? '').trim(),
      telephone: String(this.partnerForm.value.telephone ?? '').trim() || undefined,
      message: String(this.partnerForm.value.message ?? '').trim(),
    }).subscribe({
      next: () => {
        this.partnerSendState = 'success';
        this.partnerForm.patchValue({ message: '' }, { emitEvent: false });
        this.isPartnerSending = false;
      },
      error: () => {
        this.partnerSendState = 'error';
        this.isPartnerSending = false;
      },
    });
  }
}
