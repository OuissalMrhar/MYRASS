/* Déclaration de type pour Stripe.js chargé via CDN (https://js.stripe.com/v3/) */

interface StripeElementStyle {
  base?: Record<string, unknown>;
  invalid?: Record<string, unknown>;
  complete?: Record<string, unknown>;
  empty?: Record<string, unknown>;
}

interface StripeCardElementOptions {
  style?: StripeElementStyle;
  hidePostalCode?: boolean;
  placeholder?: string;
}

interface StripeElement {
  mount(selector: string | HTMLElement): void;
  unmount(): void;
  destroy(): void;
  on(event: string, handler: (e: StripeElementEvent) => void): void;
}

interface StripeElementEvent {
  error?: { message: string };
  complete?: boolean;
  empty?: boolean;
  brand?: string;
}

interface StripeElements {
  create(type: 'cardNumber', options?: StripeCardElementOptions): StripeElement;
  create(type: 'cardExpiry', options?: StripeCardElementOptions): StripeElement;
  create(type: 'cardCvc', options?: StripeCardElementOptions): StripeElement;
  create(type: string, options?: StripeCardElementOptions): StripeElement;
}

interface StripePaymentMethodCard {
  card: StripeElement;
  billing_details?: { name?: string; email?: string };
}

interface StripeConfirmCardPaymentData {
  payment_method: StripePaymentMethodCard;
}

interface StripePaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

interface StripeConfirmResult {
  paymentIntent?: StripePaymentIntent;
  error?: { message?: string; type?: string; code?: string };
}

interface StripeInstance {
  elements(options?: Record<string, unknown>): StripeElements;
  confirmCardPayment(
    clientSecret: string,
    data?: StripeConfirmCardPaymentData,
  ): Promise<StripeConfirmResult>;
}

interface Window {
  Stripe?: (publishableKey: string) => StripeInstance;
}
