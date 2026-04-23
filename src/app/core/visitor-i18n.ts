/** Libellés partagés pages visiteur (FR / EN / AR). */
export type SiteLang = 'fr' | 'en' | 'ar';

/**
 * Sélectionne le texte selon la langue.
 * Priorité : champ de la langue demandée → fallback FR → chaîne vide.
 */
export function pick(
  fr: string | null | undefined,
  en: string | null | undefined,
  ar: string | null | undefined,
  lang: SiteLang,
): string {
  if (lang === 'ar') return ar || fr || '';
  if (lang === 'en') return en || fr || '';
  return fr || '';
}

/** Variante pour objets de modèle (nom/nomEn/nomAr). */
export function pickField<T extends { nom?: string; nomEn?: string | null; nomAr?: string | null }>(
  obj: T | null | undefined,
  lang: SiteLang,
  field: 'nom' | 'description' | 'histoire' = 'nom',
): string {
  if (!obj) return '';
  const fr = (obj as Record<string, unknown>)[field] as string | null | undefined;
  const en = (obj as Record<string, unknown>)[`${field}En`] as string | null | undefined;
  const ar = (obj as Record<string, unknown>)[`${field}Ar`] as string | null | undefined;
  return pick(fr, en, ar, lang);
}

export interface NavLabels {
  home: string;
  product: string;
  whoWeAre: string;
  contact: string;
}

export interface FooterLabels {
  theHouse: string;
  shop: string;
  help: string;
  aboutUs: string;
  ourGuide: string;
  guideProducts: string;
  collections: string;
  corporateGifts: string;
  deliveryReturns: string;
  contact: string;
  faq: string;
  followTag: string;
  privacyPolicy: string;
  copyright: string;
}

export interface ProfileMenuLabels {
  menuTitle: string;
  close: string;
  myAccountSubtitle: string;
  loyaltyLabel: string;
  myOrders: string;
  logout: string;
  guestTitle: string;
  guestSubtitle: string;
  login: string;
  createAccount: string;
}

export const NAV_LABELS: Record<SiteLang, NavLabels> = {
  fr: {
    home: 'ACCUEIL',
    product: 'PRODUITS',
    whoWeAre: 'NOTRE HISTOIRE',
    contact: 'CONTACT',
  },
  en: {
    home: 'HOME',
    product: 'PRODUCTS',
    whoWeAre: 'OUR STORY',
    contact: 'CONTACT',
  },
  ar: {
    home: 'الرئيسية',
    product: 'منتجات',
    whoWeAre: 'قصتنا',
    contact: 'اتصل بنا',
  },
};

export const FOOTER_LABELS: Record<SiteLang, FooterLabels> = {
  fr: {
    theHouse: 'La Maison',
    shop: 'Boutique',
    help: 'Aide',
    aboutUs: 'À propos',
    ourGuide: 'Notre guide',
    guideProducts: 'Guide produits',
    collections: 'Produits',
    corporateGifts: "Cadeaux d'entreprise",
    deliveryReturns: 'Livraison & retours',
    contact: 'Contact',
    faq: 'FAQ',
    followTag: 'Suivez #Myrass',
    privacyPolicy: 'Politique de confidentialité',
    copyright: 'Copyright ©2026, Myrass',
  },
  ar: {
    theHouse: 'الدار',
    shop: 'المتجر',
    help: 'مساعدة',
    aboutUs: 'من نحن',
    ourGuide: 'دليلنا',
    guideProducts: 'دليل المنتجات',
    collections: 'منتجات',
    corporateGifts: 'هدايا الشركات',
    deliveryReturns: 'التوصيل والإرجاع',
    contact: 'اتصل بنا',
    faq: 'الأسئلة الشائعة',
    followTag: 'تابعوا #Myrass',
    privacyPolicy: 'سياسة الخصوصية',
    copyright: 'Copyright ©2026, Myrass',
  },
  en: {
    theHouse: 'The House',
    shop: 'Shop',
    help: 'Help',
    aboutUs: 'About Us',
    ourGuide: 'Our Guide',
    guideProducts: 'Guide Products',
    collections: 'Products',
    corporateGifts: 'Corporate Gifts',
    deliveryReturns: 'Delivery & Returns',
    contact: 'Contact',
    faq: 'FAQ',
    followTag: 'Follow #Myrass',
    privacyPolicy: 'Privacy Policy',
    copyright: 'Copyright ©2026, Myrass',
  },
};

export interface HomeLabels {
  heroTitle: string;
  heroSubtitle: string;
  sectionSubtitle: string;
  storyTitle: string;
  storyBody: string;
  readMore: string;
  readLess: string;
  guideTitle: string;
  productsTitle: string;
  bestsellersTitle: string;
  bestSellerBadge: string;
  giftsTitle: string;
  viewGift: string;
  loading: string;
  newsletterTitle: string;
  newsletterDesc: string;
  newsletterPlaceholder: string;
  newsletterBtn: string;
  partnerTitle: string;
  partnerDesc: string;
  availableSoon: string;
  from: string;
}

