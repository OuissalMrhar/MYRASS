import { SiteLang } from '../../core/visitor-i18n';

export interface GuideSectionCopy {
  title: string;
  lines: { label: string; value: string }[];
  intro: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
 
  textFirst: boolean;
}

export interface GuidePageCopy {
  heroTitle: string;
  heroSubtitle: string;
  videoPlayLabel: string;
  introTitle: string;
  introSubtitle: string;
  introBody: string;
  sections: GuideSectionCopy[];
  seeMore: string;
}

const IMG_OLIVE  = '/assets/pack1.jpeg';
const IMG_AMLOU  = '/assets/pack1.jpeg';
const IMG_MIEL   = '/assets/pack1.jpeg';
const IMG_ARGAN  = '/assets/pack1.jpeg';
const IMG_SAFRAN = '/assets/pack1.jpeg';

export const GUIDE_COPY: Record<SiteLang, GuidePageCopy> = {

  /* ───────────────────────────────── FR ───────────────────────────────── */
  fr: {
    heroTitle:    'Le Guide des Produits Artisanaux du Maroc',
    heroSubtitle: 'Huile d\'argan, safran de Taliouine, miel d\'euphorbe, amlou artisanal. Découvrez le savoir-faire derrière chaque trésor.',
    videoPlayLabel: 'Lancer la vidéo',
    introTitle:   'De la Terre Marocaine à Votre Table',
    introSubtitle: 'Fabriqué à la main, ancré dans des siècles de tradition',
    introBody:    'Chez Myrass, chaque produit raconte une histoire de terroir, de savoir-faire et de passion. Nos artisans sélectionnent, récoltent et transforment à la main les meilleurs ingrédients du patrimoine marocain pour vous offrir une qualité sans compromis ans additifs, sans raccourcis, avec une traçabilité complète du producteur à votre porte.',
    seeMore: 'Voir plus',
    sections: [
      {
        title: 'Huile d\'Olive — Pressée à Froid',
        lines: [],
        intro: 'Découvrez notre huile d\'olive marocaine, pressée à froid. 100 % naturelle, sans additifs, riche en polyphénols et en oméga-9. Une huile d\'olive de qualité supérieure, récoltée à la main et extraite en moins de 24 heures pour préserver tous ses bienfaits.',
        bullets: [
          'Récolte 100 % manuelle à l\'aube',
          'Pression à froid en moins de 24 h',
          'Zéro additif, zéro conservateur',
          'Riche en polyphénols et en oméga-9',
          'Acide oléique > 73 %, qualité supérieure',
        ],
        imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776785626/pexels-i-brahim-yazgan-706156449-29505941_jsjt6q.jpg',
        imageAlt: 'Huile d\'olive vierge extra marocaine pressée à froid — Atlas Maroc',
        textFirst: true,
      },
      {
        title: 'Amlou Traditionnel Marocain — Pâte d\'Amandes, Argan & Miel',
        lines: [],
        intro: 'L\'amlou marocain artisanal, préparé selon la recette berbère traditionnelle : amandes torréfiées, huile d\'argan pure et miel de montagne brut. Sans conservateurs, sans huile de palme. La pâte à tartiner naturelle du Maroc, idéale au petit-déjeuner ou en collation saine.',
        bullets: [
          'Amandes torréfiées à la flamme douce',
          'Broyage à la meule de pierre traditionnelle',
          'Huile d\'argan pure de première pression',
          'Miel de montagne brut non pasteurisé',
          'Sans conservateur ni stabilisant industriel',
        ],
             imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776786349/t%C3%A9l%C3%A9chargement_cs1wh5.jpg',
        imageAlt: 'Amlou artisanal marocain — pâte amandes argan miel berbère',
        textFirst: false,
      },
      {
        title: 'Miel d\'Euphorbe du Maroc — Miel Blanc Naturel, Récolte Artisanale',
        lines: [],
        intro: 'Le miel d\'euphorbe du Maroc, l\'un des miels les plus rares au monde. Blanc crème nacré, extrait à froid, non chauffé et non filtré industriellement. Un miel monofloral 100 % naturel, riche en enzymes, en antioxydants et aux propriétés apaisantes reconnues.',
        bullets: [
          'Miel monofloral 100 % naturel d\'euphorbe',
          'Apiculture traditionnelle d\'altitude',
          'Extrait à froid, enzymes et vitamines préservés',
          'Non chauffé, non filtré industriellement',
          'Riche en antioxydants et propriétés apaisantes',
        ],
        imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776786653/spyros-skareas-WKnE3gf_Y88-unsplash_ol2g4p.jpg',
        imageAlt: 'Miel d\'euphorbe blanc naturel Maroc — récolte artisanale altitude',
        textFirst: true,
      },
      {
        title: 'Huile d\'Argan Pure Alimentaire — Coopérative Femmes, Souss-Massa',
        lines: [],
        intro: 'Notre huile d\'argan pure alimentaire, produite par des coopératives de femmes certifiées de la région Souss-Massa au Maroc. Pressée à froid, vierge et non raffinée. Riche en vitamine E, en oméga-6 et oméga-9. L\'huile d\'argan originale du Maroc pour la cuisine et le soin.',
        bullets: [
          'Coopératives de femmes certifiées Souss-Massa',
          'Cassage à la main des noix d\'argan',
          'Pression à froid sans solvant chimique',
          'Riche en vitamine E (tocophérols) et stérols végétaux',
          'Huile d\'argan vierge non raffinée, alimentaire & cosmétique',
        ],
                      imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776253958/pexels-pabloramon-18076611_bwwnvo.jpg',
        imageAlt: 'Huile d\'argan pure alimentaire Maroc — coopérative femmes Souss-Massa',
        textFirst: false,
      },
      {
        title: 'Safran de Taliouine IGP — Safran Marocain 100 % Pur, Récolte Manuelle',
        lines: [],
        intro: 'Le safran de Taliouine, le safran marocain IGP parmi les plus puissants et les plus purs au monde. Récolté à la main avant l\'aube, séché naturellement pour conserver tout son pouvoir colorant et aromatique. 150 000 fleurs pour un seul kilo : un trésor rare, directement des producteurs.',
        bullets: [
          'Récolte 100 % manuelle avant l\'aube',
          '150 000 fleurs pour 1 kg de safran',
          'Séchage naturel, arômes et principes actifs préservés',
          'IGP Safran de Taliouine, appellation protégée',
          'Pouvoir colorant et aromatique parmi les plus élevés au monde',
        ],
        imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776948437/pexels-rubaitulazad-19029722_wz5jkc.jpg',
        imageAlt: 'Safran de Taliouine IGP Maroc — récolte manuelle, safran pur 100%',
        textFirst: true,
      },
    ],
  },

  /* ───────────────────────────────── EN ───────────────────────────────── */
  en: {
    heroTitle:    'The Guide to Morocco\'s Finest Artisan Products',
    heroSubtitle: 'Argan oil, Taliouine saffron, euphorbia honey, artisanal amlou. Discover the craft behind each treasure.',
    videoPlayLabel: 'Play video',
    introTitle:   'From Moroccan Land to Your Table',
    introSubtitle: 'Handcrafted with passion, rooted in centuries of tradition',
    introBody:    'At Myrass, every product tells a story of land, craftsmanship and passion. Our artisans hand-select, harvest and process the finest ingredients of the Moroccan heritage to offer you uncompromising quality no additives, no shortcuts, with full traceability from source to your door.',
    seeMore: 'See more',
    sections: [
      {
        title: 'Moroccan Olive Oil — Cold-Pressed, Atlas Mountains',
        lines: [],
        intro: 'Discover our Moroccan olive oil, cold-pressed in the Atlas Mountains. 100% natural, additive-free, rich in polyphenols and omega-9. A premium quality olive oil, hand-harvested and extracted within 24 hours to preserve all its health benefits.',
        bullets: [
          '100% manual harvest at dawn',
          'Cold-pressed within 24 hours',
          'Zero additives or preservatives',
          'Rich in polyphenols and omega-9',
          'Oleic acid > 73%, premium quality',
        ],
       imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776785626/pexels-i-brahim-yazgan-706156449-29505941_jsjt6q.jpg',
        imageAlt: 'Moroccan extra virgin olive oil cold-pressed — Atlas Mountains Morocco',
        textFirst: true,
      },
      {
        title: 'Moroccan Artisanal Amlou — Almond, Argan Oil & Honey Spread',
        lines: [],
        intro: 'Authentic Moroccan amlou, made the traditional Berber way: roasted almonds, pure argan oil and raw mountain honey. No preservatives, no palm oil. Morocco\'s natural nut butter, perfect for breakfast or as a healthy snack.',
        bullets: [
          'Almonds flame-roasted over gentle wood fire',
          'Traditional stone-grinding process',
          'Pure first-press argan oil',
          'Raw unpasteurised mountain honey',
          'No preservatives or industrial stabilisers',
        ],
            imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776786349/t%C3%A9l%C3%A9chargement_cs1wh5.jpg',
        imageAlt: 'Moroccan artisanal amlou spread — almonds argan oil honey Berber recipe',
        textFirst: false,
      },
      {
        title: 'Moroccan Euphorbia Honey — Rare White Natural Honey, Handcrafted',
        lines: [],
        intro: 'Moroccan euphorbia honey, one of the rarest honeys in the world. Pearlescent cream-white, cold-extracted, unheated and unfiltered. A 100% natural monofloral honey, rich in enzymes and antioxidants, with naturally soothing properties.',
        bullets: [
          '100% natural monofloral euphorbia honey',
          'Traditional high-altitude beekeeping',
          'Cold-extracted, enzymes and vitamins preserved',
          'Unheated and non-industrially filtered',
          'Rich in antioxidants and natural soothing properties',
        ],
               imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776786653/spyros-skareas-WKnE3gf_Y88-unsplash_ol2g4p.jpg',
        imageAlt: 'Moroccan euphorbia honey rare white natural — handcrafted high altitude',
        textFirst: true,
      },
      {
        title: 'Pure Moroccan Argan Oil — Women\'s Cooperative, Cold-Pressed Souss-Massa',
        lines: [],
        intro: 'Our pure culinary argan oil, produced by certified women\'s cooperatives in Morocco\'s Souss-Massa region. Cold-pressed, virgin and unrefined. Rich in vitamin E, omega-6 and omega-9. Authentic Moroccan argan oil for cooking and skincare.',
        bullets: [
          'Certified Souss-Massa women\'s cooperatives',
          'Hand-cracking of argan nuts',
          'Cold-pressed with no chemical solvent',
          'Rich in vitamin E (tocopherols) and plant sterols',
          'Unrefined virgin argan oil, culinary & cosmetic',
        ],
                      imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776253958/pexels-pabloramon-18076611_bwwnvo.jpg',
        imageAlt: 'Pure Moroccan argan oil culinary — women\'s cooperative Souss-Massa cold-pressed',
        textFirst: false,
      },
      {
        title: 'Taliouine Saffron PGI — Pure Moroccan Saffron, Hand-Harvested',
        lines: [],
        intro: 'Taliouine saffron, Morocco\'s PGI-certified saffron and one of the most potent and pure in the world. Hand-harvested before dawn, naturally dried to preserve its full colouring and aromatic power. 150,000 flowers per kilo, a rare treasure, straight from the growers.',
        bullets: [
          '100% manual harvest before dawn',
          '150,000 flowers for 1 kg of saffron',
          'Natural shade-drying, aromas and actives preserved',
          'PGI Taliouine Saffron, protected designation',
          'Among the world\'s highest colouring and aromatic power',
        ],
         imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776948437/pexels-rubaitulazad-19029722_wz5jkc.jpg',
        imageAlt: 'Taliouine saffron PGI Morocco — hand-harvested pure Moroccan saffron',
        textFirst: true,
      },
    ],
  },

  /* ───────────────────────────────── AR ───────────────────────────────── */
  ar: {
    heroTitle:    'دليل منتجات التراث المغربي الاستثنائية',
    heroSubtitle: 'زيت الأرغان، زعفران تالوين، عسل الفربيون، أملو حرفي. اكتشف أسرار صنع كل كنز.',
    videoPlayLabel: 'تشغيل الفيديو',
    introTitle:   'من أرض المغرب إلى مائدتك',
    introSubtitle: 'مصنوع يدوياً باحترام الحرفة الأصيلة',
    introBody:    'في Myrass، كل منتج حكاية أرض وحرفة وشغف. ينتقي حرفيّونا ويحصدون ويحوّلون بأيديهم أجود مكونات التراث المغربي لتقديم جودة لا مثيل لها دون إضافات، دون تنازلات، مع تتبع كامل من المصدر حتى بابك.',
    seeMore: 'عرض المزيد',
    sections: [
      {
        title: 'زيت الزيتون المغربي — ضغط بارد، جبال الأطلس',
        lines: [],
        intro: 'اكتشف زيت الزيتون البكر الممتاز المغربي، معصور على البارد من جبال الأطلس. طبيعي 100%، خالٍ من الإضافات، غني بالبوليفينولات وأوميغا-9. زيت زيتون عالي الجودة، يُحصد يدوياً ويُستخرج في أقل من 24 ساعة للحفاظ على كل فوائده الصحية.',
        bullets: [
          'حصاد 100% يدوي عند الفجر',
          'عصر بارد في أقل من 24 ساعة',
          'صفر إضافات أو مواد حافظة',
          'غني بالبوليفينولات وأوميغا-9',
          'حمض الأوليك > 73%، جودة متميزة',
        ],
       imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776785626/pexels-i-brahim-yazgan-706156449-29505941_jsjt6q.jpg',
        imageAlt: 'زيت الزيتون البكر الممتاز المغربي معصور بارد — جبال الأطلس المغرب',
        textFirst: true,
      },
      {
        title: 'أملو مغربي حرفي — معجون اللوز وزيت الأرغان والعسل',
        lines: [],
        intro: 'أملو مغربي أصيل، محضَّر بالطريقة الأمازيغية التقليدية: لوز محمّص وزيت أرغان خالص وعسل جبلي خام. بدون مواد حافظة، بدون زيت نخيل. زبدة المكسرات الطبيعية المغربية، مثالية للإفطار أو كوجبة خفيفة صحية.',
        bullets: [
          'تحميص اللوز على نار حطب هادئة',
          'طحن تقليدي بالرحى الحجرية',
          'زيت أرغان خالص من الضغطة الأولى',
          'عسل جبلي خام غير مبستر',
          'دون مواد حافظة أو مثبتات صناعية',
        ],
         imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776786349/t%C3%A9l%C3%A9chargement_cs1wh5.jpg',
        imageAlt: 'أملو مغربي حرفي — لوز زيت أرغان عسل وصفة أمازيغية',
        textFirst: false,
      },
      {
        title: 'عسل الفربيون المغربي — عسل أبيض طبيعي نادر، إنتاج حرفي',
        lines: [],
        intro: 'عسل الفربيون المغربي، من أندر أنواع العسل في العالم. أبيض كريمي لؤلؤي، يُستخرج على البارد، غير مسخّن وغير مُرشَّح صناعياً. عسل أحادي الزهرة طبيعي 100%، غني بالإنزيمات ومضادات الأكسدة، بخصائص مهدِّئة طبيعية.',
        bullets: [
          'عسل أحادي الزهرة 100% طبيعي من الفربيون',
          'تربية نحل تقليدية في المرتفعات',
          'استخراج على البارد، إنزيمات وفيتامينات محفوظة',
          'غير مسخّن ولا مُرشَّح صناعياً',
          'غني بمضادات الأكسدة وخصائص مهدِّئة طبيعية',
        ],
               imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776786653/spyros-skareas-WKnE3gf_Y88-unsplash_ol2g4p.jpg',
        imageAlt: 'عسل الفربيون المغربي الأبيض الطبيعي النادر — إنتاج حرفي في المرتفعات',
        textFirst: true,
      },
      {
        title: 'زيت الأرغان الخالص المغربي — تعاونيات نسائية، ضغط بارد سوس ماسة',
        lines: [],
        intro: 'زيت الأرغان الغذائي الخالص، تنتجه تعاونيات نسائية معتمدة في منطقة سوس ماسة بالمغرب. مضغوط على البارد، بكر وغير مكرر. غني بفيتامين E وأوميغا-6 وأوميغا-9. زيت الأرغان المغربي الأصيل للطبخ والعناية بالبشرة.',
        bullets: [
          'تعاونيات نسائية معتمدة في سوس ماسة',
          'كسر يدوي لنوى الأرغان',
          'ضغط بارد دون مذيب كيميائي',
          'غني بفيتامين E (توكوفيرولات) والستيرولات النباتية',
          'زيت أرغان بكر غير مكرر، غذائي وتجميلي',
        ],
                                          imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776253958/pexels-pabloramon-18076611_bwwnvo.jpg',
        imageAlt: 'زيت الأرغان الخالص المغربي الغذائي — تعاونية نسائية سوس ماسة ضغط بارد',
        textFirst: false,
      },
      {
        title: 'زعفران تالوين المغربي — زعفران خالص 100%، بيان جغرافي محمي',
        lines: [],
        intro: 'زعفران تالوين، الزعفران المغربي الحاصل على البيان الجغرافي المحمي، من أقوى وأنقى أنواع الزعفران في العالم. يُحصد يدوياً قبل الفجر ويُجفَّف طبيعياً للحفاظ على كامل قوته التلوينية والعطرية. 150,000 زهرة لكل كيلوغرام كنز نادر مباشرة من المنتجين.',
        bullets: [
          'حصاد 100% يدوي قبل الفجر',
          '150,000 زهرة للكيلوغرام الواحد',
          'تجفيف طبيعي، روائح ومركبات فعّالة محفوظة',
          'بيان جغرافي محمي، زعفران تالوين',
          'من أعلى قدرات التلوين والعطر في العالم',
        ],
         imageSrc: 'https://res.cloudinary.com/dzajgsdwg/image/upload/v1776948437/pexels-rubaitulazad-19029722_wz5jkc.jpg',
        imageAlt: 'زعفران تالوين المغربي خالص 100% — بيان جغرافي محمي حصاد يدوي',
        textFirst: true,
      },
    ],
  },
};