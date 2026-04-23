import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../core/api-url';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { SiteLanguageService } from '../../core/site-language.service';
import { CartPageLabels } from '../../core/visitor-i18n';
import { CartLine, CartService } from '../../services/cart.service';
import { LoyaltyPointsService } from '../../services/loyalty-points.service';
import { OrdersApiService } from '../../services/orders-api.service';
import { PromoPublicService } from '../../services/promo-public.service';
import { UserAuthService } from '../../services/user-auth.service';

export type PaymentTabId = 'card' | 'eps' | 'giropay' | 'other';

export interface CheckoutVm {
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promoInvalid: string | null;
  promoHint: string | null;
  codePromoForSubmit: string | null;
}

/** Clé publiable Stripe — remplacez par votre clé pk_live_… ou pk_test_… */
const STRIPE_PUBLISHABLE_KEY = 'pk_test_REMPLACEZ_PAR_VOTRE_CLE_STRIPE';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
})
export class CartPageComponent implements AfterViewInit, OnDestroy {
  readonly checkoutVm$: Observable<CheckoutVm>;
  readonly removedLines$: Observable<CartLine[]>;
  readonly labels$: Observable<CartPageLabels>;

  shippingDhs = 0;
  paymentTab: PaymentTabId = 'card';

  nameOnCard = '';
  country = 'Maroc';
  postalCode = '';
  sameBilling = true;
  saveInfo = false;
  phone = '';

  orderSubmitError = '';
  orderSubmitting = false;

  promoCodeInput = '';
  private readonly promoCodeActive = new BehaviorSubject<string | null>(null);

  // ── Stripe ────────────────────────────────────────────────────
  stripeError: string | null = null;
  paymentProcessing = false;
  paymentSuccess = false;

  private stripe: StripeInstance | null = null;
  private cardNumber: StripeElement | null = null;
  private cardExpiry: StripeElement | null = null;
  private cardCvc: StripeElement | null = null;
  private stripeReady = false;

  /** Style commun pour chaque Stripe Element */
  private readonly stripeStyle = {
    base: {
      fontFamily: "'Montserrat', system-ui, sans-serif",
      fontSize: '14px',
      color: '#2a1f1a',
      letterSpacing: '0.02em',
      '::placeholder': { color: '#9e9087' },
    },
    invalid: { color: '#c0392b', iconColor: '#c0392b' },
  };

  constructor(
    private readonly cart: CartService,
    private readonly loyalty: LoyaltyPointsService,
    private readonly userAuth: UserAuthService,
    private readonly ordersApi: OrdersApiService,
    private readonly promoPublic: PromoPublicService,
    private readonly siteLang: SiteLanguageService,
    private readonly http: HttpClient,
    readonly productRoutes: ProductRoutingHelper,
  ) {
    this.removedLines$ = this.cart.removedLines$;
    this.labels$ = this.siteLang.cartPageLabels$;
    this.checkoutVm$ = combineLatest([this.cart.lines$, this.promoCodeActive]).pipe(
      switchMap(([lines, promoCodeRaw]) => {
        const subtotal = this.cart.computeTotalDhs(lines);
        const shipping = this.shippingDhs;
        const promoCode = promoCodeRaw?.trim() || null;
        if (!promoCode || lines.length === 0) {
          return of({
            lines,
            subtotal,
            shipping,
            discount: 0,
            total: subtotal + shipping,
            promoInvalid: null as string | null,
            promoHint: null as string | null,
            codePromoForSubmit: null as string | null,
          });
        }
        return this.promoPublic.validate({ code: promoCode, sousTotalPanier: subtotal }).pipe(
          map((res) => ({
            lines,
            subtotal,
            shipping,
            discount: res.valide ? res.montantRemise : 0,
            total: subtotal - (res.valide ? res.montantRemise : 0) + shipping,
            promoInvalid: res.valide ? null : (res.message ?? 'Code non valide.'),
            promoHint: res.valide ? (res.description?.trim() || res.message || null) : null,
            codePromoForSubmit: res.valide ? promoCode : null,
          })),
          catchError(() =>
            of({
              lines,
              subtotal,
              shipping,
              discount: 0,
              total: subtotal + shipping,
              promoInvalid: 'Impossible de vérifier le code. Réessayez.',
              promoHint: null as string | null,
              codePromoForSubmit: null as string | null,
            }),
          ),
        );
      }),
    );
  }