export const HOME_LABELS: Record<SiteLang, HomeLabels> = {
  fr: {
    heroTitle: 'Savourez plus avec Myrass',
    heroSubtitle: 'Pour chaque repas partagé, chaque instant d\'exception.',
    sectionSubtitle: "Myrass sélectionne des produits d'exception issus du terroir marocain afin d'offrir une expérience raffinée, authentique et mémorable",
    storyTitle: 'L\'exigence du terroir Marocain',
    storyBody: 'Depuis les oliveraies centenaires de Meknès aux ruelles aromatiques des souks de Marrakech, chaque produit Myrass est le fruit d\'une sélection rigoureuse. Nous collaborons directement avec des producteurs locaux qui perpétuent des savoir-faire ancestraux, garantissant des saveurs authentiques et des méthodes de production respectueuses de l\'environnement et des traditions.',
    readMore: 'Voir plus',
    readLess: 'Voir moins',
    guideTitle: 'Le guide des produits d\'exception du terroir marocain',
    productsTitle: 'Nos produits',
    bestsellersTitle: 'Meilleures ventes',
    bestSellerBadge: 'Best-seller',
    giftsTitle: 'Packs cadeaux',
    viewGift: 'Voir',
    loading: 'Chargement…',
    newsletterTitle: 'Get more and connect.',
    newsletterDesc: 'Abonnez-vous pour recevoir nos nouveautés, offres exclusives et actualités Myrass.',
    newsletterPlaceholder: 'Votre adresse e-mail',
    newsletterBtn: 'S\'abonner',
    partnerTitle: 'Partenariat & collaboration',
    partnerDesc: 'Vous souhaitez référencer vos produits ou collaborer avec Myrass ? Contactez-nous.',
    availableSoon: 'Bientôt disponible',
    from: 'À partir de',
  },
  en: {
    heroTitle: 'Savour more with Myrass',
    heroSubtitle: 'For every shared meal, every exceptional moment.',
    sectionSubtitle: 'Myrass selects exceptional products from Moroccan terroir to offer a refined, authentic and memorable experience',
    storyTitle: 'The excellence of Moroccan terroir',
    storyBody: 'From the century-old olive groves of Meknes to the aromatic alleys of Marrakech\'s souks, every Myrass product is the result of rigorous selection. We work directly with local producers who carry on ancestral know-how, guaranteeing authentic flavours and environmentally respectful production methods.',
    readMore: 'Read more',
    readLess: 'Read less',
    guideTitle: 'The guide to exceptional Moroccan terroir products',
    productsTitle: 'Our products',
    bestsellersTitle: 'Best sellers',
    bestSellerBadge: 'Best-seller',
    giftsTitle: 'Gift packs',
    viewGift: 'View',
    loading: 'Loading…',
    newsletterTitle: 'Get more and connect.',
    newsletterDesc: 'Subscribe to receive our latest news, exclusive offers and Myrass updates.',
    newsletterPlaceholder: 'Your email address',
    newsletterBtn: 'Subscribe',
    partnerTitle: 'Partnership & collaboration',
    partnerDesc: 'Want to list your products or collaborate with Myrass? Get in touch.',
    availableSoon: 'Coming soon',
    from: 'From',
  },
  ar: {
    heroTitle: 'استمتع بالمزيد مع Myrass',
    heroSubtitle: 'لكل وجبة مشتركة، لكل لحظة استثنائية.',
    sectionSubtitle: 'تنتقي Myrass منتجات استثنائية من أرض المغرب لتقديم تجربة راقية وأصيلة ولا تُنسى',
    storyTitle: 'تميّز أرض المغرب',
    storyBody: 'من بساتين الزيتون المعمّرة في مكناس إلى أزقة أسواق مراكش العطرة، كل منتج من Myrass هو ثمرة انتقاء دقيق. نعمل مباشرة مع منتجين محليين يحافظون على الموروث الحضاري، ضامنين نكهات أصيلة وأساليب إنتاج محترمة للبيئة والتقاليد.',
    readMore: 'اقرأ المزيد',
    readLess: 'اقرأ أقل',
    guideTitle: 'دليل منتجات الأرض المغربية الاستثنائية',
    productsTitle: 'منتجاتنا',
    bestsellersTitle: 'الأكثر مبيعاً',
    bestSellerBadge: 'الأكثر مبيعاً',
    giftsTitle: 'حزم الهدايا',
    viewGift: 'عرض',
    loading: 'تحميل…',
    newsletterTitle: 'تواصل معنا واحصل على المزيد.',
    newsletterDesc: 'اشترك لتتلقى آخر أخبارنا وعروضنا الحصرية ومستجدات Myrass.',
    newsletterPlaceholder: 'بريدك الإلكتروني',
    newsletterBtn: 'اشترك',
    partnerTitle: 'شراكة وتعاون',
    partnerDesc: 'هل تريد إدراج منتجاتك أو التعاون مع Myrass؟ تواصل معنا.',
    availableSoon: 'قريباً',
    from: 'ابتداءً من',
  },
};

/* ─────────────────────────────────────────────────────────────────
   Cart Drawer labels
───────────────────────────────────────────────────────────────── */
export interface CartDrawerLabels {
  title: string;
  article: string;
  articles: string;
  empty: string;
  type: string;
  category: string;
  addFav: string;
  removeFav: string;
  decrease: string;
  removeFromCart: string;
  increase: string;
  total: string;
  validate: string;
  viewCart: string;
}

export const CART_DRAWER_LABELS: Record<SiteLang, CartDrawerLabels> = {
  fr: {
    title: 'Mon panier', article: 'article', articles: 'articles',
    empty: 'Votre panier est vide.', type: 'Type', category: 'Catégorie',
    addFav: 'Ajouter aux favoris', removeFav: 'Retirer des favoris',
    decrease: 'Diminuer', removeFromCart: 'Retirer du panier', increase: 'Augmenter',
    total: 'Total', validate: 'Valider mon panier', viewCart: 'Voir mon panier',
  },
  en: {
    title: 'My cart', article: 'item', articles: 'items',
    empty: 'Your cart is empty.', type: 'Type', category: 'Category',
    addFav: 'Add to favorites', removeFav: 'Remove from favorites',
    decrease: 'Decrease', removeFromCart: 'Remove from cart', increase: 'Increase',
    total: 'Total', validate: 'View cart', viewCart: 'View my cart',
  },
  ar: {
    title: 'سلة التسوق', article: 'عنصر', articles: 'عناصر',
    empty: 'سلتك فارغة.', type: 'النوع', category: 'الفئة',
    addFav: 'إضافة للمفضلة', removeFav: 'إزالة من المفضلة',
    decrease: 'تقليل', removeFromCart: 'إزالة من السلة', increase: 'زيادة',
    total: 'المجموع', validate: 'عرض السلة', viewCart: 'عرض سلتي',
  },
};

