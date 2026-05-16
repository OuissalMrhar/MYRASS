import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { SiteLanguageService } from '../../core/site-language.service';
import { CartPageLabels } from '../../core/visitor-i18n';
import { CartLine, CartService } from '../../services/cart.service';
import { LoyaltyPointsService } from '../../services/loyalty-points.service';
import { OrdersApiService } from '../../services/orders-api.service';
import { UserAuthService } from '../../services/user-auth.service';
import { firstValueFrom } from 'rxjs';

export type PaymentTabId = 'online' | 'cod';

export interface CheckoutVm {
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
})
export class CartPageComponent implements OnInit, OnDestroy {
  readonly checkoutVm$: Observable<CheckoutVm>;
  readonly removedLines$: Observable<CartLine[]>;
  readonly labels$: Observable<CartPageLabels>;

  shippingDhs = 0;
  paymentTab: PaymentTabId = 'online';

  // ── Paiement en ligne (virement RIB) ──────────────────────────
  onlineProcessing = false;
  onlineSuccess = false;
  onlineError: string | null = null;

  // ── Paiement à la livraison (COD) ─────────────────────────────
  codNom = '';
  codTelephone = '';
  codEmail = '';
  codRue = '';
  codVille = '';
  codCodePostal = '';
  codSuccess = false;
  codError: string | null = null;
  codSubmitting = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly cart: CartService,
    private readonly loyalty: LoyaltyPointsService,
    private readonly userAuth: UserAuthService,
    private readonly ordersApi: OrdersApiService,
    private readonly siteLang: SiteLanguageService,
    private readonly http: HttpClient,
    readonly productRoutes: ProductRoutingHelper,
  ) {
    this.removedLines$ = this.cart.removedLines$;
    this.labels$ = this.siteLang.cartPageLabels$;
    this.checkoutVm$ = this.cart.lines$.pipe(
      map((lines) => {
        const subtotal = this.cart.computeTotalDhs(lines);
        return { lines, subtotal, shipping: this.shippingDhs, discount: 0, total: subtotal + this.shippingDhs };
      }),
    );
  }

  ngOnInit(): void {
    this.prefillCodFromProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Pré-remplit le formulaire COD avec les données du profil connecté. */
  private prefillCodFromProfile(): void {
    const user = this.userAuth.currentUser;
    if (!user) return;
    if (!this.codNom && user.nomComplet)
      this.codNom = user.nomComplet;
    if (!this.codTelephone && user.telephone)
      this.codTelephone = user.telephone.replace(/^\+212/, '').trim();
    if (!this.codEmail && user.email && !user.email.startsWith('placeholder.'))
      this.codEmail = user.email;
  }

  setPaymentTab(id: PaymentTabId): void {
    this.paymentTab = id;
    if (id === 'cod') this.prefillCodFromProfile();
  }

  // ── Quantités ────────────────────────────────────────────────

  increment(line: CartLine): void {
    this.cart.setLineQuantity(line.lineId, line.quantity + 1);
  }

  decrement(line: CartLine): void {
    if (line.quantity <= 1) this.cart.removeLine(line.lineId);
    else this.cart.setLineQuantity(line.lineId, line.quantity - 1);
  }

  lineSubtotal(line: CartLine): number {
    return this.cart.lineSubtotalDhs(line);
  }

  restoreRemovedLine(line: CartLine): void {
    this.cart.restoreRemovedLine(line);
  }

  // ── Paiement en ligne — virement bancaire ───────────────────

  async confirmOnlinePayment(vm: CheckoutVm): Promise<void> {
    if (this.onlineProcessing || this.onlineSuccess) return;
    if (vm.lines.length === 0) return;

    const user = this.userAuth.currentUser;
    if (!user?.id || !this.userAuth.getAccessToken()) {
      this.onlineError = 'Connectez-vous pour valider votre commande.';
      this.userAuth.requestOpenLoginPanel();
      return;
    }

    this.onlineError = null;
    this.onlineProcessing = true;

    try {
      // 1. Enregistrer la commande en base
      const res = await firstValueFrom(
        this.ordersApi.create({
          lignes: vm.lines.map((l) => ({ produitId: l.productId, quantite: l.quantity, tailleId: l.tailleId })),
          fraisLivraison: vm.shipping,
          modePaiement: 'en_ligne',
        })
      );

      if (res.userPointsTotal != null) {
        this.loyalty.applyServerTotal(res.userPointsTotal, res.pointsGagnes);
        this.userAuth.syncStoredPointsTotal(res.userPointsTotal);
      }

      this.cart.clear();
      this.onlineSuccess = true;

      // Email via fetch natif — indépendant d'Angular zone.js
      const lignesText = vm.lines
        .map((l) => `${l.name}${l.variantLabel ? ' (' + l.variantLabel + ')' : ''} × ${l.quantity}`)
        .join(', ');
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'order-rib',
          nomComplet: user.nomComplet,
          email: user.email,
          orderId: res.id,
          lignes: lignesText,
          total: vm.total.toFixed(2),
        }),
      }).catch(() => {});

    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string } })?.error?.message;
      this.onlineError = typeof msg === 'string' && msg.trim()
        ? msg
        : "Impossible d'enregistrer la commande. Vérifiez votre connexion.";
    } finally {
      this.onlineProcessing = false;
    }
  }

  // ── Paiement à la livraison (COD) ────────────────────────────

  async confirmCod(vm: CheckoutVm): Promise<void> {
    if (this.codSubmitting || this.codSuccess) return;
    if (vm.lines.length === 0) return;

    const user = this.userAuth.currentUser;
    if (!user?.id || !this.userAuth.getAccessToken()) {
      this.codError = 'Connectez-vous pour valider votre commande.';
      this.userAuth.requestOpenLoginPanel();
      return;
    }

    const nom = this.codNom.trim();
    const telephone = this.codTelephone.trim();
    const email = this.codEmail.trim();
    const rue = this.codRue.trim();

    if (!nom) { this.codError = 'Veuillez saisir votre nom complet.'; return; }
    if (!telephone) { this.codError = 'Veuillez saisir votre numéro de téléphone.'; return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.codError = 'Veuillez saisir une adresse email valide.'; return; }
    if (!rue) { this.codError = "Veuillez saisir votre adresse de livraison."; return; }

    this.codError = null;
    this.codSubmitting = true;

    // Capturer les données du panier AVANT l'appel async
    const lignesDetail = vm.lines.map(l => ({
      nom: l.name + (l.variantLabel ? ` (${l.variantLabel})` : ''),
      quantite: l.quantity,
      sousTotal: this.cart.lineSubtotalDhs(l).toFixed(2),
    }));
    const totalStr = vm.total.toFixed(2);
    const villeStr = this.codVille.trim() || '—';

    this.ordersApi
      .create({
        lignes: vm.lines.map((l) => ({ produitId: l.productId, quantite: l.quantity, tailleId: l.tailleId })),
        fraisLivraison: vm.shipping,
        modePaiement: 'a_la_livraison',
        nomDestinataire: nom,
        telephoneLivraison: telephone,
        rueLivraison: rue,
        villeLivraison: this.codVille.trim() || undefined,
        codePostalLivraison: this.codCodePostal.trim() || undefined,
        emailDestinataire: email,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.codSubmitting = false;
          if (res.userPointsTotal != null) {
            this.loyalty.applyServerTotal(res.userPointsTotal, res.pointsGagnes);
            this.userAuth.syncStoredPointsTotal(res.userPointsTotal);
          }

          this.cart.clear();
          this.codSuccess = true;

          // Email via fetch natif
          const emailPayload = {
            kind: 'order-cod',
            nomComplet: nom,
            email,
            telephone: `+212 ${telephone}`,
            orderId: res.id,
            lignesDetail,
            total: totalStr,
            ville: villeStr,
          };
          console.log('[COD email] Envoi à:', email, '| lignes:', lignesDetail.length, '| payload:', emailPayload);
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          })
          .then(r => r.json().then(d => console.log('[COD email] Réponse:', d)))
          .catch(err => console.error('[COD email] Erreur fetch:', err));
        },
        error: (err: { error?: { message?: string } }) => {
          this.codSubmitting = false;
          const msg = err?.error?.message;
          this.codError = typeof msg === 'string' && msg.trim()
            ? msg
            : "Impossible d'enregistrer la commande. Vérifiez votre connexion.";
        },
      });
  }
}