  // ── Lifecycle ────────────────────────────────────────────────

  ngAfterViewInit(): void {
    // Stripe.js est chargé via CDN (defer) — on attend qu'il soit disponible
    this.waitForStripeAndMount();
  }

  ngOnDestroy(): void {
    this.cardNumber?.destroy();
    this.cardExpiry?.destroy();
    this.cardCvc?.destroy();
  }

  private waitForStripeAndMount(attempt = 0): void {
    if (typeof window === 'undefined') return;
    const StripeConstructor = window.Stripe;
    if (StripeConstructor) {
      this.stripe = StripeConstructor(STRIPE_PUBLISHABLE_KEY);
      this.mountStripeElements();
    } else if (attempt < 20) {
      setTimeout(() => this.waitForStripeAndMount(attempt + 1), 200);
    }
  }

  private mountStripeElements(): void {
    if (!this.stripe || this.stripeReady) return;
    const elements = this.stripe.elements({
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500&display=swap' }],
    });

    const numEl = document.getElementById('stripe-card-number');
    const expEl = document.getElementById('stripe-card-expiry');
    const cvcEl = document.getElementById('stripe-card-cvc');

    if (!numEl || !expEl || !cvcEl) {
      // Panneaux pas encore dans le DOM (tab non actif)
      setTimeout(() => this.mountStripeElements(), 300);
      return;
    }

    this.cardNumber = elements.create('cardNumber', { style: this.stripeStyle });
    this.cardNumber.mount('#stripe-card-number');

    this.cardExpiry = elements.create('cardExpiry', { style: this.stripeStyle });
    this.cardExpiry.mount('#stripe-card-expiry');

    this.cardCvc = elements.create('cardCvc', { style: this.stripeStyle });
    this.cardCvc.mount('#stripe-card-cvc');

    // Effacer l'erreur Stripe quand l'utilisateur modifie la carte
    const clearErr = (e: StripeElementEvent) => {
      if (e.error) {
        this.stripeError = e.error.message;
      } else {
        this.stripeError = null;
      }
    };
    this.cardNumber.on('change', clearErr);

    this.stripeReady = true;
  }

  // ── Onglet paiement ──────────────────────────────────────────

  setPaymentTab(id: PaymentTabId): void {
    this.paymentTab = id;
    if (id === 'card' && !this.stripeReady) {
      setTimeout(() => this.mountStripeElements(), 50);
    }
  }

  // ── Code promo ───────────────────────────────────────────────

  applyPromo(): void {
    const c = this.promoCodeInput.trim();
    this.promoCodeActive.next(c.length > 0 ? c : null);
  }

  removePromo(): void {
    this.promoCodeInput = '';
    this.promoCodeActive.next(null);
  }

  // ── Quantités ────────────────────────────────────────────────

  increment(line: CartLine): void {
    this.cart.setLineQuantity(line.lineId, line.quantity + 1);
  }

  decrement(line: CartLine): void {
    if (line.quantity <= 1) {
      this.cart.removeLine(line.lineId);
    } else {
      this.cart.setLineQuantity(line.lineId, line.quantity - 1);
    }
  }

  lineSubtotal(line: CartLine): number {
    return this.cart.lineSubtotalDhs(line);
  }

  restoreRemovedLine(line: CartLine): void {
    this.cart.restoreRemovedLine(line);
  }

  // ── Commander (enregistrement commande DB) ───────────────────