/* ─────────────────────────────────────────────────────────────────
   Cart Page (checkout) labels
───────────────────────────────────────────────────────────────── */
export interface CartPageLabels {
  cartTitle: string; emptyText: string; backToShop: string;
  sizeVolume: string; category: string; catalogue: string; type: string;
  promoTitle: string; promoHint: string; apply: string; removePromo: string;
  promoComingSoon: string;
  subtotalItems: string; discount: string; shipping: string; total: string;
  order: string; ordering: string;
  payment: string; card: string; cardNumber: string; expiry: string; cvc: string;
  country: string; postalCode: string; nameOnCard: string;
  sameBilling: string; payWith: string; saveInfo: string;
  phone: string; phoneHint: string; payNow: string;
  privacyPolicy: string; delivery: string; privacy: string; terms: string;
  recentlyRemovedKicker: string; recentlyRemovedTitle: string; restore: string;
  article: string; articles: string;
  loyaltyTitle: string; loyaltyComingSoon: string; loyaltyRule: string;
}

export const CART_PAGE_LABELS: Record<SiteLang, CartPageLabels> = {
  fr: {
    cartTitle: 'Mon panier', emptyText: 'Votre panier est vide.', backToShop: 'Retour à la boutique',
    sizeVolume: 'Taille / volume', category: 'Catégorie', catalogue: 'Catalogue', type: 'Type',
    promoTitle: 'Code promo', promoHint: 'Saisissez un code administré dans l\'espace super-admin, puis validez.',
    apply: 'Appliquer', removePromo: 'Retirer', promoComingSoon: 'Bientôt disponible',
    subtotalItems: 'Sous-total :', discount: 'Remise (code promo) :', shipping: 'Livraison :', total: 'Total :',
    order: 'Commander', ordering: 'Enregistrement…',
    payment: 'Paiement', card: 'Carte', cardNumber: 'Numéro de carte', expiry: 'Expiration', cvc: 'CVC',
    country: 'Pays', postalCode: 'Code postal', nameOnCard: 'Nom sur la carte',
    sameBilling: 'Utiliser l\'adresse de livraison comme adresse de facturation',
    payWith: 'Payer avec', saveInfo: 'Enregistrer mes informations pour un paiement plus rapide',
    phone: 'Téléphone', phoneHint: 'Nous vous contacterons uniquement au sujet de votre commande.',
    payNow: 'Payer maintenant',
    privacyPolicy: 'Politique de remboursement', delivery: 'Livraison', privacy: 'Confidentialité', terms: 'Conditions d\'utilisation',
    recentlyRemovedKicker: 'Historique', recentlyRemovedTitle: 'Récemment retirés', restore: '+ Remettre au panier',
    article: 'article', articles: 'articles',
    loyaltyTitle: 'Points de fidélité',
    loyaltyComingSoon: 'Les points de fidélité seront bientôt disponibles.',
    loyaltyRule: 'Règle future : 0,1 point gagné pour chaque 100 MAD dépensés.',
  },
  en: {
    cartTitle: 'My cart', emptyText: 'Your cart is empty.', backToShop: 'Back to shop',
    sizeVolume: 'Size / volume', category: 'Category', catalogue: 'Catalogue', type: 'Type',
    promoTitle: 'Promo code', promoHint: 'Enter a promo code, then apply.',
    apply: 'Apply', removePromo: 'Remove', promoComingSoon: 'Available soon',
    subtotalItems: 'Subtotal:', discount: 'Discount (promo code):', shipping: 'Shipping:', total: 'Total:',
    order: 'Place order', ordering: 'Processing…',
    payment: 'Payment', card: 'Card', cardNumber: 'Card number', expiry: 'Expiry', cvc: 'CVC',
    country: 'Country', postalCode: 'Postal code', nameOnCard: 'Name on card',
    sameBilling: 'Use shipping address as billing address',
    payWith: 'Pay with', saveInfo: 'Save my information for faster checkout',
    phone: 'Phone', phoneHint: 'We will only contact you about your order.',
    payNow: 'Pay now',
    privacyPolicy: 'Refund policy', delivery: 'Shipping', privacy: 'Privacy', terms: 'Terms of service',
    recentlyRemovedKicker: 'History', recentlyRemovedTitle: 'Recently removed', restore: '+ Restore to cart',
    article: 'item', articles: 'items',
    loyaltyTitle: 'Loyalty points',
    loyaltyComingSoon: 'Loyalty points will be available soon.',
    loyaltyRule: 'Future rule: earn 0.1 point for every 100 MAD spent.',
  },
  ar: {
    cartTitle: 'سلة التسوق', emptyText: 'سلتك فارغة.', backToShop: 'العودة للمتجر',
    sizeVolume: 'الحجم / المقاس', category: 'الفئة', catalogue: 'الكتالوج', type: 'النوع',
    promoTitle: 'كود خصم', promoHint: 'أدخل كود الخصم ثم طبّق.',
    apply: 'تطبيق', removePromo: 'إزالة',
    subtotalItems: 'المجموع الفرعي:', discount: 'الخصم (كود خصم):', shipping: 'التوصيل:', total: 'المجموع:',
    order: 'تأكيد الطلب', ordering: 'جارٍ المعالجة…',
    payment: 'الدفع', card: 'بطاقة', cardNumber: 'رقم البطاقة', expiry: 'انتهاء الصلاحية', cvc: 'رمز CVC',
    country: 'البلد', postalCode: 'الرمز البريدي', nameOnCard: 'الاسم على البطاقة',
    sameBilling: 'استخدام عنوان التوصيل كعنوان للفواتير',
    payWith: 'ادفع بواسطة', saveInfo: 'حفظ معلوماتي لدفع أسرع',
    phone: 'الهاتف', phoneHint: 'سنتواصل معك فقط بشأن طلبك.',
    payNow: 'ادفع الآن',
    privacyPolicy: 'سياسة الاسترداد', delivery: 'التوصيل', privacy: 'الخصوصية', terms: 'شروط الاستخدام',
    recentlyRemovedKicker: 'السجل', recentlyRemovedTitle: 'أُزيلت مؤخراً', restore: '+ إعادة للسلة',
    article: 'عنصر', articles: 'عناصر',
    promoComingSoon: 'قريباً',
    loyaltyTitle: 'نقاط الولاء',
    loyaltyComingSoon: 'نقاط الولاء ستكون متاحة قريباً.',
    loyaltyRule: 'القاعدة المستقبلية: 0.1 نقطة لكل 100 درهم يُنفق.',
  },
};

