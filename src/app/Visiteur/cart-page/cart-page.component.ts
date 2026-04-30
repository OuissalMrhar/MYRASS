import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../core/api-url';
import { environment } from '../../../environments/environment';
import { ProductRoutingHelper } from '../../core/product-routing.helper';
import { SiteLanguageService } from '../../core/site-language.service';
import { CartPageLabels } from '../../core/visitor-i18n';
import { CartLine, CartService } from '../../services/cart.service';
import { LoyaltyPointsService } from '../../services/loyalty-points.service';
import { OrdersApiService } from '../../services/orders-api.service';
import { UserAuthService } from '../../services/user-auth.service';

export type PaymentTabId = 'card' | 'eps' | 'giropay' | 'other';

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

  private readonly destroy$ = new Subject<void>();

  // ── Stripe ────────────────────────────────────────────────────
  stripeError: string | null = null;
  paymentProcessing = false;
  paymentSuccess = false;

  private stripe: StripeInstance | null = null;
  private cardNumber: StripeElement | null = null;
  private cardExpiry: StripeElement | null = null;
  private cardCvc: StripeElement | null = null;
  private stripeReady = false;
  private static stripeJsPromise: Promise<void> | null = null;

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
    private readonly siteLang: SiteLanguageService,
    private readonly http: HttpClient,
    readonly productRoutes: ProductRoutingHelper,
  ) {
    this.removedLines$ = this.cart.removedLines$;
    this.labels$ = this.siteLang.cartPageLabels$;
    this.checkoutVm$ = this.cart.lines$.pipe(
      map((lines) => {
        const subtotal = this.cart.computeTotalDhs(lines);
        const shipping = this.shippingDhs;
        return {
          lines,
          subtotal,
          shipping,
          discount: 0,
          total: subtotal + shipping,
        };
      }),
    );
  }

  // ── Lifecycle ────────────────────────────────────────────────

  ngAfterViewInit(): void {
    void this.waitForStripeAndMount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cardNumber?.destroy();
    this.cardExpiry?.destroy();
    this.cardCvc?.destroy();
  }

  private async waitForStripeAndMount(attempt = 0): Promise<void> {
    if (typeof window === 'undefined') return;
    await this.loadStripeJs();
    const StripeConstructor = window.Stripe;
    if (StripeConstructor) {
      this.stripe = StripeConstructor(environment.stripePublishableKey);
      this.mountStripeElements();
    } else if (attempt < 20) {
      setTimeout(() => {
        void this.waitForStripeAndMount(attempt + 1);
      }, 200);
    }
  }

  private loadStripeJs(): Promise<void> {
    if (window.Stripe) return Promise.resolve();
    if (CartPageComponent.stripeJsPromise) return CartPageComponent.stripeJsPromise;
    CartPageComponent.stripeJsPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-stripe-js="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('stripe-load-error')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-stripe-js', 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('stripe-load-error'));
      document.head.appendChild(script);
    });
    return CartPageComponent.stripeJsPromise;
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
      setTimeout(() => {
        void this.waitForStripeAndMount();
      }, 50);
    }
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
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.orderSubmitting = false;
          if (res.userPointsTotal != null) {
            this.loyalty.applyServerTotal(res.userPointsTotal, res.pointsGagnes);
            this.userAuth.syncStoredPointsTotal(res.userPointsTotal);
          } else {
            this.loyalty.applyServerTotal(this.loyalty.totalPoints + res.pointsGagnes, res.pointsGagnes);
          }
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
      const intentResp = await firstValueFrom(
        this.http.post<{ clientSecret: string }>(apiUrl('/api/payments/create-intent'), {
          amountEur: vm.total,
        })
      );

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
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              if (res.userPointsTotal != null) {
                this.loyalty.applyServerTotal(res.userPointsTotal, res.pointsGagnes);
                this.userAuth.syncStoredPointsTotal(res.userPointsTotal);
              }
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
