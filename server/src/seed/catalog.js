/**
 * ShagunShopping catalog — best-selling lines from each of the 18 brands
 * stocked at the counter. Shared by seed.js (database) and
 * scripts/generate-product-art.mjs (the product artwork in client/public/products).
 *
 * `form` drives the artwork: tube | jar | bottle | pump | dropper | spray |
 * compact | lipstick | rollon
 * `hue` is the brand accent (HSL hue, 0-360) used in the artwork.
 *
 * Prices: `mrp` is printed pack MRP, `price` is the shop's below-MRP price.
 * Edit freely — the admin panel can also change everything after seeding.
 */

const P = (o) => o;

export const CATALOG = [
  // ---------------- Lotus Herbals (hue 350) ----------------
  P({
    slug: 'lotus-safe-sun-matte-gel-spf50',
    name: 'Safe Sun UV Screen Matte Gel SPF 50 PA+++',
    brand: 'Lotus Herbals',
    category: 'Skincare',
    form: 'tube',
    hue: 350,
    size: '100 g',
    mrp: 495,
    price: 396,
    stock: 40,
    featured: true,
    description:
      "India's favourite everyday sunscreen. This lightweight gel gives broad-spectrum SPF 50 PA+++ protection with a completely matte, non-greasy finish — no white cast, no shine, even in Meerut summers. Preservative-free and suited to oily and combination skin.",
    ingredients:
      'Vanilla extract, Comfrey extract, UV filters (broad spectrum), lightweight gel base. Dermatologically tested, PABA-free.',
    howToUse:
      'Apply generously on face and neck 15–20 minutes before stepping out. Reapply every 3–4 hours during long sun exposure.',
  }),
  P({
    slug: 'lotus-whiteglow-gel-creme',
    name: 'WhiteGlow Skin Brightening Gel Crème SPF 25',
    brand: 'Lotus Herbals',
    category: 'Skincare',
    form: 'jar',
    hue: 340,
    size: '60 g',
    mrp: 385,
    price: 316,
    stock: 35,
    description:
      'The bestselling brightening moisturiser with a unique gel-crème texture that hydrates like a cream and feels light like a gel. Gives an instant dewy glow while SPF 25 shields against daily sun damage.',
    ingredients:
      'Grape extract, mulberry extract, saxifraga extract, milk enzymes, SPF 25 sun filters.',
    howToUse:
      'Massage a small amount onto cleansed face and neck every morning. Follow with sunscreen for extended outdoor time.',
  }),
  P({
    slug: 'lotus-apriscrub',
    name: 'Herbals Apriscrub Fresh Apricot Scrub',
    brand: 'Lotus Herbals',
    category: 'Skincare',
    form: 'tube',
    hue: 25,
    size: '100 g',
    mrp: 245,
    price: 199,
    stock: 50,
    description:
      'A gentle exfoliating scrub with natural apricot walnut shell particles that lift away dead cells, blackheads and dullness, leaving skin fresh, smooth and polished. A weekly ritual in lakhs of Indian homes.',
    ingredients: 'Apricot kernel granules, walnut shell powder, wheatgerm oil, elm bark extract.',
    howToUse:
      'On damp skin, massage gently in circular motions for 1–2 minutes avoiding the eye area, then rinse. Use 2–3 times a week.',
  }),

  // ---------------- Fixderma (hue 205) ----------------
  P({
    slug: 'fixderma-shadow-spf50-gel',
    name: 'Shadow SPF 50+ Sunscreen Gel',
    brand: 'Fixderma',
    category: 'Skincare',
    form: 'tube',
    hue: 205,
    size: '75 g',
    mrp: 449,
    price: 359,
    stock: 30,
    featured: true,
    description:
      'A dermatologist-trusted broad-spectrum sunscreen that protects against UVA, UVB and visible light. The gel base absorbs fast without stickiness, making it ideal under makeup and for daily office wear.',
    ingredients:
      'Avobenzone, octocrylene and complementary UV filters in a quick-absorbing, non-comedogenic gel base.',
    howToUse:
      'Dot generously over face, ears and neck 15 minutes before sun exposure. Reapply after swimming or heavy sweating.',
  }),
  P({
    slug: 'fixderma-nigrifix-cream',
    name: 'Nigrifix Cream for Acanthosis Nigricans',
    brand: 'Fixderma',
    category: 'Skincare',
    form: 'jar',
    hue: 215,
    size: '50 g',
    mrp: 320,
    price: 269,
    stock: 25,
    description:
      'A targeted treatment cream for dark, thickened skin on the neck, knuckles, elbows and underarms. Exfoliates gently and evens tone with consistent use — one of the most repurchased derma products at our counter.',
    ingredients: 'Lactic acid, urea, salicylic acid and emollients in a smoothing cream base.',
    howToUse:
      'Apply a thin layer on affected areas at night after cleansing. Use sunscreen on treated areas during the day. Visible change typically takes 4–6 weeks.',
  }),
  P({
    slug: 'fixderma-salyzap-face-wash',
    name: 'Salyzap Anti-Acne Face Wash',
    brand: 'Fixderma',
    category: 'Skincare',
    form: 'pump',
    hue: 195,
    size: '100 ml',
    mrp: 399,
    price: 330,
    stock: 30,
    description:
      'A salicylic-acid face wash that goes deep into pores to clear oil, blackheads and acne-causing buildup without stripping the skin. Ideal for oily, breakout-prone skin in humid weather.',
    ingredients: 'Salicylic acid 2%, tea tree oil, soothing botanical cleansing base.',
    howToUse:
      'Work a coin-sized amount into a lather on wet face morning and evening, massage 30–60 seconds, rinse well. Follow with an oil-free moisturiser.',
  }),

  // ---------------- Pilgrim (hue 275) ----------------
  P({
    slug: 'pilgrim-niacinamide-serum',
    name: '10% Niacinamide Face Serum',
    brand: 'Pilgrim',
    category: 'Skincare',
    form: 'dropper',
    hue: 275,
    size: '30 ml',
    mrp: 595,
    price: 476,
    stock: 45,
    featured: true,
    description:
      'The viral pore-refining serum. 10% niacinamide with zinc visibly reduces open pores, acne marks and excess oil while strengthening the skin barrier. Lightweight, fragrance-free and layerable under moisturiser.',
    ingredients: 'Niacinamide 10%, zinc PCA, hyaluronic acid, white lotus extract.',
    howToUse:
      'After cleansing, apply 3–4 drops on face and neck, pat in, then moisturise. Use morning and night; always follow with SPF in the day.',
  }),
  P({
    slug: 'pilgrim-redensyl-hair-serum',
    name: 'Redensyl 3% + Anagain 4% Hair Growth Serum',
    brand: 'Pilgrim',
    category: 'Haircare',
    form: 'pump',
    hue: 265,
    size: '50 ml',
    mrp: 745,
    price: 596,
    stock: 30,
    description:
      'A clinically-inspired scalp serum for hair fall and thinning. Redensyl and Anagain target dormant follicles to support visibly denser-looking hair over 8–12 weeks of daily use. Non-sticky and safe with oils and styling.',
    ingredients: 'Redensyl 3%, Anagain 4%, biotin, rice water, caffeine.',
    howToUse:
      'Part hair and apply 1 ml (4–5 pumps) directly on the scalp once daily. Massage in; do not rinse. Consistency matters more than quantity.',
  }),
  P({
    slug: 'pilgrim-lava-ash-face-wash',
    name: 'Volcanic Lava Ash Face Wash',
    brand: 'Pilgrim',
    category: 'Skincare',
    form: 'tube',
    hue: 285,
    size: '100 ml',
    mrp: 425,
    price: 340,
    stock: 28,
    description:
      'A deep-cleansing Korean-beauty-inspired face wash with volcanic lava ash that pulls out dirt, oil and pollution from pores while yugdugu extract keeps skin soft, never squeaky-tight.',
    ingredients: 'Volcanic lava ash, activated charcoal, white lotus, camellia extract.',
    howToUse: 'Massage onto damp skin for a minute and rinse. Use twice daily; follow with moisturiser.',
  }),

  // ---------------- Mitvana (hue 155) ----------------
  P({
    slug: 'mitvana-daily-moisturising-lotion',
    name: 'Daily Moisturising Lotion',
    brand: 'Mitvana',
    category: 'Body Care',
    form: 'pump',
    hue: 155,
    size: '100 ml',
    mrp: 275,
    price: 234,
    stock: 26,
    description:
      'A dermatologically developed light lotion that keeps skin comfortable through the day. Herbal actives calm dryness and irritation, making it a favourite for sensitive and post-procedure skin.',
    ingredients: 'Aloe vera, liquorice extract, wheat germ oil, vitamin E in a non-greasy emollient base.',
    howToUse: 'Smooth over face and body after bathing, while skin is still slightly damp, once or twice daily.',
  }),
  P({
    slug: 'mitvana-anti-dandruff-shampoo',
    name: 'Anti-Dandruff Shampoo with Rosemary',
    brand: 'Mitvana',
    category: 'Haircare',
    form: 'bottle',
    hue: 165,
    size: '100 ml',
    mrp: 250,
    price: 213,
    stock: 24,
    description:
      'A gentle therapeutic shampoo that controls flaking and itching while rosemary and tea tree keep the scalp fresh. Mild enough for regular use without drying out hair.',
    ingredients: 'Piroctone olamine, rosemary oil, tea tree oil, conditioning cleansing base.',
    howToUse:
      'Massage into wet scalp, leave for 2–3 minutes so the actives can work, then rinse. Use 2–3 times a week.',
  }),

  // ---------------- Dot & Key (hue 45) ----------------
  P({
    slug: 'dot-key-vitc-moisturizer',
    name: 'Vitamin C + E Super Bright Moisturizer',
    brand: 'Dot & Key',
    category: 'Skincare',
    form: 'jar',
    hue: 45,
    size: '60 g',
    mrp: 595,
    price: 476,
    stock: 42,
    featured: true,
    description:
      "The moisturiser that made Dot & Key a household name. Vitamin C brightens and fades spots while vitamin E and mango butter deeply nourish — skin looks lit-from-within in weeks. Suits normal to dry skin beautifully.",
    ingredients: 'Vitamin C (ethyl ascorbic acid), vitamin E, mango butter, kakadu plum, illipe butter.',
    howToUse:
      'Scoop a small amount and massage upward on clean face and neck, morning and night. Layer over serum, under sunscreen.',
  }),
  P({
    slug: 'dot-key-vitc-sunscreen',
    name: 'Vitamin C + E Sunscreen SPF 50+ PA++++',
    brand: 'Dot & Key',
    category: 'Skincare',
    form: 'tube',
    hue: 40,
    size: '50 g',
    mrp: 445,
    price: 356,
    stock: 48,
    featured: true,
    description:
      'A bestselling brightening sunscreen that pairs SPF 50+ PA++++ protection with vitamin C glow. Zero white cast, water-light texture, and it doubles as a smooth makeup base.',
    ingredients: 'Vitamin C, vitamin E, broad-spectrum UV filters, niacinamide.',
    howToUse:
      'Apply two finger-lengths across face and neck as the last step of morning skincare. Reapply every 3–4 hours outdoors.',
  }),
  P({
    slug: 'dot-key-strawberry-lip-balm',
    name: 'Strawberry Dew Tinted Lip Balm SPF 30',
    brand: 'Dot & Key',
    category: 'Makeup',
    form: 'lipstick',
    hue: 355,
    size: '12 g',
    mrp: 345,
    price: 276,
    stock: 38,
    description:
      'A juicy tinted balm that drenches lips in moisture, leaves a fresh strawberry-pink flush and protects with SPF 30. The everyday no-makeup lip that sells out again and again.',
    ingredients: 'Strawberry extract, shea butter, jojoba oil, vitamin E, SPF 30 filters.',
    howToUse: 'Glide directly on bare lips as often as needed. Layers prettily over lipstick too.',
  }),

  // ---------------- Moxie (hue 315) ----------------
  P({
    slug: 'moxie-big-bounce-shampoo',
    name: 'Big Bounce Volumising Shampoo',
    brand: 'Moxie',
    category: 'Haircare',
    form: 'bottle',
    hue: 315,
    size: '250 ml',
    mrp: 549,
    price: 467,
    stock: 20,
    description:
      'Made for Indian hair that falls flat — a sulphate-free wash that lifts roots, adds airy volume and keeps lengths soft. Gentle enough for coloured and chemically treated hair.',
    ingredients: 'Rice protein, biotin, pea peptides, mild sulphate-free surfactants.',
    howToUse:
      'Lather through wet scalp and lengths, rinse thoroughly. Pair with a light conditioner on mid-lengths only for maximum bounce.',
  }),
  P({
    slug: 'moxie-frizz-fix-cream',
    name: 'Smooth Moves Anti-Frizz Leave-In Cream',
    brand: 'Moxie',
    category: 'Haircare',
    form: 'tube',
    hue: 320,
    size: '150 g',
    mrp: 499,
    price: 424,
    stock: 22,
    description:
      'A humidity-proof leave-in that defines waves, tames flyaways and adds mirror shine without stiffness or grease. Your monsoon hair insurance.',
    ingredients: 'Murumuru butter, argan oil, flaxseed extract, heat-protective polymers.',
    howToUse:
      'Work a small amount through damp hair from mid-length to ends. Air dry or blow dry — do not rinse.',
  }),

  // ---------------- Mitchell (hue 95) ----------------
  P({
    slug: 'mitchell-tea-tree-shampoo',
    name: 'Tea Tree Invigorating Shampoo',
    brand: 'Mitchell',
    category: 'Haircare',
    form: 'bottle',
    hue: 95,
    size: '300 ml',
    mrp: 950,
    price: 808,
    stock: 15,
    description:
      'The salon-favourite deep cleanse. Tea tree oil, peppermint and lavender wash away buildup and leave the scalp cool, tingling and refreshed — hair feels full and clean for days.',
    ingredients: 'Tea tree oil, peppermint, lavender, gentle cleansing complex.',
    howToUse:
      'Massage into wet hair and scalp, enjoy the tingle for a minute, rinse. Suitable for all hair types; use 2–4 times a week.',
  }),
  P({
    slug: 'mitchell-moisture-conditioner',
    name: 'Instant Moisture Daily Conditioner',
    brand: 'Mitchell',
    category: 'Haircare',
    form: 'bottle',
    hue: 105,
    size: '300 ml',
    mrp: 990,
    price: 842,
    stock: 15,
    description:
      'A salon-grade daily conditioner that quenches dry, frizzy hair with awapuhi extract, detangles instantly and leaves lengths silky without weighing them down.',
    ingredients: 'Awapuhi extract, hydrolysed proteins, panthenol, conditioning emollients.',
    howToUse:
      'After shampooing, apply from mid-length to ends, leave 1–2 minutes and rinse cool for extra shine.',
  }),

  // ---------------- Nivok (hue 230) ----------------
  P({
    slug: 'nivok-keratin-shampoo',
    name: 'Professional Keratin Smooth Shampoo',
    brand: 'Nivok',
    category: 'Haircare',
    form: 'bottle',
    hue: 230,
    size: '300 ml',
    mrp: 445,
    price: 378,
    stock: 20,
    description:
      'A keratin-enriched smoothing wash that repairs rough, chemically treated hair, seals frizz and extends the life of salon smoothening treatments.',
    ingredients: 'Hydrolysed keratin, argan oil, wheat protein, smoothing conditioners.',
    howToUse: 'Lather gently through wet hair, rinse, and follow with the matching conditioner or a hair serum.',
  }),
  P({
    slug: 'nivok-argan-serum',
    name: 'Argan Hair Serum',
    brand: 'Nivok',
    category: 'Haircare',
    form: 'pump',
    hue: 240,
    size: '100 ml',
    mrp: 350,
    price: 298,
    stock: 24,
    description:
      'A lightweight finishing serum with Moroccan argan oil that adds instant gloss, cuts frizz and protects against heat styling and sun damage.',
    ingredients: 'Argan oil, vitamin E, silk proteins, UV protectants.',
    howToUse:
      'Rub 2–3 drops between palms and smooth over damp or dry hair, focusing on ends. Style as usual.',
  }),

  // ---------------- Swiss Beauty (hue 330) ----------------
  P({
    slug: 'swiss-beauty-ultimate-kajal',
    name: 'Ultimate Intense Black Kajal',
    brand: 'Swiss Beauty',
    category: 'Makeup',
    form: 'lipstick',
    hue: 330,
    size: '0.35 g',
    mrp: 199,
    price: 169,
    stock: 60,
    featured: true,
    description:
      'One-stroke intense black kajal that stays smudge-proof and waterproof for up to 12 hours. Creamy glide, no tugging — the single most repurchased makeup item at our counter.',
    ingredients: 'Carnauba wax, vitamin E, deep-black mineral pigments. Dermatologically tested.',
    howToUse:
      'Twist up 2 mm and glide along the waterline and lash line. No sharpening needed; cap tightly after use.',
  }),
  P({
    slug: 'swiss-beauty-baked-highlighter',
    name: 'Baked Highlighter & Blusher Palette',
    brand: 'Swiss Beauty',
    category: 'Makeup',
    form: 'compact',
    hue: 20,
    size: '7 g',
    mrp: 349,
    price: 297,
    stock: 35,
    description:
      'Oven-baked, ultra-pigmented shimmer that melts into skin for a molten glow. Works as highlighter, blush topper and even eyeshadow — one pan, endless looks.',
    ingredients: 'Baked mineral pigments, mica, nourishing oils for a non-chalky finish.',
    howToUse:
      'Sweep on cheekbones, brow bone and nose bridge with a fluffy brush. Spritz the brush with fixer for a wet-look glow.',
  }),
  P({
    slug: 'swiss-beauty-matte-lip',
    name: 'Real Matte Liquid Lipstick',
    brand: 'Swiss Beauty',
    category: 'Makeup',
    form: 'bottle',
    hue: 345,
    size: '6 ml',
    mrp: 249,
    price: 212,
    stock: 45,
    description:
      'A transfer-proof liquid lipstick with one-swipe full coverage that dries to a weightless velvet matte and survives chai, meals and masks.',
    ingredients: 'Long-wear film formers, vitamin E, jojoba oil, intense colour pigments.',
    howToUse:
      'Outline lips with the applicator tip, fill in, and let it set 60 seconds without pressing lips together.',
  }),

  // ---------------- Insight (hue 260) ----------------
  P({
    slug: 'insight-non-transfer-lipcolor',
    name: 'Non-Transfer Waterproof Lip Color',
    brand: 'Insight',
    category: 'Makeup',
    form: 'bottle',
    hue: 260,
    size: '4 ml',
    mrp: 225,
    price: 191,
    stock: 40,
    description:
      'Budget-friendly and truly budge-proof — this waterproof liquid colour stays put through the day with a comfortable matte finish that never cracks.',
    ingredients: 'Waterproof polymers, castor oil, vitamin E, matte pigments.',
    howToUse: 'Apply on clean, dry lips and allow a minute to set. Remove with an oil-based cleanser.',
  }),
  P({
    slug: 'insight-3d-fixer',
    name: '3D Makeup Fixer Spray',
    brand: 'Insight',
    category: 'Makeup',
    form: 'spray',
    hue: 250,
    size: '100 ml',
    mrp: 375,
    price: 319,
    stock: 30,
    description:
      'A fine mist that locks makeup in place for up to 16 hours, melts powders into a skin-like finish and resists sweat and humidity — a kit essential for weddings and functions.',
    ingredients: 'Film-forming setting agents, glycerin, aloe vera, cucumber extract.',
    howToUse:
      "Hold 8–10 inches from the face and mist 3–4 times in an 'X' and 'T' motion after finishing makeup. Let it air dry.",
  }),

  // ---------------- Deconstruct (hue 190) ----------------
  P({
    slug: 'deconstruct-gel-sunscreen',
    name: 'Gel Sunscreen SPF 55+ PA+++',
    brand: 'Deconstruct',
    category: 'Skincare',
    form: 'tube',
    hue: 190,
    size: '50 g',
    mrp: 349,
    price: 297,
    stock: 50,
    featured: true,
    description:
      "The internet's favourite no-white-cast sunscreen. A featherlight gel with SPF 55+ PA+++ that layers invisibly on every skin tone and never pills under makeup. Fragrance-free, science-first formulation.",
    ingredients: 'Hybrid UV filter system, niacinamide, hyaluronic acid. Fragrance-free, non-comedogenic.',
    howToUse:
      'Use two finger-lengths on face and neck every morning, 15 minutes before sun exposure. Reapply every 3–4 hours outdoors.',
  }),
  P({
    slug: 'deconstruct-clearing-serum',
    name: '10% Niacinamide + 0.3% Alpha Arbutin Clearing Serum',
    brand: 'Deconstruct',
    category: 'Skincare',
    form: 'dropper',
    hue: 185,
    size: '30 ml',
    mrp: 545,
    price: 463,
    stock: 32,
    description:
      'A no-nonsense serum that fades acne marks and dark spots while regulating oil. Transparent, fragrance-free formulation with concentrations backed by published research.',
    ingredients: 'Niacinamide 10%, alpha arbutin 0.3%, zinc, low-molecular hyaluronic acid.',
    howToUse:
      'Apply 3–4 drops on cleansed skin at night (and morning if tolerated). Follow with moisturiser; SPF is non-negotiable next day.',
  }),
  P({
    slug: 'deconstruct-oil-control-moisturizer',
    name: 'Oil Control Moisturizer with 2% Niacinamide',
    brand: 'Deconstruct',
    category: 'Skincare',
    form: 'jar',
    hue: 195,
    size: '50 g',
    mrp: 399,
    price: 339,
    stock: 28,
    description:
      'A gel moisturiser that hydrates deeply yet keeps shine away for hours. Sebostatic actives balance oil production, making it the ideal partner for acne-prone routines.',
    ingredients: 'Niacinamide 2%, sepicontrol, hyaluronic acid, oil-free hydrators.',
    howToUse: 'Apply a pea-sized amount on face and neck after serum, morning and night.',
  }),

  // ---------------- Dr Su (hue 175) ----------------
  P({
    slug: 'dr-su-kojic-cream',
    name: 'Kojic Acid Skin Brightening Cream',
    brand: 'Dr Su',
    category: 'Skincare',
    form: 'jar',
    hue: 175,
    size: '50 g',
    mrp: 499,
    price: 424,
    stock: 22,
    description:
      'A targeted brightening cream that visibly fades tanning, pigmentation and uneven patches with kojic acid and vitamin C, while butters keep skin comfortable — results without harshness.',
    ingredients: 'Kojic acid, vitamin C, alpha arbutin, shea butter, liquorice extract.',
    howToUse:
      'Apply on cleansed skin at night, focusing on pigmented areas. Always wear sunscreen the next morning.',
  }),
  P({
    slug: 'dr-su-sunscreen-spf50',
    name: 'Ultra-Light Sunscreen SPF 50 PA+++',
    brand: 'Dr Su',
    category: 'Skincare',
    form: 'tube',
    hue: 170,
    size: '50 ml',
    mrp: 550,
    price: 468,
    stock: 20,
    description:
      'A silky, quick-absorbing daily sunscreen with broad-spectrum SPF 50 PA+++ that leaves a soft, natural finish — no greasiness, no white film, comfortable even on sensitive skin.',
    ingredients: 'Broad-spectrum UV filters, vitamin E, aloe vera, ceramide complex.',
    howToUse: 'Apply liberally as the last skincare step each morning; reapply during extended sun time.',
  }),

  // ---------------- Ras Luxury (hue 15) ----------------
  P({
    slug: 'ras-radiance-elixir',
    name: 'Radiance Beauty Boosting Day Elixir',
    brand: 'Ras Luxury',
    category: 'Skincare',
    form: 'dropper',
    hue: 15,
    size: '15 ml',
    mrp: 1450,
    price: 1233,
    stock: 12,
    featured: true,
    description:
      "India's iconic farm-to-face facial oil. A 100% natural blend of 13 precious plant oils that sinks in instantly, blurring dullness into a lit-from-within radiance. Luxury skincare, grown and pressed in India.",
    ingredients:
      'Saffron, rosehip, sea buckthorn, jojoba, sweet almond and 8 more cold-pressed botanical oils. No mineral oil, no fragrance.',
    howToUse:
      'Warm 3–4 drops between palms and press into damp skin after moisturiser, morning or night. Also lovely mixed into foundation for a dewy finish.',
  }),
  P({
    slug: 'ras-lip-cheek-tint',
    name: 'Lip & Cheek Tint — Rosy Nude',
    brand: 'Ras Luxury',
    category: 'Makeup',
    form: 'jar',
    hue: 5,
    size: '5 g',
    mrp: 795,
    price: 676,
    stock: 18,
    description:
      'A buttery multitasker that melts into lips and cheeks for a natural rosy flush. Made with plant butters and oils, it treats while it tints — clean beauty in one little pot.',
    ingredients: 'Kokum butter, almond oil, beetroot-derived pigment, vitamin E.',
    howToUse:
      'Dab with a fingertip on the apples of cheeks and blend upward; press onto lips for a matching wash of colour.',
  }),

  // ---------------- Oriflame (hue 35) ----------------
  P({
    slug: 'oriflame-tender-care',
    name: 'Tender Care Protecting Balm',
    brand: 'Oriflame',
    category: 'Skincare',
    form: 'jar',
    hue: 35,
    size: '15 ml',
    mrp: 449,
    price: 382,
    stock: 26,
    description:
      "The little red pot loved worldwide for 50+ years. A multipurpose balm that rescues chapped lips, dry cuticles, rough elbows and flaky patches overnight — every handbag needs one.",
    ingredients: 'Beeswax, vegetable oils, vitamin E in a protective emollient balm.',
    howToUse: 'Massage a small amount wherever skin feels dry — lips, cuticles, elbows, cheekbones for glow.',
  }),
  P({
    slug: 'oriflame-milk-honey-body-cream',
    name: 'Milk & Honey Gold Nourishing Body Cream',
    brand: 'Oriflame',
    category: 'Body Care',
    form: 'jar',
    hue: 40,
    size: '250 ml',
    mrp: 799,
    price: 679,
    stock: 20,
    description:
      'A rich, fast-absorbing body cream with organically sourced milk and honey extracts that leaves skin pillow-soft and delicately scented for 24 hours. A winter bestseller year after year.',
    ingredients: 'Organic milk proteins, honey extract, shea butter, glycerin.',
    howToUse: 'Massage generously all over the body after bathing, paying extra attention to elbows and knees.',
  }),
  P({
    slug: 'oriflame-amber-elixir-edp',
    name: 'Amber Elixir Eau de Parfum',
    brand: 'Oriflame',
    category: 'Fragrance',
    form: 'spray',
    hue: 30,
    size: '50 ml',
    mrp: 2999,
    price: 2549,
    stock: 10,
    description:
      'A warm, sensual signature scent built around precious amber, sparkling mandarin and vanilla-kissed woods. Long-lasting sillage that feels expensive — because it is, just not at our counter.',
    ingredients: 'Top: mandarin, black currant. Heart: amber, heliotrope. Base: vanilla, sandalwood, musk.',
    howToUse: 'Spray on pulse points — wrists, neck, behind ears — after moisturising for longest wear.',
  }),

  // ---------------- Komeo Wellness (hue 140) ----------------
  P({
    slug: 'komeo-aloe-gel',
    name: 'Pure Aloe Vera Soothing Gel',
    brand: 'Komeo Wellness',
    category: 'Wellness',
    form: 'jar',
    hue: 140,
    size: '200 g',
    mrp: 299,
    price: 254,
    stock: 30,
    description:
      'A 99% pure aloe multi-gel for face, hair and body — cools sunburn, calms razor irritation, hydrates skin and doubles as a light hair gel. One jar, a dozen uses.',
    ingredients: 'Aloe barbadensis leaf juice (99%), vitamin E, cucumber extract.',
    howToUse: 'Apply a thin layer wherever skin needs cooling or hydration; use as an overnight face mask too.',
  }),
  P({
    slug: 'komeo-multivitamin-hair-oil',
    name: 'Multivitamin Herbal Hair Oil',
    brand: 'Komeo Wellness',
    category: 'Haircare',
    form: 'bottle',
    hue: 135,
    size: '100 ml',
    mrp: 349,
    price: 297,
    stock: 25,
    description:
      'A non-sticky herbal oil infused with bhringraj, amla and vitamins that strengthens roots, reduces hair fall and brings back natural shine with weekly champi.',
    ingredients: 'Bhringraj, amla, curry leaf, coconut oil, vitamins A, D & E.',
    howToUse:
      'Warm slightly and massage into the scalp with fingertips. Leave for at least an hour (or overnight), then shampoo.',
  }),

  // ---------------- Jovees (hue 120) ----------------
  P({
    slug: 'jovees-papaya-face-wash',
    name: 'Papaya Deep Cleansing Face Wash',
    brand: 'Jovees',
    category: 'Skincare',
    form: 'tube',
    hue: 120,
    size: '120 ml',
    mrp: 195,
    price: 166,
    stock: 55,
    featured: true,
    description:
      'A herbal bestseller for over two decades — papaya enzymes gently dissolve dullness and tan, giving clearer, brighter skin with every wash. Soap-free and suited to all skin types.',
    ingredients: 'Papaya fruit extract, neem, honey, mild herbal cleansing base.',
    howToUse: 'Massage on wet face for a minute morning and evening, rinse and pat dry.',
  }),
  P({
    slug: 'jovees-anti-blemish-cream',
    name: 'Anti Blemish Pigmentation Cream',
    brand: 'Jovees',
    category: 'Skincare',
    form: 'jar',
    hue: 115,
    size: '60 g',
    mrp: 425,
    price: 361,
    stock: 24,
    description:
      'An ayurvedic night treatment that works on stubborn dark spots, blemishes and uneven patches with time-tested botanicals — gentle, steady results the herbal way.',
    ingredients: 'Bearberry, mulberry, liquorice, saffron, almond oil.',
    howToUse: 'Dot on blemished areas after cleansing at night and massage until absorbed. Use daily for 8–10 weeks.',
  }),

  // ---------------- Aysun Herbal (hue 70) ----------------
  P({
    slug: 'aysun-aloe-face-wash',
    name: 'Herbal Aloe Vera Face Wash',
    brand: 'Aysun Herbal',
    category: 'Skincare',
    form: 'tube',
    hue: 70,
    size: '100 ml',
    mrp: 199,
    price: 169,
    stock: 30,
    description:
      'A soothing everyday cleanser with aloe and tulsi that removes dirt and oil without disturbing the skin barrier. Herbal freshness at a price that makes it easy to love.',
    ingredients: 'Aloe vera, tulsi, neem, glycerin, gentle plant-based cleansers.',
    howToUse: 'Use morning and evening on damp skin; massage gently and rinse.',
  }),
  P({
    slug: 'aysun-bhringraj-oil',
    name: 'Bhringraj Intensive Hair Oil',
    brand: 'Aysun Herbal',
    category: 'Haircare',
    form: 'bottle',
    hue: 75,
    size: '200 ml',
    mrp: 399,
    price: 339,
    stock: 22,
    description:
      "A traditional kesh-oil recipe slow-infused with bhringraj and 9 herbs to nourish roots, delay greying and deeply condition dry, frizzy hair — grandmother-approved.",
    ingredients: 'Bhringraj, brahmi, amla, hibiscus, fenugreek in a sesame-coconut oil base.',
    howToUse: 'Massage into scalp and lengths 2–3 times a week; leave for a few hours or overnight before washing.',
  }),

  // ---------------- Sanfe (hue 300) ----------------
  P({
    slug: 'sanfe-underarm-rollon',
    name: 'Underarm Brightening Roll-On',
    brand: 'Sanfe',
    category: 'Body Care',
    form: 'rollon',
    hue: 300,
    size: '50 ml',
    mrp: 349,
    price: 297,
    stock: 36,
    featured: true,
    description:
      'The viral 3-in-1 roll-on that visibly brightens dark underarms, controls odour and smooths ingrown bumps. Sleeveless-season confidence in a pocket-sized tube.',
    ingredients: 'Lactic acid, niacinamide, kojic acid, witch hazel, aloe vera.',
    howToUse:
      'Roll 2–3 swipes on clean, dry underarms daily (avoid right after shaving). Visible brightening in 3–4 weeks.',
  }),
  P({
    slug: 'sanfe-intimate-wash',
    name: 'Natural Intimate Wash',
    brand: 'Sanfe',
    category: 'Body Care',
    form: 'pump',
    hue: 295,
    size: '100 ml',
    mrp: 249,
    price: 212,
    stock: 30,
    description:
      'A pH-balanced daily intimate wash with lactic acid and calming botanicals that protects natural flora, prevents itching and keeps you fresh through the day — gynaecologist-approved gentleness.',
    ingredients: 'Lactic acid, sea buckthorn, tea tree oil, aloe vera. pH 3.5 balanced.',
    howToUse: 'Use a coin-sized amount with water on external intimate areas during your daily shower. Rinse well.',
  }),
];

export default CATALOG;