/* ─────────────────────────────────────────────────────────────────
   Favorites Page labels
───────────────────────────────────────────────────────────────── */
export interface FavoritesLabels {
  guestTitle: string; loginBtn: string;
  loggedTitle: string;
  empty: string; discoverBtn: string;
  removeFav: string; addToCart: string; addedToCart: string;
}

export const FAVORITES_LABELS: Record<SiteLang, FavoritesLabels> = {
  fr: {
    guestTitle: 'Créer une liste d\'envies', loginBtn: 'Se connecter',
    loggedTitle: 'Votre liste d\'envies',
    empty: 'Vous n\'avez pas encore ajouté de favoris.', discoverBtn: 'Découvrir nos produits',
    removeFav: 'Retirer des favoris', addToCart: 'Ajouter au panier', addedToCart: 'Ajouté au panier',
  },
  en: {
    guestTitle: 'Create a wishlist', loginBtn: 'Sign in',
    loggedTitle: 'Your wishlist',
    empty: 'You haven\'t added any favorites yet.', discoverBtn: 'Discover our products',
    removeFav: 'Remove from favorites', addToCart: 'Add to cart', addedToCart: 'Added to cart',
  },
  ar: {
    guestTitle: 'إنشاء قائمة أمنيات', loginBtn: 'تسجيل الدخول',
    loggedTitle: 'قائمة أمنياتك',
    empty: 'لم تضف أي منتج للمفضلة بعد.', discoverBtn: 'اكتشف منتجاتنا',
    removeFav: 'إزالة من المفضلة', addToCart: 'أضف للسلة', addedToCart: 'أُضيف للسلة',
  },
};

/* ─────────────────────────────────────────────────────────────────
   My Orders Page labels
───────────────────────────────────────────────────────────────── */
export interface OrdersLabels {
  title: string; subtitle: string;
  empty: string; emptyHint: string; seeProducts: string; goToCart: string;
  orderId: string; products: string;
  qty: string; subtotalItems: string; discount: string; shipping: string; total: string;
  loyaltyPt: string; loyaltyPts: string;
  statusPending: string; statusConfirmed: string;
  guestTitle: string; guestText: string; signIn: string; backHome: string;
}

export const ORDERS_LABELS: Record<SiteLang, OrdersLabels> = {
  fr: {
    title: 'Mes commandes', subtitle: 'Historique enregistré sur votre compte (serveur).',
    empty: 'Vous n\'avez pas encore de commande enregistrée.',
    emptyHint: 'Validez un panier (bouton Commander) pour créer une commande en base.',
    seeProducts: 'Voir les produits', goToCart: 'Aller au panier',
    orderId: 'Commande n°', products: 'Produits commandés',
    qty: 'Qté', subtotalItems: 'Sous-total articles', discount: 'Remise', shipping: 'Livraison', total: 'Total',
    loyaltyPt: 'pt fidélité', loyaltyPts: 'pts fidélité',
    statusPending: 'En attente', statusConfirmed: 'Confirmée',
    guestTitle: 'Mes commandes', guestText: 'Connectez-vous pour consulter l\'historique de vos commandes.',
    signIn: 'Se connecter', backHome: 'Retour à l\'accueil',
  },
  en: {
    title: 'My orders', subtitle: 'Order history saved on your account.',
    empty: 'You have no orders yet.',
    emptyHint: 'Check out a cart to create an order.',
    seeProducts: 'See products', goToCart: 'Go to cart',
    orderId: 'Order #', products: 'Ordered products',
    qty: 'Qty', subtotalItems: 'Items subtotal', discount: 'Discount', shipping: 'Shipping', total: 'Total',
    loyaltyPt: 'loyalty pt', loyaltyPts: 'loyalty pts',
    statusPending: 'Pending', statusConfirmed: 'Confirmed',
    guestTitle: 'My orders', guestText: 'Sign in to view your order history.',
    signIn: 'Sign in', backHome: 'Back to home',
  },
  ar: {
    title: 'طلباتي', subtitle: 'سجل الطلبات المحفوظ على حسابك.',
    empty: 'لا توجد طلبات مسجلة بعد.',
    emptyHint: 'أتمّ سلة تسوق لإنشاء طلب.',
    seeProducts: 'مشاهدة المنتجات', goToCart: 'الذهاب للسلة',
    orderId: 'الطلب رقم', products: 'المنتجات المطلوبة',
    qty: 'الكمية', subtotalItems: 'مجموع المنتجات', discount: 'الخصم', shipping: 'التوصيل', total: 'المجموع',
    loyaltyPt: 'نقطة ولاء', loyaltyPts: 'نقاط ولاء',
    statusPending: 'في الانتظار', statusConfirmed: 'مؤكد',
    guestTitle: 'طلباتي', guestText: 'سجّل الدخول لعرض سجل طلباتك.',
    signIn: 'تسجيل الدخول', backHome: 'العودة للرئيسية',
  },
};

