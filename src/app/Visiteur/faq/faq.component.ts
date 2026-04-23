import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SiteLanguageService } from '../../core/site-language.service';
import { SiteLang } from '../../core/visitor-i18n';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSection {
  heading: string;
  desc?: string;
  items: FaqItem[];
}

interface FaqPageCopy {
  kicker: string;
  heroTitle: string;
  heroSubtitle: string;
  sections: FaqSection[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn: string;
}

const FAQ_COPY: Record<SiteLang, FaqPageCopy> = {
  fr: {
    kicker: 'Aide & Informations',
    heroTitle: 'Questions Fréquentes',
    heroSubtitle: 'Retrouvez toutes les réponses à vos questions sur nos produits, vos commandes et nos services. Si votre question n\'est pas listée, notre équipe reste disponible.',
    sections: [
      {
        heading: 'Commandes & Paiements',
        desc: 'Tout ce que vous devez savoir avant et après avoir passé commande : modes de paiement, modifications et devis professionnels.',
        items: [
          {
            id: 'fr-1',
            question: 'Quels sont les moyens de paiement acceptés sur Myrass ?',
            answer: 'Nous acceptons les règlements par cartes bancaires internationales (via un système sécurisé) ainsi que les options de paiement local pour faciliter vos acquisitions. Chaque transaction est protégée par un protocole de sécurité SSL actif pour garantir la confidentialité de vos données.',
          },
          {
            id: 'fr-4',
            question: 'Ma commande est-elle confirmée immédiatement ?',
            answer: 'Une fois votre sélection validée, vous recevez instantanément un email de confirmation détaillant votre commande. Notre équipe prépare ensuite votre colis avec le plus grand soin, en y incluant une attention particulière pour refléter l\'esprit de notre Maison.',
          },
          {
            id: 'fr-2',
            question: 'Puis-je modifier ma commande après validation ?',
            answer: 'Afin de garantir une expédition rapide sous 24h à 48h, les modifications sont possibles tant que le colis n\'est pas encore remis au transporteur. Pour toute demande urgente, vous pouvez nous contacter via notre service client dédié.',
          },
        ],
      },
      {
        heading: 'Livraison',
        desc: 'Délais, frais et suivi de vos expéditions à travers tout le Maroc.',
        items: [
          {
            id: 'fr-5',
            question: 'Quels sont les délais et zones de livraison ?',
            answer: 'Nous livrons au Maroc, en France et dans le monde entier. Pour nos clients en Europe, le délai de livraison estimé est de 7 jours. Au Maroc, nous desservons les principales villes comme Casablanca, Rabat, Marrakech et Oujda.',
          },
          {
            id: 'fr-7',
            question: 'Comment puis-je suivre l\'acheminement de mon colis ?',
            answer: 'Dès l\'expédition, un numéro de suivi vous est communiqué par email ou via votre canal de communication privilégié. Vous pourrez ainsi suivre chaque étape du voyage de vos produits rares, de nos coopératives jusqu\'à votre porte.',
          },
          {
            id: 'fr-6',
            question: 'Quels sont les tarifs de livraison ?',
            answer: 'Les frais varient selon la destination. Pour la France, la livraison est de 15 €, mais elle vous est offerte dès 60 € d\'achat. Au Maroc, les frais de livraison standard sont de 40 MAD.',
          },
        ],
      },
      {
        heading: 'Produits',
        desc: 'Composition, conservation, authenticité et fabrication de nos créations artisanales.',
        items: [
          {
            id: 'fr-9',
            question: 'Vos produits contiennent-ils des allergènes ?',
            answer: 'Nos produits sont fabriqués dans des ateliers pouvant manipuler des fruits à coque (amandes, noix, pistaches, noix de cajou), du gluten, du lait, des œufs et du sésame. Chaque fiche produit liste précisément les allergènes présents et les traces potentielles. Si vous souffrez d\'une allergie sévère, nous vous recommandons de nous contacter directement avant toute commande afin que nous puissions vérifier la compatibilité avec votre situation.',
          },
          {
            id: 'fr-10',
            question: 'Quelle est la durée de conservation de vos produits ?',
            answer: 'Nos confiseries et pâtisseries artisanales se conservent de 3 à 6 mois selon le produit, dans un endroit frais et sec (entre 15 et 20 °C), à l\'abri de la lumière directe et de l\'humidité. Une fois l\'emballage ouvert, nous vous conseillons de consommer dans les 7 à 10 jours. La date limite de consommation est imprimée sur chaque étiquette. Pour les coffrets cadeaux, la DLUO garantit une fraîcheur d\'au moins 4 semaines à compter de la date d\'expédition.',
          },
          {
            id: 'fr-11',
            question: 'Vos produits sont-ils fabriqués artisanalement au Maroc ?',
            answer: 'Oui, chaque produit Myrass est élaboré à la main par nos artisans dans notre atelier basé au Maroc, selon des recettes transmises de génération en génération. Nous n\'utilisons aucun arôme artificiel ni conservateur chimique. Nos ingrédients clés sont sourcés localement — amandes de Tafraout, miel d\'Imouzzer, argan d\'Aït Baâmrane — pour garantir une qualité et une authenticité irréprochables tout en soutenant les producteurs locaux.',
          },
          {
            id: 'fr-prod-quality',
            question: 'Quelle est la garantie de qualité de vos huiles et produits ?',
            answer: 'Tous nos produits, qu\'il s\'agisse de l\'huile d\'argan ou de notre safran, bénéficient de la certification ONSSA, garantissant une traçabilité totale et le respect des normes sanitaires. Nos huiles sont extraites par pression à froid pour préserver l\'intégralité de leurs bienfaits naturels.',
          },
          {
            id: 'fr-prod-formats',
            question: 'Quels sont les formats disponibles pour vos huiles et miels ?',
            answer: 'Nous proposons plusieurs formats adaptés à vos besoins :\n• Huile d\'olive Extra Vierge : 1 L (290 DH) ou ½ L (150 DH).\n• Huile d\'Argan : 100 ml (18 €) ou 50 ml (9,90 €).\n• Miel : 500 g (19 €) ou 1 kg (34,90 €).',
          },
          {
            id: 'fr-prod-origin',
            question: 'D\'où proviennent vos ingrédients ?',
            answer: 'Chaque produit Myrass est issu d\'un terroir spécifique : notre argan provient de l\'Anti-Atlas, notre safran de Taliouine, et notre amlou est préparé de manière artisanale avec des amandes, du miel et de l\'argan. Nous travaillons en direct avec des coopératives pour valoriser le geste ancestral.',
          },
        ],
      },
      {
        heading: 'Retours & Remboursements',
        desc: 'Notre politique en cas de produit défectueux, endommagé ou de litige après réception.',
        items: [
          {
            id: 'fr-12',
            question: 'Quelle est votre politique de retour ?',
            answer: 'Conformément aux standards de la vente à distance, vous disposez d\'un délai de 14 jours après réception pour nous retourner un produit si celui-ci ne correspond pas à vos attentes. Le produit doit être renvoyé dans son emballage d\'origine et non ouvert pour des raisons d\'hygiène.',
          },
          {
            id: 'fr-13',
            question: 'Que faire si mon colis arrive endommagé ?',
            answer: 'Nous accordons une importance capitale au packaging, mais si un incident survient durant le transport, contactez-nous sous 48h avec une photo du dommage. Nous procéderons immédiatement à une résolution personnalisée pour vous satisfaire.',
          },
          {
            id: 'fr-14',
            question: 'Sous quel délai le remboursement est-il effectué ?',
            answer: 'Après réception et vérification de votre retour par nos services, le remboursement est traité sur le moyen de paiement utilisé lors de l\'achat dans un délai rapide, pour assurer une expérience client fluide et transparente.',
          },
        ],
      },
      {
        heading: 'Coffrets Cadeaux',
        desc: 'Options d\'emballage, personnalisation, messages et occasions spéciales.',
        items: [
          {
            id: 'fr-cc-1',
            question: 'Que contient le Coffret Découverte Myrass ?',
            answer: 'Véritable « trophée social » et signature de notre Maison, ce coffret noir et or réunit 4 pièces d\'exception : de l\'huile d\'argan, du safran de Taliouine, de l\'amlou artisanal et de l\'huile d\'olive. Il est proposé au tarif de 380 MAD.',
          },
          {
            id: 'fr-cc-2',
            question: 'Est-il possible de personnaliser le coffret pour un cadeau ?',
            answer: 'Chaque envoi est traité comme un présent précieux. Nous incluons systématiquement une note manuscrite dans nos colis pour renforcer le caractère unique et exclusif de votre attention.',
          },
          {
            id: 'fr-cc-3',
            question: 'Quels sont les tarifs de l\'Amlou et du Safran en dehors des coffrets ?',
            answer: 'Pour composer votre propre assortiment, nous proposons :\n• Amlou (Amandes, Miel, Argan) : 500 g (149 DH) ou 1 kg (279 DH).\n• Safran de Taliouine : 1 g (19 €) ou 5 g (79 €).',
          },
          {
            id: 'fr-15',
            question: 'Proposez-vous un emballage cadeau ?',
            answer: 'Oui. Tous nos coffrets sont présentés dans des boîtes en carton épais habillées d\'un papier de soie et d\'un ruban satiné. Vous pouvez choisir parmi plusieurs coloris (noir mat, crème ivoire, vert olive). La personnalisation de l\'emballage avec votre logo ou un texte imprimé est disponible dès 10 coffrets pour les commandes professionnelles. Aucun bon de livraison mentionnant les prix n\'est inclus dans les colis cadeaux.',
          },
          {
            id: 'fr-16',
            question: 'Puis-je ajouter un message personnalisé ?',
            answer: 'Absolument. Lors de la validation de votre commande, un champ dédié vous permet d\'ajouter un message de votre choix (200 caractères maximum). Ce message est calligraphié à l\'encre sur une carte en papier ivoire recyclé glissée délicatement dans le coffret. Pour les commandes professionnelles nécessitant une carte avec votre propre design, contactez-nous en amont pour que nous étudiions la faisabilité.',
          },
          {
            id: 'fr-17',
            question: 'Puis-je envoyer un coffret directement à son destinataire ?',
            answer: 'Oui, tout à fait. Lors de la commande, il vous suffit de renseigner l\'adresse du destinataire comme adresse de livraison. Comme mentionné précédemment, aucun prix ni bon de commande n\'est inclus dans le colis — uniquement les produits, la carte message et l\'emballage. Un e-mail de confirmation vous est envoyé à vous (l\'expéditeur), non au destinataire, pour que la surprise reste entière.',
          },
        ],
      },
    ],
    ctaTitle: 'Vous avez d\'autres questions ?',
    ctaSubtitle: 'Notre équipe est disponible du lundi au samedi pour vous accompagner et répondre à toutes vos demandes.',
    ctaBtn: 'Contactez-nous',
  },

  en: {
    kicker: 'Help & Information',
    heroTitle: 'Frequently Asked Questions',
    heroSubtitle: 'Find detailed answers to all your questions about our products, your orders and our services. If your question is not listed, our team is always available.',
    sections: [
      {
        heading: 'Orders & Payments',
        desc: 'Everything you need to know before and after placing an order: payment methods, modifications and professional quotes.',
        items: [
          {
            id: 'en-1',
            question: 'What payment methods does Myrass accept?',
            answer: 'We accept payments by international bank cards (via a secure system) as well as local payment options to facilitate your purchases. Each transaction is protected by an active SSL security protocol to guarantee the confidentiality of your data.',
          },
          {
            id: 'en-4',
            question: 'Is my order confirmed immediately?',
            answer: 'Once your selection is validated, you immediately receive a confirmation email detailing your order. Our team then prepares your parcel with the greatest care, including a particular attention to reflect the spirit of our House.',
          },
          {
            id: 'en-2',
            question: 'Can I modify my order after validation?',
            answer: 'To guarantee rapid shipment within 24 to 48 hours, modifications are possible as long as the parcel has not yet been handed over to the carrier. For any urgent request, you can contact us via our dedicated customer service.',
          },
        ],
      },
      {
        heading: 'Delivery',
        desc: 'Timeframes, fees and tracking for your shipments across Morocco.',
        items: [
          {
            id: 'en-5',
            question: 'What are the delivery times and zones?',
            answer: 'We deliver to Morocco, France and worldwide. For our customers in Europe, the estimated delivery time is 7 days. In Morocco, we serve major cities such as Casablanca, Rabat, Marrakech and Oujda.',
          },
          {
            id: 'en-7',
            question: 'How can I track my parcel?',
            answer: 'Upon shipment, a tracking number is communicated to you by email or via your preferred communication channel. You can thus follow each stage of your rare products\' journey, from our cooperatives to your door.',
          },
          {
            id: 'en-6',
            question: 'What are the delivery rates?',
            answer: 'Fees vary depending on the destination. For France, delivery is €15, but it is free from €60 of purchases. In Morocco, standard delivery charges are 40 MAD.',
          },
        ],
      },
      {
        heading: 'Products',
        desc: 'Composition, shelf life, authenticity and craftsmanship behind our creations.',
        items: [
          {
            id: 'en-9',
            question: 'Do your products contain allergens?',
            answer: 'Our products are made in workshops that may handle tree nuts (almonds, walnuts, pistachios, cashews), gluten, milk, eggs and sesame. Each product page precisely lists the allergens present and potential traces. If you have a severe allergy, we strongly recommend contacting us before ordering so we can check compatibility with your specific situation.',
          },
          {
            id: 'en-10',
            question: 'What is the shelf life of your products?',
            answer: 'Our artisanal confectionery and pastries keep for 3 to 6 months depending on the product, stored in a cool dry place (15–20 °C), away from direct light and humidity. Once opened, we recommend consuming within 7 to 10 days. The best-before date is printed on each label. For gift boxes, the BBD guarantees freshness of at least 4 weeks from the date of shipment.',
          },
          {
            id: 'en-11',
            question: 'Are your products handcrafted in Morocco?',
            answer: 'Yes, every Myrass product is handmade by our craftspeople in our Moroccan workshop, following recipes passed down through generations. We use no artificial flavourings or chemical preservatives. Our key ingredients are sourced locally — almonds from Tafraout, honey from Imouzzer, argan from Aït Baâmrane — to guarantee uncompromising quality and authenticity while supporting local producers.',
          },
          {
            id: 'en-prod-quality',
            question: 'What quality guarantee do your oils and products carry?',
            answer: 'All our products — including argan oil and saffron — hold the ONSSA certification, guaranteeing full traceability and compliance with health standards. Our oils are cold-pressed to preserve the entirety of their natural benefits.',
          },
          {
            id: 'en-prod-formats',
            question: 'What formats are available for your oils and honeys?',
            answer: 'We offer several formats to suit your needs:\n• Extra Virgin Olive Oil: 1 L (290 MAD) or ½ L (150 MAD).\n• Argan Oil: 100 ml (€18) or 50 ml (€9.90).\n• Honey: 500 g (€19) or 1 kg (€34.90).',
          },
          {
            id: 'en-prod-origin',
            question: 'Where do your ingredients come from?',
            answer: 'Every Myrass product comes from a specific terroir: our argan originates from the Anti-Atlas mountains, our saffron from Taliouine, and our amlou is prepared artisanally with almonds, honey and argan. We work directly with cooperatives to honour ancestral craftsmanship.',
          },
        ],
      },
      {
        heading: 'Returns & Refunds',
        desc: 'Our policy in the event of a defective or damaged product and how we handle disputes.',
        items: [
          {
            id: 'en-12',
            question: 'What is your return policy?',
            answer: 'In accordance with distance selling standards, you have 14 days after receipt to return a product if it does not meet your expectations. The product must be returned in its original packaging and unopened for hygiene reasons.',
          },
          {
            id: 'en-13',
            question: 'What should I do if my parcel arrives damaged?',
            answer: 'We attach the utmost importance to packaging, but if an incident occurs during transport, contact us within 48 hours with a photo of the damage. We will immediately proceed with a personalised resolution to satisfy you.',
          },
          {
            id: 'en-14',
            question: 'How quickly is the refund processed?',
            answer: 'After receipt and verification of your return by our services, the refund is processed to the payment method used at the time of purchase within a quick timeframe, to ensure a smooth and transparent customer experience.',
          },
        ],
      },
      {
        heading: 'Gift Boxes',
        desc: 'Packaging options, personalisation, messages and special occasions.',
        items: [
          {
            id: 'en-cc-1',
            question: 'What does the Myrass Discovery Box contain?',
            answer: 'A true "social trophy" and signature of our House, this black and gold box unites 4 exceptional pieces: argan oil, Taliouine saffron, artisanal amlou and olive oil. It is offered at a price of 380 MAD.',
          },
          {
            id: 'en-cc-2',
            question: 'Can the box be personalised as a gift?',
            answer: 'Every shipment is treated as a precious present. We systematically include a handwritten note in our parcels to reinforce the unique and exclusive character of your gesture.',
          },
          {
            id: 'en-cc-3',
            question: 'What are the prices for Amlou and Saffron outside of the gift boxes?',
            answer: 'To compose your own assortment, we offer:\n• Amlou (Almonds, Honey, Argan): 500 g (149 MAD) or 1 kg (279 MAD).\n• Taliouine Saffron: 1 g (€19) or 5 g (€79).',
          },
          {
            id: 'en-15',
            question: 'Do you offer gift wrapping?',
            answer: 'Yes. All our gift boxes are presented in thick cardboard boxes lined with tissue paper and a satin ribbon. You can choose from several colours (matte black, ivory cream, olive green). Custom packaging with your logo or printed text is available from 10 boxes for professional orders. No delivery note mentioning prices is included in gift packages.',
          },
          {
            id: 'en-16',
            question: 'Can I add a personalised message?',
            answer: 'Absolutely. During checkout, a dedicated field allows you to add a message of your choice (maximum 200 characters). This message is hand-written in ink on an ivory recycled paper card delicately placed inside the box. For professional orders requiring a card with your own design, contact us in advance so we can assess the feasibility.',
          },
          {
            id: 'en-17',
            question: 'Can I send a gift box directly to the recipient?',
            answer: 'Yes, absolutely. When ordering, simply enter the recipient\'s address as the delivery address. As mentioned, no prices or order forms are included in the parcel — only the products, message card and packaging. A confirmation email is sent to you (the sender), not the recipient, so the surprise remains intact.',
          },
        ],
      },
    ],
    ctaTitle: 'Still have questions?',
    ctaSubtitle: 'Our team is available Monday to Saturday to assist you and respond to all your enquiries.',
    ctaBtn: 'Contact Us',
  },

  ar: {
    kicker: 'مساعدة ومعلومات',
    heroTitle: 'الأسئلة الشائعة',
    heroSubtitle: 'اعثر على إجابات مفصّلة لجميع أسئلتك حول منتجاتنا وطلباتك وخدماتنا. إذا لم تجد إجابتك، فريقنا متاح دائماً.',
    sections: [
      {
        heading: 'الطلبات والمدفوعات',
        desc: 'كل ما تحتاج معرفته قبل تقديم طلبك وبعده: طرق الدفع والتعديلات والعروض المهنية.',
        items: [
          {
            id: 'ar-1',
            question: 'ما طرق الدفع المقبولة في Myrass؟',
            answer: 'نقبل المدفوعات ببطاقات الائتمان الدولية (عبر نظام آمن) فضلاً عن خيارات الدفع المحلي لتسهيل مشترياتك. كل معاملة محمية ببروتوكول أمان SSL فعّال لضمان سرية بياناتك.',
          },
          {
            id: 'ar-4',
            question: 'هل يُؤكَّد طلبي فوراً؟',
            answer: 'بمجرد التحقق من اختيارك، تتلقى على الفور رسالة إلكترونية تأكيدية تُفصّل طلبك. يقوم فريقنا بعدها بتحضير طردك بعناية فائقة، مع اهتمام خاص يعكس روح ماركتنا.',
          },
          {
            id: 'ar-2',
            question: 'هل يمكنني تعديل طلبي بعد التأكيد؟',
            answer: 'لضمان الشحن السريع في غضون 24 إلى 48 ساعة، يمكن إجراء التعديلات ما دام الطرد لم يُسلَّم إلى شركة النقل بعد. لأي طلب عاجل، يمكنك التواصل معنا عبر خدمة العملاء المخصصة.',
          },
        ],
      },
      {
        heading: 'التوصيل',
        desc: 'المدد والرسوم وتتبع شحناتك عبر أنحاء المغرب.',
        items: [
          {
            id: 'ar-5',
            question: 'ما مدد التوصيل والمناطق المغطاة؟',
            answer: 'نوصّل إلى المغرب وفرنسا وجميع أنحاء العالم. لعملائنا في أوروبا، تبلغ مدة التوصيل المقدّرة 7 أيام. في المغرب، نخدم المدن الكبرى كالدار البيضاء والرباط ومراكش ووجدة.',
          },
          {
            id: 'ar-7',
            question: 'كيف يمكنني تتبع شحنتي؟',
            answer: 'فور الشحن، يُرسَل إليك رقم التتبع عبر البريد الإلكتروني أو قناة التواصل المفضّلة لديك. ستتمكن من متابعة كل مرحلة من رحلة منتجاتك النفيسة، من تعاونياتنا حتى باب منزلك.',
          },
          {
            id: 'ar-6',
            question: 'ما تعريفات التوصيل؟',
            answer: 'تتفاوت الرسوم حسب الوجهة. لفرنسا، يبلغ التوصيل 15 €، ويكون مجانياً ابتداءً من 60 € من المشتريات. في المغرب، تبلغ رسوم التوصيل العادي 40 درهم.',
          },
        ],
      },
      {
        heading: 'المنتجات',
        desc: 'التركيبة والحفظ والأصالة والحرفية الكامنة وراء إبداعاتنا.',
        items: [
          {
            id: 'ar-9',
            question: 'هل تحتوي منتجاتكم على مواد مسببة للحساسية؟',
            answer: 'تُصنَّع منتجاتنا في ورش قد تتعامل مع المكسرات (اللوز والجوز والفستق والكاجو) والغلوتين والحليب والبيض والسمسم. تُذكر المواد المسبّبة للحساسية بدقة في صفحة كل منتج. إذا كنت تعاني من حساسية حادة، نوصي بالتواصل معنا قبل الطلب للتحقق من الملاءمة مع وضعك.',
          },
          {
            id: 'ar-10',
            question: 'ما مدة صلاحية منتجاتكم؟',
            answer: 'تحتفظ حلوياتنا ومعجناتنا الحرفية بجودتها من 3 إلى 6 أشهر حسب المنتج، في مكان بارد وجاف (15-20 درجة مئوية) بعيداً عن الضوء المباشر والرطوبة. بعد فتح العبوة، ننصح بالاستهلاك خلال 7 إلى 10 أيام. تاريخ الانتهاء مطبوع على كل ملصق. بالنسبة لصناديق الهدايا، يضمن تاريخ الصلاحية نضارة لا تقل عن 4 أسابيع من تاريخ الشحن.',
          },
          {
            id: 'ar-11',
            question: 'هل تُصنَّع منتجاتكم يدوياً في المغرب؟',
            answer: 'نعم، كل منتج من منتجات Myrass يُعدّ يدوياً على يد حرفيينا في ورشتنا المغربية، وفق وصفات متوارثة جيلاً بعد جيل. لا نستخدم أي نكهات اصطناعية أو مواد حافظة كيميائية. مكوناتنا الرئيسية محلية المصدر — لوز تافراوت وعسل إموزار وأركان أيت بعمران — لضمان جودة وأصالة لا تُضاهى مع دعم المنتجين المحليين.',
          },
          {
            id: 'ar-prod-quality',
            question: 'ما ضمان الجودة المقدَّم لزيوتكم ومنتجاتكم؟',
            answer: 'جميع منتجاتنا، سواء زيت الأركان أو الزعفران، حاصلة على شهادة ONSSA التي تضمن التتبع الكامل والامتثال للمعايير الصحية. تُستخرج زيوتنا بالضغط على البارد للحفاظ على كامل فوائدها الطبيعية.',
          },
          {
            id: 'ar-prod-formats',
            question: 'ما الأحجام المتوفرة لزيوتكم وعسلكم؟',
            answer: 'نقدم أحجاماً متعددة تلائم احتياجاتك:\n• زيت الزيتون إكسترا فيرجن: 1 لتر (290 درهم) أو نصف لتر (150 درهم).\n• زيت الأركان: 100 مل (18 €) أو 50 مل (9,90 €).\n• العسل: 500 غرام (19 €) أو 1 كيلو (34,90 €).',
          },
          {
            id: 'ar-prod-origin',
            question: 'من أين تأتي مكوناتكم؟',
            answer: 'كل منتج من منتجات Myrass مصدره بيئة جغرافية محددة: يأتي أركاننا من جبال الأطلس الصغير، وزعفراننا من تالوين، ويُحضَّر أملونا يدوياً من اللوز والعسل والأركان. نعمل مباشرةً مع التعاونيات لتثمين الحرف التراثية الأصيلة.',
          },
        ],
      },
      {
        heading: 'الإرجاع والاسترداد',
        desc: 'سياستنا في حالة المنتجات المعيبة أو التالفة وكيفية معالجة النزاعات.',
        items: [
          {
            id: 'ar-12',
            question: 'ما سياسة الإرجاع لديكم؟',
            answer: 'وفقاً لمعايير البيع عن بُعد، لديك 14 يوماً بعد الاستلام لإرجاع منتج إذا لم يتوافق مع توقعاتك. يجب إعادة المنتج في عبوته الأصلية وغير مفتوحة لأسباب صحية.',
          },
          {
            id: 'ar-13',
            question: 'ماذا أفعل إذا وصل طردي تالفاً؟',
            answer: 'نولي التغليف أهمية قصوى، ولكن في حال وقوع حادث أثناء النقل، تواصل معنا خلال 48 ساعة مع صورة للضرر. سنتولى فوراً إيجاد حل مخصص لإرضائك.',
          },
          {
            id: 'ar-14',
            question: 'كم يستغرق معالجة الاسترداد؟',
            answer: 'بعد استلام مرتجعك والتحقق منه من قِبَل خدماتنا، يُعالَج الاسترداد إلى وسيلة الدفع المستخدمة عند الشراء في أقرب وقت، لضمان تجربة عميل سلسة وشفافة.',
          },
        ],
      },
      {
        heading: 'صناديق الهدايا',
        desc: 'خيارات التغليف والتخصيص والرسائل والمناسبات الخاصة.',
        items: [
          {
            id: 'ar-cc-1',
            question: 'ما محتوى صندوق الاكتشاف من Myrass؟',
            answer: 'يُعدّ هذا الصندوق الأسود والذهبي حقيقةً «تحفة اجتماعية» وتوقيعاً مميزاً لماركتنا، إذ يجمع 4 قطع استثنائية: زيت الأركان وزعفران تالوين والأملو الحرفي وزيت الزيتون. يُقدَّم بسعر 380 درهم.',
          },
          {
            id: 'ar-cc-2',
            question: 'هل يمكن تخصيص الصندوق كهدية؟',
            answer: 'تُعامَل كل شحنة كهدية ثمينة. ندرج في طرودنا باستمرار رسالة مكتوبة بخط اليد لتعزيز الطابع الفريد والحصري لاهتمامك.',
          },
          {
            id: 'ar-cc-3',
            question: 'ما أسعار الأملو والزعفران خارج الصناديق؟',
            answer: 'لتكوين تشكيلتك الخاصة، نقدم:\n• الأملو (لوز، عسل، أركان): 500 غرام (149 درهم) أو 1 كيلو (279 درهم).\n• زعفران تالوين: 1 غرام (19 €) أو 5 غرام (79 €).',
          },
          {
            id: 'ar-15',
            question: 'هل تقدمون تغليف هدايا؟',
            answer: 'نعم. تُقدَّم جميع صناديق الهدايا في علب كرتونية سميكة مبطّنة بورق حرير وشريط ساتان. يمكنك الاختيار من بين عدة ألوان (أسود مطفأ، كريم عاجي، أخضر زيتوني). تغليف مخصص بشعارك أو نص مطبوع متاح ابتداءً من 10 صناديق للطلبات المهنية. لا يُدرج أي إيصال يذكر الأسعار داخل طرود الهدايا.',
          },
          {
            id: 'ar-16',
            question: 'هل يمكنني إضافة رسالة شخصية؟',
            answer: 'بالطبع. عند إتمام طلبك، يتيح لك حقل مخصص إضافة رسالة من اختيارك (200 حرف كحد أقصى). تُكتب هذه الرسالة بالحبر بخط اليد على بطاقة من الورق العاجي المُعاد تدويره وتوضع بعناية داخل الصندوق. للطلبات المهنية التي تتطلب بطاقة بتصميمك الخاص، تواصل معنا مسبقاً لدراسة الجدوى.',
          },
          {
            id: 'ar-17',
            question: 'هل يمكنني إرسال صندوق هدية مباشرةً إلى المُهدَى إليه؟',
            answer: 'نعم تماماً. عند تقديم الطلب، ما عليك سوى إدخال عنوان المُهدَى إليه كعنوان توصيل. كما ذكرنا، لا يُضمَّن الطرد أي سعر أو نموذج طلب، بل المنتجات وبطاقة الرسالة والتغليف فحسب. تُرسَل رسالة التأكيد إليك أنت (المُرسِل)، لا إلى المُهدَى إليه، لتبقى المفاجأة كاملة.',
          },
        ],
      },
    ],
    ctaTitle: 'هل لديك أسئلة أخرى؟',
    ctaSubtitle: 'فريقنا متاح من الاثنين إلى السبت لمساعدتك والرد على جميع استفساراتك.',
    ctaBtn: 'تواصل معنا',
  },
};

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent implements OnInit, OnDestroy {
  copy: FaqPageCopy = FAQ_COPY['fr'];
  isRtl = false;
  openId: string | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly langService: SiteLanguageService) {}

  ngOnInit(): void {
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
      this.copy = FAQ_COPY[lang];
      this.isRtl = lang === 'ar';
      this.openId = null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(id: string): void {
    this.openId = this.openId === id ? null : id;
  }

  isOpen(id: string): boolean {
    return this.openId === id;
  }

  scrollToSection(si: number): void {
    const el = document.getElementById('faq-section-' + si);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