  commander(vm: CheckoutVm): void {
    this.orderSubmitError = '';
    if (vm.lines.length === 0) return;
    const user = this.userAuth.currentUser;
    if (!user?.id || !this.userAuth.getAccessToken()) {
      this.orderSubmitError = 'Connectez-vous pour valider votre commande.';
      this.userAuth.requestOpenLoginPanel();
      return;
    }
    if (this.orderSubmitting) return;
    this.orderSubmitting = true;
    this.ordersApi
      .create({
        lignes: vm.lines.map((l) => ({ produitId: l.productId, quantite: l.quantity })),
        fraisLivraison: vm.shipping,
        codePromo: vm.codePromoForSubmit ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.orderSubmitting = false;
          if (res.userPointsTotal != null) {
            this.loyalty.applyServerTotal(res.userPointsTotal, res.pointsGagnes);
            this.userAuth.syncStoredPointsTotal(res.userPointsTotal);
          } else {
            this.loyalty.applyServerTotal(this.loyalty.totalPoints + res.pointsGagnes, res.pointsGagnes);
          }
          this.removePromo();
          this.cart.clear();
        },
        error: (err: { error?: { message?: string } }) => {
          this.orderSubmitting = false;
          const msg = err?.error?.message;
          this.orderSubmitError =
            typeof msg === 'string' && msg.trim().length > 0
              ? msg
              : "Impossible d'enregistrer la commande. Vérifiez la connexion au serveur.";
        },
      });
  }

  // ── Payer maintenant (Stripe) ────────────────────────────────

  async payNow(vm: CheckoutVm): Promise<void> {
    if (this.paymentProcessing || this.paymentSuccess) return;
    if (vm.lines.length === 0) return;

    const user = this.userAuth.currentUser;
    if (!user?.id || !this.userAuth.getAccessToken()) {
      this.stripeError = 'Connectez-vous pour effectuer un paiement.';
      this.userAuth.requestOpenLoginPanel();
      return;
    }

    if (!this.stripe || !this.cardNumber) {
      this.stripeError = 'Le module de paiement n\'est pas encore prêt. Patientez quelques instants.';
      return;
    }

    this.stripeError = null;
    this.paymentProcessing = true;

    try {
      // 1. Créer un PaymentIntent côté backend
      const intentResp = await this.http
        .post<{ clientSecret: string }>(apiUrl('/api/payments/create-intent'), {
          amountEur: vm.total,
          codePromo: vm.codePromoForSubmit ?? null,
        })
        .toPromise();

      if (!intentResp?.clientSecret) {
        this.stripeError = 'Impossible d\'initialiser le paiement. Réessayez.';
        return;
      }

      // 2. Confirmer le paiement carte avec Stripe
      const result = await this.stripe.confirmCardPayment(intentResp.clientSecret, {
        payment_method: {
          card: this.cardNumber,
          billing_details: { name: this.nameOnCard.trim() || undefined },
        },
      });

      if (result.error) {
        this.stripeError = result.error.message ?? 'Paiement refusé. Vérifiez vos informations.';
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        // 3. Enregistrer la commande en base après confirmation paiement
        this.ordersApi
          .create({
            lignes: vm.lines.map((l) => ({ produitId: l.productId, quantite: l.quantity })),
            fraisLivraison: vm.shipping,
            codePromo: vm.codePromoForSubmit ?? undefined,
          })
          .subscribe({
            next: (res) => {
              if (res.userPointsTotal != null) {
                this.loyalty.applyServerTotal(res.userPointsTotal, res.pointsGagnes);
                this.userAuth.syncStoredPointsTotal(res.userPointsTotal);
              }
              this.removePromo();
              this.cart.clear();
              this.paymentSuccess = true;
            },
            error: () => {
              // Le paiement est accepté par Stripe mais l'enregistrement DB a échoué
              this.stripeError = 'Paiement accepté mais une erreur est survenue. Contactez le support.';
            },
          });
      }
    } catch {
      this.stripeError = 'Erreur réseau. Vérifiez votre connexion et réessayez.';
    } finally {
      this.paymentProcessing = false;
    }
  }
}