/* ─────────────────────────────────────────────────────────────────
   Auth (Login + Register) labels
───────────────────────────────────────────────────────────────── */
export interface AuthLabels {
  // Login
  loginTitle: string; requiredFields: string;
  emailLabel: string; passwordLabel: string; forgotPw: string;
  loginLinkHint: string; loginLinkAction: string;
  loginBtn: string; logging: string;
  newClient: string; newClientDesc: string; createAccount: string;
  orDivider: string; haveAccount: string;
  googleLogin: string; facebookLogin: string;
  // Register
  registerRequiredFields: string;
  googleRegister: string; facebookRegister: string;
  genderLabel: string; nameLabel: string;
  emailRegLabel: string; emailPlaceholder: string;
  passwordRegLabel: string; confirmLabel: string;
  phoneLabel: string;
  dobLabel: string;
  continueBtn: string; activationText: string;
  // Errors / validation
  emailRequired: string; emailInvalid: string;
  passwordRequired: string; passwordMin: string; passwordMin8: string;
  confirmRequired: string; passwordMismatch: string;
  genderRequired: string; nameRequired: string; phoneRequired: string; dobRequired: string;
}

export const AUTH_LABELS: Record<SiteLang, AuthLabels> = {
  fr: {
    loginTitle: 'Login', requiredFields: 'Champs obligatoires*',
    emailLabel: 'E-mail*', passwordLabel: 'Mot de passe*', forgotPw: 'Mot de passe oublié ?',
    loginLinkHint: 'Ou utilisez un lien de connexion unique pour vous connecter :',
    loginLinkAction: 'Envoyer le lien par email',
    loginBtn: 'M\'identifier', logging: 'Connexion...',
    newClient: 'Nouveau Client', newClientDesc: 'Créez votre espace Myrass pour une expérience personnalisée.',
    createAccount: 'Créer mon compte', orDivider: 'Ou', haveAccount: 'J\'ai déjà un Compte',
    googleLogin: 'Se connecter avec Google', facebookLogin: 'Se connecter avec Facebook',
    registerRequiredFields: 'Champs obligatoires *',
    googleRegister: 'Continuer avec Google', facebookRegister: 'Continuer avec Facebook',
    genderLabel: 'Genre *', nameLabel: 'Nom *',
    emailRegLabel: 'E-mail *', emailPlaceholder: 'vous@exemple.com',
    passwordRegLabel: 'Mot de passe *', confirmLabel: 'Confirmation *',
    phoneLabel: 'Téléphone *',
    dobLabel: 'Date de naissance *',
    continueBtn: 'Continuer',
    activationText: 'Vous allez recevoir un code d\'activation par e-mail afin de valider la création de votre compte.',
    emailRequired: 'Email valide requis.', emailInvalid: 'Email invalide',
    passwordRequired: 'Mot de passe requis (minimum 6 caractères).', passwordMin: 'Minimum 8 caractères (exigence du serveur)', passwordMin8: 'Minimum 8 caractères',
    confirmRequired: 'Confirmation requise', passwordMismatch: 'Les mots de passe ne correspondent pas',
    genderRequired: 'Le titre est requis', nameRequired: 'Le nom est requis',
    phoneRequired: 'Le téléphone est requis', dobRequired: 'La date de naissance est requise',
  },
  en: {
    loginTitle: 'Login', requiredFields: 'Required fields*',
    emailLabel: 'E-mail*', passwordLabel: 'Password*', forgotPw: 'Forgot password?',
    loginLinkHint: 'Or use a magic link to sign in:',
    loginLinkAction: 'Send link by email',
    loginBtn: 'Sign in', logging: 'Signing in...',
    newClient: 'New Customer', newClientDesc: 'Create your Myrass account for a personalised experience.',
    createAccount: 'Create account', orDivider: 'Or', haveAccount: 'I already have an account',
    googleLogin: 'Sign in with Google', facebookLogin: 'Sign in with Facebook',
    registerRequiredFields: 'Required fields *',
    googleRegister: 'Continue with Google', facebookRegister: 'Continue with Facebook',
    genderLabel: 'Title *', nameLabel: 'Name *',
    emailRegLabel: 'E-mail *', emailPlaceholder: 'you@example.com',
    passwordRegLabel: 'Password *', confirmLabel: 'Confirm password *',
    phoneLabel: 'Phone *',
    dobLabel: 'Date of birth *',
    continueBtn: 'Continue',
    activationText: 'You will receive an activation code by email to validate the creation of your account.',
    emailRequired: 'Valid email required.', emailInvalid: 'Invalid email',
    passwordRequired: 'Password required (minimum 6 characters).', passwordMin: 'Minimum 8 characters (server requirement)', passwordMin8: 'Minimum 8 characters',
    confirmRequired: 'Confirmation required', passwordMismatch: 'Passwords do not match',
    genderRequired: 'Title is required', nameRequired: 'Name is required',
    phoneRequired: 'Phone is required', dobRequired: 'Date of birth is required',
  },
  ar: {
    loginTitle: 'تسجيل الدخول', requiredFields: 'الحقول المطلوبة*',
    emailLabel: 'البريد الإلكتروني*', passwordLabel: 'كلمة المرور*', forgotPw: 'نسيت كلمة المرور؟',
    loginLinkHint: 'أو استخدم رابط الدخول السحري:',
    loginLinkAction: 'إرسال الرابط بالبريد',
    loginBtn: 'تسجيل الدخول', logging: 'جارٍ الدخول...',
    newClient: 'عميل جديد', newClientDesc: 'أنشئ حسابك على Myrass لتجربة مخصصة.',
    createAccount: 'إنشاء حساب', orDivider: 'أو', haveAccount: 'لدي حساب بالفعل',
    googleLogin: 'الدخول بحساب Google', facebookLogin: 'الدخول بحساب Facebook',
    registerRequiredFields: 'الحقول المطلوبة *',
    googleRegister: 'متابعة بحساب Google', facebookRegister: 'متابعة بحساب Facebook',
    genderLabel: 'اللقب *', nameLabel: 'الاسم *',
    emailRegLabel: 'البريد الإلكتروني *', emailPlaceholder: 'you@example.com',
    passwordRegLabel: 'كلمة المرور *', confirmLabel: 'تأكيد كلمة المرور *',
    phoneLabel: 'الهاتف *',
    dobLabel: 'تاريخ الميلاد *',
    continueBtn: 'متابعة',
    activationText: 'ستتلقى رمز تفعيل عبر البريد الإلكتروني لتأكيد إنشاء حسابك.',
    emailRequired: 'بريد إلكتروني صحيح مطلوب.', emailInvalid: 'بريد إلكتروني غير صحيح',
    passwordRequired: 'كلمة المرور مطلوبة (6 أحرف على الأقل).', passwordMin: 'الحد الأدنى 8 أحرف (اشتراط الخادم)', passwordMin8: 'الحد الأدنى 8 أحرف',
    confirmRequired: 'التأكيد مطلوب', passwordMismatch: 'كلمتا المرور غير متطابقتين',
    genderRequired: 'اللقب مطلوب', nameRequired: 'الاسم مطلوب',
    phoneRequired: 'الهاتف مطلوب', dobRequired: 'تاريخ الميلاد مطلوب',
  },
};

