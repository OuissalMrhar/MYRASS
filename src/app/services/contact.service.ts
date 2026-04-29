import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactPayload {
  nomComplet: string;
  email: string;
  telephone?: string;
  message: string;
}

export interface PartenariatPayload {
  entreprise: string;
  typePartenariat: string;
  nomComplet: string;
  email: string;
  telephone?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {

  private loadEmailJs(): Promise<any> {
    return new Promise((resolve, reject) => {
      if ((window as any).emailjs) { resolve((window as any).emailjs); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = () => resolve((window as any).emailjs);
      s.onerror = () => reject(new Error('EmailJS SDK non chargé'));
      document.head.appendChild(s);
    });
  }

  sendContact(payload: ContactPayload): Observable<void> {
    const { serviceId, templateId, publicKey, toEmail } = environment.emailjs;

    const promise = this.loadEmailJs().then(emailjs =>
      emailjs.send(serviceId, templateId, {
        to_email:    toEmail || 'myrasscode@gmail.com',
        form_type:   'Contact',
        nom_complet: payload.nomComplet,
        email:       payload.email,
        telephone:   payload.telephone || 'Non renseigné',
        message:     payload.message,
      }, publicKey)
    ).then(() => undefined as void);

    return from(promise);
  }

  sendPartenariat(payload: PartenariatPayload): Observable<void> {
    const { serviceId, publicKey, toEmail } = environment.emailjs;
    const partnerTemplateId = (environment.emailjs as any).partnerTemplateId;

    const promise = this.loadEmailJs().then(emailjs =>
      emailjs.send(serviceId, partnerTemplateId || (environment.emailjs as any).templateId, {
        to_email:          toEmail || 'myrasscode@gmail.com',
        form_type:         'Partenariat',
        entreprise:        payload.entreprise,
        type_partenariat:  payload.typePartenariat,
        nom_complet:       payload.nomComplet,
        email:             payload.email,
        telephone:         payload.telephone || 'Non renseigné',
        message:           payload.message,
      }, publicKey)
    ).then(() => undefined as void);

    return from(promise);
  }
}
