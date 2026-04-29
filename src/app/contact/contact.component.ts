import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  activeTab: 'contact' | 'partenariat' = 'contact';

  contactForm: FormGroup;
  partnerForm: FormGroup;

  contactState: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  partnerState: 'idle' | 'sending' | 'success' | 'error' = 'idle';

  partnershipTypes = [
    'Distributeur / Revendeur',
    'Partenaire logistique',
    'Influenceur / Ambassadeur',
    'Collaboration commerciale',
    'Investisseur',
    'Autre',
  ];

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.contactForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.partnerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      typePartenariat: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  switchTab(tab: 'contact' | 'partenariat'): void {
    this.activeTab = tab;
  }

  async sendContact(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    this.contactState = 'sending';
    const v = this.contactForm.value;

    try {
      const emailjs = await import('@emailjs/browser');
      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.contactTemplateId,
        {
          from_name: v.nom,
          from_email: v.email,
          reply_to: v.email,
          phone: v.telephone,
          message: v.message,
          to_email: environment.emailjs.toEmail,
          subject: 'Demande de contact - Myrass',
        },
        { publicKey: environment.emailjs.publicKey },
      );
      this.contactState = 'success';
      this.contactForm.reset();
    } catch {
      this.contactState = 'error';
    }
  }

  async sendPartenariat(): Promise<void> {
    if (this.partnerForm.invalid) {
      this.partnerForm.markAllAsTouched();
      return;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    this.partnerState = 'sending';
    const v = this.partnerForm.value;

    try {
      const emailjs = await import('@emailjs/browser');
      await emailjs.send(
        environment.emailjs.serviceId,
        environment.emailjs.partnerTemplateId,
        {
          from_name: v.nom,
          from_email: v.email,
          reply_to: v.email,
          phone: v.telephone,
          partnership_type: v.typePartenariat,
          message: v.message,
          to_email: environment.emailjs.toEmail,
          subject: 'Demande de partenariat - Myrass',
        },
        { publicKey: environment.emailjs.publicKey },
      );
      this.partnerState = 'success';
      this.partnerForm.reset();
    } catch {
      this.partnerState = 'error';
    }
  }

  get cf() { return this.contactForm.controls; }
  get pf() { return this.partnerForm.controls; }
}