/* ─────────────────────────────────────────────────────────────────
   Products Page labels
───────────────────────────────────────────────────────────────── */
export interface ProduitPageLabels {
  heroKicker: string; heroTitle: string; heroSubtitle: string;
  filtersBtn: string; allTypes: string; inactive: string; noMatch: string;
  historique: string; recentlyViewed: string;
  giftKicker: string; giftTitle: string; giftText: string; viewBtn: string;
  filterTitle: string; byCategory: string; byPrice: string; byDelivery: string;
  noCatalogue: string; comingSoon: string; showProducts: string;
  available: string; outOfStock: string; comingUp: string;
  sortBy: string;
  recommended: string; topRated: string; bestSellers: string;
  newProducts: string; priceAsc: string; priceDesc: string;
  homeDelivery: string; clickCollect: string; messenger: string;
}

export const PRODUIT_PAGE_LABELS: Record<SiteLang, ProduitPageLabels> = {
  fr: {
    heroKicker: 'Collection', heroTitle: 'Nos Produits',
    heroSubtitle: 'Offrez l\'excellence du terroir marocain avec nos coffrets Myrass. Découvrez la richesse des plus beaux trésors naturels du Maroc.',
    filtersBtn: 'Filtres', allTypes: 'Tous les types', inactive: '(inactif)', noMatch: 'Aucun produit ne correspond à ces filtres.',
    historique: 'Historique', recentlyViewed: 'Consulté récemment',
    giftKicker: '❤ Cadeaux', giftTitle: 'CADEAUX POUR QUELQU\'UN DE SPÉCIAL',
    giftText: 'Certains moments méritent un geste sincère. Nos coffrets cadeaux Myrass offrent une façon raffinée d\'exprimer gratitude, amitié ou affection — avec de délicieux produits gourmets marocains soigneusement sélectionnés.',
    viewBtn: 'VOIR',
    filterTitle: 'FILTRES', byCategory: 'PAR CATÉGORIE', byPrice: 'PAR PRIX', byDelivery: 'PAR LIVRAISON',
    noCatalogue: 'Aucun catalogue.', comingSoon: 'Bientôt disponible', showProducts: 'VOIR LES PRODUITS',
    available: 'Disponible', outOfStock: 'Rupture de stock', comingUp: 'À venir',
    sortBy: 'Trier par',
    recommended: 'Recommandé', topRated: 'Les mieux notés', bestSellers: 'Meilleures ventes',
    newProducts: 'Nouveaux produits', priceAsc: 'Prix croissant', priceDesc: 'Prix décroissant',
    homeDelivery: 'Livraison à domicile', clickCollect: 'Click & collect', messenger: 'Messagerie (Paris et périphérie)',
  },
  en: {
    heroKicker: 'Collection', heroTitle: 'Our Products',
    heroSubtitle: 'Offer the excellence of Moroccan heritage with our MYRASS gift sets. Discover the richness of Morocco\'s finest natural treasures.',
    filtersBtn: 'Filters', allTypes: 'All types', inactive: '(inactive)', noMatch: 'No products match these filters.',
    historique: 'History', recentlyViewed: 'Recently viewed',
    giftKicker: '❤ Gifts', giftTitle: 'GIFTS FOR SOMEONE SPECIAL',
    giftText: 'Some moments deserve a meaningful gesture. Our MYRASS gift collections offer a refined way to express appreciation, friendship, or affection — featuring carefully selected Moroccan gourmet products.',
    viewBtn: 'VIEW',
    filterTitle: 'FILTERS', byCategory: 'BY CATEGORY', byPrice: 'BY PRICE', byDelivery: 'BY DELIVERY',
    noCatalogue: 'No catalogue.', comingSoon: 'Coming soon', showProducts: 'VIEW PRODUCTS',
    available: 'Available', outOfStock: 'Out of stock', comingUp: 'Coming soon',
    sortBy: 'Sort by',
    recommended: 'Recommended', topRated: 'Top rated', bestSellers: 'Best sellers',
    newProducts: 'New products', priceAsc: 'Price ascending', priceDesc: 'Price descending',
    homeDelivery: 'Home delivery', clickCollect: 'Click & collect', messenger: 'Courier (Paris area)',
  },
  ar: {
    heroKicker: 'مجموعة', heroTitle: 'منتجاتنا',
    heroSubtitle: 'قدّم تميّز التراث المغربي مع مجموعات Myrass الهدية. اكتشف ثراء أجمل الكنوز الطبيعية المغربية.',
    filtersBtn: 'الفلاتر', allTypes: 'جميع الأنواع', inactive: '(غير نشط)', noMatch: 'لا توجد منتجات تطابق هذه الفلاتر.',
    historique: 'السجل', recentlyViewed: 'شوهد مؤخراً',
    giftKicker: '❤ هدايا', giftTitle: 'هدايا لشخص مميز',
    giftText: 'بعض اللحظات تستحق لفتة مميزة. تقدم مجموعات هدايا Myrass طريقة راقية للتعبير عن التقدير والصداقة والمحبة — مع منتجات مغربية لذيذة مختارة بعناية.',
    viewBtn: 'عرض',
    filterTitle: 'الفلاتر', byCategory: 'حسب الفئة', byPrice: 'حسب السعر', byDelivery: 'حسب التوصيل',
    noCatalogue: 'لا يوجد كتالوج.', comingSoon: 'قريباً', showProducts: 'عرض المنتجات',
    available: 'متاح', outOfStock: 'نفد المخزون', comingUp: 'قريباً',
    sortBy: 'ترتيب حسب',
    recommended: 'موصى به', topRated: 'الأعلى تقييماً', bestSellers: 'الأكثر مبيعاً',
    newProducts: 'منتجات جديدة', priceAsc: 'السعر تصاعدياً', priceDesc: 'السعر تنازلياً',
    homeDelivery: 'توصيل للمنزل', clickCollect: 'استلام من المتجر', messenger: 'مراسلة (منطقة باريس)',
  },
};

/* ─────────────────────────────────────────────────────────────────
   Details Gift page labels
───────────────────────────────────────────────────────────────── */
export interface DetailsGiftLabels {
  loading: string;
  notFound: string;
  loadError: string;
  back: string;
  homeLink: string;
  breadcrumbPack: string;
  heroKicker: string;
  reviewsUnit: string;
  addToCart: string;
  details: string;
  shipping: string;
  shippingText: string;
  packProducts: string;
  noReviews: string;
  commentsTitle: string;
  reviewsPublished: string;
  deleteBtn: string;
  deleteConfirm: string;
  yourReview: string;
  reviewHintLoggedIn: string;
  reviewHintGuest: string;
  commentLabel: string;
  commentPlaceholder: string;
  alreadyCommented: string;
  submitBtn: string;
  continueShopping: string;
  close: string;
  thankYouNoteTitle: string;
  thankYouNoteSubtitle: string;
  thankYouCommentTitle: string;
  thankYouCommentSubtitle: string;
  thankYouCommentSubtitleWithName: string;
  thankYouAvisTitle: string;
  thankYouAvisSubtitle: string;
  thankYouAvisSubtitleWithName: string;
}

export const DETAILS_GIFT_LABELS: Record<SiteLang, DetailsGiftLabels> = {
  fr: {
    loading: 'Chargement du pack…',
    notFound: 'Pack introuvable.',
    loadError: 'Erreur lors du chargement du pack.',
    back: 'Retour',
    homeLink: 'Accueil',
    breadcrumbPack: 'Pack',
    heroKicker: 'Nos coffrets MYRASS',
    reviewsUnit: 'avis',
    addToCart: 'Ajouter le pack au panier',
    details: 'Détails',
    shipping: 'Livraison',
    shippingText: 'Livraison standard et express selon votre région. Les délais s\'affichent à l\'étape de paiement.',
    packProducts: 'PRODUITS DU PACK',
    noReviews: 'Pas encore d\'avis — soyez le premier.',
    commentsTitle: 'Commentaires',
    reviewsPublished: 'avis publié(s)',
    deleteBtn: 'Supprimer',
    deleteConfirm: 'Supprimer votre commentaire ?',
    yourReview: 'Votre avis',
    reviewHintLoggedIn: 'Choisissez une note, puis ajoutez un commentaire si vous le souhaitez.',
    reviewHintGuest: 'Invité : votre pseudo sera',
    commentLabel: 'Commentaire (optionnel si connecté)',
    commentPlaceholder: 'Partagez votre expérience…',
    alreadyCommented: 'Vous avez déjà publié un commentaire. Vous pouvez toujours modifier votre note ci-dessus.',
    submitBtn: 'Publier',
    continueShopping: 'Continuer mes achats',
    close: 'Fermer',
    thankYouNoteTitle: 'Note mise à jour',
    thankYouNoteSubtitle: 'Votre commentaire publié reste inchangé. Votre note a bien été enregistrée.',
    thankYouCommentTitle: 'Merci pour votre retour',
    thankYouCommentSubtitle: 'Votre avis contribue à la qualité de nos produits et éclaire les autres clients.',
    thankYouCommentSubtitleWithName: '{name}, votre avis contribue à la qualité de nos produits et éclaire les autres clients.',
    thankYouAvisTitle: 'Merci',
    thankYouAvisSubtitle: 'Nous avons bien enregistré votre évaluation. Votre retour compte pour Myrass.',
    thankYouAvisSubtitleWithName: '{name}, nous avons bien enregistré votre évaluation. Votre retour compte pour Myrass.',
  },
  en: {
    loading: 'Loading pack…',
    notFound: 'Pack not found.',
    loadError: 'Error loading the pack.',
    back: 'Back',
    homeLink: 'Home',
    breadcrumbPack: 'Pack',
    heroKicker: 'Our MYRASS gift sets',
    reviewsUnit: 'reviews',
    addToCart: 'Add pack to cart',
    details: 'Details',
    shipping: 'Shipping',
    shippingText: 'Standard and express shipping available depending on your region. Delivery times are shown at checkout.',
    packProducts: 'PACK PRODUCTS',
    noReviews: 'No reviews yet — be the first.',
    commentsTitle: 'Comments',
    reviewsPublished: 'review(s) published',
    deleteBtn: 'Delete',
    deleteConfirm: 'Delete your comment?',
    yourReview: 'Your review',
    reviewHintLoggedIn: 'Choose a rating, then add a comment if you wish.',
    reviewHintGuest: 'Guest: your display name will be',
    commentLabel: 'Comment (optional if logged in)',
    commentPlaceholder: 'Share your experience…',
    alreadyCommented: 'You have already posted a comment. You can still update your rating above.',
    submitBtn: 'Submit',
    continueShopping: 'Continue shopping',
    close: 'Close',
    thankYouNoteTitle: 'Rating updated',
    thankYouNoteSubtitle: 'Your published comment is unchanged. Your rating has been saved.',
    thankYouCommentTitle: 'Thank you for your feedback',
    thankYouCommentSubtitle: 'Your review helps improve our products and guides other customers.',
    thankYouCommentSubtitleWithName: '{name}, your review helps improve our products and guides other customers.',
    thankYouAvisTitle: 'Thank you',
    thankYouAvisSubtitle: 'We have recorded your rating. Your feedback matters to Myrass.',
    thankYouAvisSubtitleWithName: '{name}, we have recorded your rating. Your feedback matters to Myrass.',
  },
  ar: {
    loading: 'تحميل الحزمة…',
    notFound: 'الحزمة غير موجودة.',
    loadError: 'خطأ في تحميل الحزمة.',
    back: 'رجوع',
    homeLink: 'الرئيسية',
    breadcrumbPack: 'حزمة',
    heroKicker: 'طقوم الهدايا من MYRASS',
    reviewsUnit: 'تقييم',
    addToCart: 'إضافة الحزمة إلى السلة',
    details: 'التفاصيل',
    shipping: 'التوصيل',
    shippingText: 'توصيل عادي وسريع حسب منطقتك. تُعرض مواعيد التسليم عند الدفع.',
    packProducts: 'منتجات الحزمة',
    noReviews: 'لا توجد تقييمات بعد — كن الأول.',
    commentsTitle: 'التعليقات',
    reviewsPublished: 'تقييم منشور',
    deleteBtn: 'حذف',
    deleteConfirm: 'هل تريد حذف تعليقك؟',
    yourReview: 'تقييمك',
    reviewHintLoggedIn: 'اختر تقييماً، ثم أضف تعليقاً إن شئت.',
    reviewHintGuest: 'زائر: سيظهر اسمك كـ',
    commentLabel: 'تعليق (اختياري إذا كنت مسجلاً)',
    commentPlaceholder: 'شارك تجربتك…',
    alreadyCommented: 'لقد نشرت تعليقاً بالفعل. يمكنك دائماً تعديل تقييمك أعلاه.',
    submitBtn: 'نشر',
    continueShopping: 'مواصلة التسوق',
    close: 'إغلاق',
    thankYouNoteTitle: 'تم تحديث التقييم',
    thankYouNoteSubtitle: 'تعليقك المنشور لم يتغير. تم حفظ تقييمك بنجاح.',
    thankYouCommentTitle: 'شكراً على ملاحظاتك',
    thankYouCommentSubtitle: 'يساهم تقييمك في تحسين منتجاتنا ويرشد العملاء الآخرين.',
    thankYouCommentSubtitleWithName: '{name}، يساهم تقييمك في تحسين منتجاتنا ويرشد العملاء الآخرين.',
    thankYouAvisTitle: 'شكراً',
    thankYouAvisSubtitle: 'لقد سجّلنا تقييمك. رأيك مهم لـ Myrass.',
    thankYouAvisSubtitleWithName: '{name}، لقد سجّلنا تقييمك. رأيك مهم لـ Myrass.',
  },
};

export const PROFILE_MENU_LABELS: Record<SiteLang, ProfileMenuLabels> = {
  fr: {
    menuTitle: 'Menu',
    close: 'Fermer',
    myAccountSubtitle: 'Mon compte Myrass',
    loyaltyLabel: 'Points fidélité',
    myOrders: 'Mes commandes',
    logout: 'Déconnexion',
    guestTitle: 'Invité',
    guestSubtitle: 'Connectez-vous pour suivre vos commandes',
    login: 'Connexion',
    createAccount: 'Créer un compte',
  },
  en: {
    menuTitle: 'Menu',
    close: 'Close',
    myAccountSubtitle: 'My Myrass account',
    loyaltyLabel: 'Loyalty points',
    myOrders: 'My orders',
    logout: 'Log out',
    guestTitle: 'Guest',
    guestSubtitle: 'Sign in to track your orders',
    login: 'Sign in',
    createAccount: 'Create an account',
  },
  ar: {
    menuTitle: 'القائمة',
    close: 'إغلاق',
    myAccountSubtitle: 'حسابي على Myrass',
    loyaltyLabel: 'نقاط الولاء',
    myOrders: 'طلباتي',
    logout: 'تسجيل الخروج',
    guestTitle: 'زائر',
    guestSubtitle: 'سجّل الدخول لمتابعة طلباتك',
    login: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب',
  },
};
