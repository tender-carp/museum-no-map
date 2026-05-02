// js/prompt-templates.js

const STYLE_BASE = "high quality architectural photography, highly detailed, soft dramatic lighting, muted aesthetic, wabi-sabi, silent atmosphere";

const NO_TEXT_PREFIX = "NO TEXT, NO LETTERS, NO WORDS, NO TYPOGRAPHY, NO HANDWRITING, NO CALLIGRAPHY, NO CAPTIONS, NO SIGNATURES anywhere in the image.";

// =================================================================
// 展示室ごとのテーマバリエーション
// =================================================================
const THEME_VARIATIONS = [
  {
    roomMood: "introductory mood, subdued lighting, quiet atmosphere",
    roomDisplay: "displaying framed artworks or conceptual pieces sparsely on the walls",
    artTone: "subtle and introspective, gentle contrast, introducing the theme",
    artMedium: "2D media, drawing, painting, flat canvas, or conceptual photography",
    isCanvasFriendly: true,
    roomNegative: "",
    allowText: false
  },
  {
    roomMood: "expansive space, dynamic shadows",
    roomDisplay: "showcasing a massive standalone 3D sculpture in the center of the room, completely bare walls",
    artTone: "bold and dynamic, striking 3D focal point",
    artMedium: "3D sculpture, tactile physical object, structural form",
    isCanvasFriendly: false,
    roomNegative: "--no framed paintings, canvases on walls, 2D art, wall hangings, repeating square frames",
    allowText: false
  },
  {
    roomMood: "completely dark room, pitch black walls, focused dramatic light",
    roomDisplay: "an immersive light and space installation, glowing elements, completely empty architectural space",
    artTone: "ethereal, composed of pure light and deep shadow",
    artMedium: "light and shadow installation, atmospheric spatial art, luminous elements",
    isCanvasFriendly: false,
    roomNegative: "--no paintings, frames, canvases, physical artworks on walls, pedestals, traditional art",
    allowText: false
  },
  {
    roomMood: "archive aesthetic, museum vitrines, documents layout",
    roomDisplay: "exhibiting an extensive timeline, historical archives, or conceptual documents on large panels",
    artTone: "structured layout, analytical and historical",
    artMedium: "text-based conceptual art, archive materials, timeline display, infographics",
    isCanvasFriendly: true,
    roomNegative: "--no repeating square canvas frames, traditional painting frames",
    allowText: true
  },
  {
    roomMood: "darkened cinematic room, glowing projections",
    roomDisplay: "a dark space dedicated to glowing digital media art projected across the entire wall and floor",
    artTone: "glowing aesthetic, cinematic framing, immersive digital environment",
    artMedium: "video installation still, digital projection, glowing media art",
    isCanvasFriendly: false,
    roomNegative: "--no physical frames, canvases, traditional paintings, sculptures, daylight",
    allowText: false
  },
  {
    roomMood: "monumental scale, overwhelming presence, high ceiling",
    roomDisplay: "dominated by a massive site-specific installation that alters the architecture itself",
    artTone: "monumental absolute presence, majestic",
    artMedium: "colossal site-specific installation, monumental architectural structure",
    isCanvasFriendly: false,
    roomNegative: "--no small paintings, canvases, normal gallery setup, wall frames, square art",
    allowText: false
  },
  {
    roomMood: "industrial tension, subtle movement in the air",
    roomDisplay: "featuring complex kinetic sculptures or mechanical installations suspended from the ceiling",
    artTone: "mechanical precision, intricate moving parts, logical",
    artMedium: "kinetic sculpture, mechanical installation, suspended moving parts",
    isCanvasFriendly: false,
    roomNegative: "--no framed paintings, canvases on walls, 2D art",
    allowText: false
  },
  {
    roomMood: "natural light filtering in, serene balance",
    roomDisplay: "bringing natural elements indoors, an organic earthwork or water installation integrated into the floor",
    artTone: "organic and natural, living materials",
    artMedium: "organic installation, earthwork, water elements, raw stone and wood",
    isCanvasFriendly: false,
    roomNegative: "--no framed paintings, traditional gallery hanging, canvases",
    allowText: false
  }
];

// =================================================================
// 画風25種類の定義（英語キーワード／日本語ラベル）
// =================================================================
export const ART_STYLE_CATEGORIES = {
  // 西洋古典〜近世
  "medieval-religious": {
    label: "中世宗教画・イコン",
    keyword: "medieval religious icon painting, byzantine style, gold leaf background, hieratic figures, tempera on wood"
  },
  "renaissance": {
    label: "ルネサンス",
    keyword: "italian renaissance painting style, balanced composition, classical realism, sfumato technique, harmonious proportions"
  },
  "baroque": {
    label: "バロック",
    keyword: "baroque painting style, dramatic chiaroscuro, intense light and shadow, dynamic composition, rich deep colors"
  },
  "still-life-dutch": {
    label: "静物画(17世紀オランダ風)",
    keyword: "17th century dutch still life painting, vanitas, subtle dark background, glowing details, oil on canvas"
  },
  // 19世紀〜近代
  "romanticism": {
    label: "ロマン主義",
    keyword: "romanticism painting style, sublime nature, dramatic skies and storms, emotional grandeur, atmospheric"
  },
  "realism-landscape": {
    label: "写実主義の風景画",
    keyword: "19th century realist landscape painting, naturalistic detail, plein air, earthy palette, oil on canvas"
  },
  "impressionism": {
    label: "印象派",
    keyword: "impressionist painting style, visible brushstrokes, shimmering light, en plein air, soft natural colors"
  },
  "post-impressionism": {
    label: "後期印象派",
    keyword: "post-impressionist painting style, expressive thick brushstrokes, vivid emotional colors, swirling textures"
  },
  "symbolism": {
    label: "象徴主義",
    keyword: "symbolist painting style, dreamlike mythological imagery, mystical atmosphere, allegorical figures, muted jewel tones"
  },
  "art-nouveau": {
    label: "アール・ヌーヴォー",
    keyword: "art nouveau illustration style, flowing organic curves, decorative floral motifs, elegant linework, ornamental panels"
  },
  "expressionism": {
    label: "表現主義",
    keyword: "expressionist painting style, distorted forms, intense emotional colors, bold gestural brushwork, raw psychological tension"
  },
  "pointillism": {
    label: "点描画",
    keyword: "pointillist painting style, tiny dots of pure color, optical color mixing, luminous surface, neo-impressionist"
  },
  // 20世紀〜現代
  "art-deco": {
    label: "アール・デコ",
    keyword: "art deco illustration style, geometric symmetry, gold and black palette, streamlined elegance, stylized motifs"
  },
  "bauhaus": {
    label: "バウハウス・構成主義",
    keyword: "bauhaus and constructivist style, pure geometric forms, primary colors, functional abstraction, clean composition"
  },
  "surrealism": {
    label: "シュルレアリスム",
    keyword: "surrealist painting style, dreamlike juxtaposition, impossible architecture, subconscious imagery, meticulous detail"
  },
  "magic-realism": {
    label: "マジックリアリズム",
    keyword: "magic realism painting style, hyperreal stillness, quiet uncanny atmosphere, muted earthy palette, precise tempera detail"
  },
  "abstract-expressionism": {
    label: "抽象表現主義",
    keyword: "abstract expressionist painting style, large gestural strokes, action painting, raw emotional abstraction, oil on canvas"
  },
  "minimalism": {
    label: "ミニマリズム",
    keyword: "minimalist art style, extreme reduction, monochrome or limited palette, geometric simplicity, contemplative emptiness"
  },
  "pop-art": {
    label: "ポップアート",
    keyword: "pop art style, bold flat colors, mass culture imagery, screen-print aesthetic, graphic high contrast"
  },
  // 東洋・日本
  "ukiyo-e": {
    label: "浮世絵",
    keyword: "ukiyo-e japanese woodblock print style, flat areas of color, bold outlines, edo period aesthetic, washi paper texture"
  },
  "nihonga": {
    label: "日本画",
    keyword: "nihonga japanese painting style, mineral pigments on washi paper, gold leaf accents, refined empty space, subtle gradation"
  },
  "sumi-e": {
    label: "水墨画",
    keyword: "sumi-e ink wash painting, monochrome black ink on rice paper, expressive brushstrokes, zen aesthetic, ample empty space"
  },
  "chinese-shanshui": {
    label: "中国山水画",
    keyword: "chinese shanshui landscape painting, misty mountains and rivers, ink and light color on silk, atmospheric perspective, scholarly tradition"
  },
  // 特殊系
  "miniature-painting": {
    label: "細密画(ペルシャ・インド)",
    keyword: "persian and mughal miniature painting style, intricate ornamental detail, jewel-like colors, flat perspective, gold accents"
  },
  "naive-folk-art": {
    label: "民俗芸術・ナイーヴアート",
    keyword: "naive folk art style, untrained simplicity, bright primary colors, flat perspective, childlike innocence and joy"
  }
};

// =================================================================
// 建築様式10種類 → 相性の良い画風プール
// =================================================================
export const ARCHITECTURE_STYLES = {
  "brutalist concrete": {
    label: "ブルータリズム（重厚なコンクリート）",
    artPool: ["minimalism", "abstract-expressionism", "bauhaus", "magic-realism", "expressionism"]
  },
  "modern glass and steel": {
    label: "近代ガラス建築（光と透明感）",
    artPool: ["minimalism", "bauhaus", "pointillism", "art-deco", "pop-art"]
  },
  "industrial warehouse": {
    label: "インダストリアル（荒々しい倉庫跡）",
    artPool: ["expressionism", "abstract-expressionism", "pop-art", "surrealism", "naive-folk-art"]
  },
  "classic renaissance mansion": {
    label: "クラシック・洋館（歴史と装飾）",
    artPool: ["renaissance", "baroque", "still-life-dutch", "romanticism", "realism-landscape", "impressionism", "post-impressionism", "symbolism", "art-nouveau"]
  },
  "gothic cathedral": {
    label: "ゴシック大聖堂（垂直性と荘厳）",
    artPool: ["medieval-religious", "renaissance", "baroque", "symbolism", "surrealism"]
  },
  "mediterranean villa": {
    label: "地中海邸宅（白壁と陽光）",
    artPool: ["impressionism", "post-impressionism", "pointillism", "realism-landscape", "still-life-dutch", "symbolism", "art-nouveau"]
  },
  "traditional japanese wood": {
    label: "和風木造建築（木と陰影）",
    artPool: ["sumi-e", "nihonga", "chinese-shanshui", "minimalism"]
  },
  "japanese shoin-zukuri": {
    label: "京町家・書院造（数寄屋と庭園）",
    artPool: ["nihonga", "ukiyo-e", "sumi-e"]
  },
  "east-asian palace": {
    label: "中国・東アジア宮廷建築",
    artPool: ["chinese-shanshui", "miniature-painting", "sumi-e", "nihonga"]
  },
  "ruins and remnants": {
    label: "廃墟・遺跡（朽ちた壁と植生）",
    artPool: ["romanticism", "surrealism", "magic-realism", "symbolism", "expressionism", "naive-folk-art"]
  }
};

// =================================================================
// 画風ごとのモチーフプール（ユーザーが作品名・説明を入れなかった時の補充）
// =================================================================
const MOTIF_POOLS = {
  "medieval-religious": [
    "a haloed saint in prayer", "an angel descending through golden light", "a madonna and child enthroned",
    "a martyr holding a palm leaf", "a procession of pilgrims", "an evangelist writing in a manuscript"
  ],
  "renaissance": [
    "a contemplative young woman by a window", "a scholar in his study with books", "an idealized landscape with distant hills",
    "a mythological scene with classical figures", "a still life of fruit and vessels", "a pair of lovers in a garden"
  ],
  "baroque": [
    "a saint in a moment of divine ecstasy", "a banquet scene illuminated by candlelight", "a portrait emerging from deep shadow",
    "a stormy seascape with shipwreck", "a still life with a skull and extinguished candle", "an angel wrestling in dramatic light"
  ],
  "still-life-dutch": [
    "a glass of wine and lemon peel", "a vase of tulips with a fallen petal", "a table with cheese, bread and pewter",
    "a skull, hourglass and open book", "oysters and a silver platter", "musical instruments resting on a table"
  ],
  "romanticism": [
    "a lone wanderer above a sea of fog", "a ruined abbey under stormy skies", "a ship tossed in a turbulent ocean",
    "a moonlit forest with twisted trees", "an avalanche in a vast mountain range", "a solitary figure on a windswept cliff"
  ],
  "realism-landscape": [
    "a wheat field at harvest time", "peasants resting under an oak tree", "a quiet country road in autumn",
    "a riverside village in soft afternoon light", "a stone bridge over a slow stream", "a meadow with grazing cattle"
  ],
  "impressionism": [
    "a sunlit garden with dappled shadows", "a riverside in the morning haze", "a quiet street after rain",
    "a field of poppies under summer sky", "a harbor with sailboats at dusk", "a woman reading by an open window"
  ],
  "post-impressionism": [
    "a swirling night sky over a village", "sunflowers in a clay vase", "a cypress tree against a yellow field",
    "a self portrait with intense gaze", "a cafe terrace under stars", "olive trees twisting in the wind"
  ],
  "symbolism": [
    "a sphinx beside a wandering poet", "a woman with a swan in a misty pond", "a moonlit garden of strange flowers",
    "an angel of melancholy", "a forest of dreaming faces", "an island of the dead under a violet sky"
  ],
  "art-nouveau": [
    "a woman with flowing hair entwined in vines", "a peacock with elaborate plumage", "lilies and irises in decorative panels",
    "a goddess framed by flowering arches", "a young woman with stars in her hair", "a dancer wrapped in serpentine fabric"
  ],
  "expressionism": [
    "a screaming figure on a blood-red bridge", "a city street pulsing with anxiety", "two lovers in raw twisted embrace",
    "a sick child with hollow eyes", "a forest burning in green and black", "a self portrait with feverish colors"
  ],
  "pointillism": [
    "a sunday afternoon by the river", "a circus performer in stage light", "a lighthouse on a calm coast",
    "a garden party under summer sun", "a quiet harbor at dawn", "bathers on a sandy shore"
  ],
  "art-deco": [
    "a stylized figure of a flapper woman", "a streamlined locomotive in motion", "a skyscraper rising in geometric splendor",
    "a peacock fan in gold and black", "a dancer in metallic costume", "a sunburst over a calm sea"
  ],
  "bauhaus": [
    "interlocking red, yellow and blue rectangles", "a composition of pure circles and lines", "geometric abstraction in primary colors",
    "a constructivist architectural diagram", "a dynamic suprematist composition", "intersecting planes of color"
  ],
  "surrealism": [
    "melting clocks draped over a barren landscape", "an elephant on impossibly long legs", "a room where the floor becomes the sky",
    "a face composed of fruits and vegetables", "a train emerging from a fireplace", "a window opening onto another window"
  ],
  "magic-realism": [
    "a child standing in a vast empty field", "an open window with curtains gently moving", "a chair alone in a sunlit attic",
    "a girl walking up a hill in muted light", "a still farmhouse beneath a wide pale sky", "an old man at a kitchen table at dawn"
  ],
  "abstract-expressionism": [
    "sweeping gestural strokes of black and white", "fields of saturated color bleeding into each other", "dripping vertical lines on raw canvas",
    "explosive contrasts of red and indigo", "layered translucent forms in earth tones", "a single bold stroke crossing the canvas"
  ],
  "minimalism": [
    "a single horizontal line on a vast white field", "a black square on white", "three identical cubes in a row",
    "a gradient from pale gray to deeper gray", "a single circle of pure color", "evenly spaced vertical bars"
  ],
  "pop-art": [
    "a comic book panel with bold dots", "a row of soup cans repeating", "a portrait in saturated four-color print",
    "a giant lipstick on a bright background", "a stylized hamburger in flat color", "repeating images of a celebrity face"
  ],
  "ukiyo-e": [
    "a great wave curling over a distant mountain", "a courtesan adjusting her kimono", "travelers crossing a wooden bridge in rain",
    "mount fuji seen through cherry blossoms", "an actor striking a dramatic pose", "fireflies above a summer river"
  ],
  "nihonga": [
    "a single crane standing in shallow water", "plum blossoms against gold leaf", "an autumn maple branch in mist",
    "a deer in a field of silver grass", "koi swimming through lotus leaves", "a moon rising over a quiet pine"
  ],
  "sumi-e": [
    "a bamboo grove in a few brushstrokes", "a solitary plum branch", "a kingfisher on a reed",
    "distant mountains dissolving into mist", "an old pine clinging to a rock", "a single carp leaping from water"
  ],
  "chinese-shanshui": [
    "misty peaks rising above a hidden valley", "a scholar in a hut by a waterfall", "fishermen on a calm river at dusk",
    "twisted pines clinging to a cliff", "a stone bridge in the mountains", "a winding path disappearing into clouds"
  ],
  "miniature-painting": [
    "a prince in a flowering garden", "a court scene with musicians and dancers", "a hunting party on horseback",
    "lovers meeting beneath a cypress tree", "a poet writing beside a fountain", "a procession with elephants and banners"
  ],
  "naive-folk-art": [
    "a village with brightly painted houses", "a wedding parade with dancing animals", "a sun with a smiling face above a farm",
    "fishermen returning with colorful nets", "a tree of life with birds and fruit", "children playing in a sunlit square"
  ]
};

// =================================================================
// 構図バリエーション（画風横断で共通）
// =================================================================
const COMPOSITION_VARIATIONS = [
  "close-up composition, intimate framing",
  "wide landscape composition, expansive view",
  "vertical portrait composition, towering presence",
  "diagonal dynamic composition, sense of movement",
  "centered symmetric composition, calm balance",
  "off-center asymmetric composition, quiet tension",
  "low angle composition, looking upward",
  "high angle composition, looking downward"
];

// =================================================================
// シード用乱数（同じシードなら同じ結果）
// =================================================================
function seededPick(arr, seed) {
  if (!arr || arr.length === 0) return null;
  const idx = Math.abs(seed) % arr.length;
  return arr[idx];
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// =================================================================
// 「指定なし」「ランダム」のときに、実際の画風カテゴリを決定する
// =================================================================
export function resolveArtStyleCategory(category, architectureStyle, roomIndex = 0, museumSeed = "") {
  // 具体的な画風カテゴリが指定されていればそのまま返す
  if (category && category !== "" && category !== "random" && ART_STYLE_CATEGORIES[category]) {
    return category;
  }
  
  const archDef = ARCHITECTURE_STYLES[architectureStyle];
  const pool = archDef ? archDef.artPool : null;
  
  // 「ランダム」の場合：建築様式に対応するプールから美術館単位で1つ選ぶ
  if (category === "random") {
    if (pool && pool.length > 0) {
      const seed = hashString(museumSeed || "default") + 17;
      return seededPick(pool, seed);
    }
    // プールがない場合は全画風からランダム
    const allKeys = Object.keys(ART_STYLE_CATEGORIES);
    return seededPick(allKeys, hashString(museumSeed || "default"));
  }
  
  // 「指定なし」（空文字）の場合：展示室のテーマに合わせて緩やかに選ぶ
  // → ここでは建築様式プールの先頭から、室番号でずらして選ぶ（穏やかなバリエーション）
  if (pool && pool.length > 0) {
    return pool[roomIndex % pool.length];
  }
  
  return null; // 該当なし。フォールバックを呼び出し側で処理
}

// =================================================================
// 美術館全体でランダム決定された画風を 1 度だけ確定する関数
// （workshop.js 側で「偶然に任せる」ボタンや「ランダム」選択時に使う）
// =================================================================
export function pickRandomArtStyleForArchitecture(architectureStyle) {
  const archDef = ARCHITECTURE_STYLES[architectureStyle];
  const pool = archDef ? archDef.artPool : null;
  if (pool && pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const allKeys = Object.keys(ART_STYLE_CATEGORIES);
  return allKeys[Math.floor(Math.random() * allKeys.length)];
}

// =================================================================
// 美術館空間プロンプトの生成
// =================================================================
export function generateMuseumPrompts(input) {
  const outputs = [];
  
  const conceptAddon = input.concept ? `reflecting the concept of "${input.concept}", ` : "";
  
  outputs.push({
    id: "approach", type: "phase", refIndex: 0,
    title: "アプローチ（外観・入り口)",
    text: `${NO_TEXT_PREFIX} ${STYLE_BASE}, exterior of an art museum, ${input.style}, ${conceptAddon}located at ${input.location}, wide angle, lonely mood, --ar 16:9`
  });

  outputs.push({
    id: "entrance", type: "phase", refIndex: 1,
    title: "エントランス・ロビー",
    text: `${NO_TEXT_PREFIX} ${STYLE_BASE}, interior of an art museum lobby, ${input.style}, ${conceptAddon}empty, quiet, minimal design, --ar 16:9`
  });

  for (let i = 1; i <= input.rooms; i++) {
    const variation = THEME_VARIATIONS[(i - 1) % THEME_VARIATIONS.length];
    const prefix = variation.allowText ? "" : `${NO_TEXT_PREFIX} `;

    const artStyleContext = variation.isCanvasFriendly 
      ? `exhibiting art reflecting the aesthetic of [ ${input.artStyle} ]` 
      : `translating the aesthetic of [ ${input.artStyle} ] into an immersive 3D/spatial environment`;

    outputs.push({
      id: `exhibition${i}`, type: "phase", refIndex: 1 + i,
      title: `第${i}展示室`,
      text: `${prefix}${STYLE_BASE}, highly unique museum exhibition space, ${input.style}, ${conceptAddon}${variation.roomMood}, ${variation.roomDisplay}, ${artStyleContext} by ${input.artist}, cinematic composition ${variation.roomNegative} --ar 16:9`
    });
  }

  let nextPhaseIndex = 2 + input.rooms;

  if (input.hasCafe) {
    outputs.push({
      id: "cafe", type: "phase", refIndex: nextPhaseIndex++,
      title: "併設カフェ",
      text: `${NO_TEXT_PREFIX} ${STYLE_BASE}, empty minimal cafe space inside an art museum, ${conceptAddon}lonely, moody, serving ${input.cafeMenu}, --ar 16:9`
    });
  }
  if (input.hasShop) {
    outputs.push({
      id: "shop", type: "phase", refIndex: nextPhaseIndex++,
      title: "ミュージアムショップ",
      text: `${NO_TEXT_PREFIX} ${STYLE_BASE}, empty minimal museum shop interior, ${conceptAddon}abstract art books and silent souvenirs on shelves, calm interior, --ar 16:9`
    });
  }
  if (input.hasGarden) {
    outputs.push({
      id: "garden", type: "phase", refIndex: nextPhaseIndex++,
      title: "外部空間(中庭)",
      text: `${NO_TEXT_PREFIX} ${STYLE_BASE}, open-air sculpture garden inside a museum, ${input.style}, ${conceptAddon}natural light, wind blowing, serene landscape, --ar 16:9`
    });
  }
  if (input.hasRoof) {
    outputs.push({
      id: "roof", type: "phase", refIndex: nextPhaseIndex++,
      title: "屋上テラス",
      text: `${NO_TEXT_PREFIX} ${STYLE_BASE}, museum rooftop terrace, ${input.style}, ${conceptAddon}infinite sky, quiet horizon, overlooking ${input.location}, cinematic, --ar 16:9`
    });
  }

  return outputs;
}

// =================================================================
// 作品プロンプトの生成
// 画風カテゴリ・モチーフプール・構図バリエーションを統合
// =================================================================
export function generateArtworkPrompt(artStyle, title = "", desc = "", concept = "", medium = "", roomIndex = 0, options = {}) {
  const {
    artStyleCategory = "",     // 画風カテゴリのキー（例: "impressionism"）
    architectureStyle = "",    // 建築様式
    museumSeed = "",           // 美術館固有シード（ランダム時に同じ画風を保つ用）
    artworkSeed = ""           // 作品固有シード（モチーフ・構図のバリエーション用）
  } = options;

  // 1. 実際に使う画風カテゴリを解決する
  const resolvedCategory = resolveArtStyleCategory(artStyleCategory, architectureStyle, roomIndex, museumSeed);
  const categoryDef = resolvedCategory ? ART_STYLE_CATEGORIES[resolvedCategory] : null;
  const styleKeyword = categoryDef ? categoryDef.keyword : "";

  // 2. モチーフ：ユーザーが title/desc を入れていればそれを優先
  let motif;
  const userMotif = `${title} ${desc}`.trim();
  if (userMotif && userMotif.length > 0) {
    motif = userMotif;
    // 短すぎるモチーフには補強を入れる
    if (motif.length < 10 && !desc) {
      motif = `${motif}, expressed through pure abstract forms, no figures, no scenery`;
    }
  } else {
    // モチーフプールから作品ごとにランダム選択
    const pool = resolvedCategory ? MOTIF_POOLS[resolvedCategory] : null;
    if (pool && pool.length > 0) {
      const seed = hashString(artworkSeed || "art_" + Math.random());
      motif = seededPick(pool, seed);
    } else {
      motif = "abstract pure form";
    }
  }

  // 3. 構図バリエーション：作品ごとに変える
  const compSeed = hashString((artworkSeed || "comp") + "_comp") + 7;
  const composition = seededPick(COMPOSITION_VARIATIONS, compSeed);

  // 4. 部屋テーマと整合させる
  const variation = THEME_VARIATIONS[roomIndex % THEME_VARIATIONS.length];
  const prefix = variation.allowText ? "" : `${NO_TEXT_PREFIX} `;
  const textlessKeyword = variation.allowText ? "" : "textless, ";
  const noParams = variation.allowText 
    ? "--no photographs of people, frames, watermarks" 
    : "--no text, typography, words, letters, captions, signatures, frames, watermarks";

  // 5. 画風キーワードの組み立て
  let finalArtStyle;
  if (styleKeyword) {
    // 画風カテゴリが解決された場合：それをメインに使う
    finalArtStyle = styleKeyword;
    // ユーザーが artStyle に追加情報を入れていれば、それも軽く混ぜる
    if (artStyle && artStyle.trim()) {
      finalArtStyle += `, with subtle nuance of: ${artStyle}`;
    }
  } else if (artStyle && artStyle.trim()) {
    // カテゴリ解決失敗かつユーザー入力のみ
    finalArtStyle = artStyle;
  } else {
    // 完全フォールバック
    finalArtStyle = "contemporary fine art, contemplative";
  }

  // 6. 概念の影響
  let conceptInfluence = "";
  if (concept) {
    conceptInfluence = `subtly inspired by the overall theme: "${concept}", `;
  }

  // 7. 画材
  let mediumPrompt = "";
  if (medium && medium.trim() && medium !== "custom") {
    mediumPrompt = `medium/format: ${medium}, `;
  } else {
    mediumPrompt = `medium/format: ${variation.artMedium}, `;
  }

  return `${prefix}Pure artwork filling the entire frame as a single unified piece, subject: [ ${motif} ], ${conceptInfluence}art style/aesthetic: ${finalArtStyle}, ${composition}, emotional tone: ${variation.artTone}, ${mediumPrompt}soft museum lighting, highly detailed texture, museum-quality fine art, ${textlessKeyword}${noParams} --ar 16:9`;
}

// =================================================================
// 半券デザイン用プロンプト
// =================================================================
const TICKET_STYLE_MAP = {
  "brutalist concrete": "rough concrete texture, raw industrial surface, monochrome gray tones, minimalist composition",
  "modern glass and steel": "clean geometric lines, cool blue and silver tones, transparent layers, refined modernist aesthetic",
  "industrial warehouse": "weathered metal stamp, raw cardboard texture, utilitarian design, oxidized rust tones",
  "classic renaissance mansion": "ornate sepia engraving style, vintage parchment texture, classical decorative motifs, aged paper feel",
  "gothic cathedral": "stained glass motif, gothic arch ornament, deep jewel tones, illuminated manuscript aesthetic",
  "mediterranean villa": "sun-bleached terracotta tones, white and azure palette, mediterranean motifs, warm parchment",
  "traditional japanese wood": "washi paper texture, sumi ink wash, asymmetric balance, subtle natural fiber details",
  "japanese shoin-zukuri": "refined washi paper, gold leaf accents, asymmetric noble composition, classical japanese motifs",
  "east-asian palace": "vermilion and gold palette, east-asian ornamental motifs, classical court aesthetic, silk texture",
  "ruins and remnants": "weathered aged paper, faded ink, traces of moss and rust, archaeological fragment feel"
};

export function generateTicketPrompt(input) {
  const styleQuality = TICKET_STYLE_MAP[input.style] || "minimalist composition, museum aesthetic, refined paper texture";
  
  const conceptAddon = input.concept 
    ? `subtly evoking the concept "${input.concept}", ` 
    : "";
  
  return `${NO_TEXT_PREFIX} Pure isolated object, vintage museum admission ticket stub design, vertical orientation, isolated on pure solid white background, standalone object, no surface, no shadow, no environment, no background context, ${styleQuality}, ${conceptAddon}aged paper texture with subtle wear, decorative border or framing element, abstract symbol or motif representing the museum's atmosphere, ample negative space for text overlay, museum collectible aesthetic, soft flat lighting, professional design --no text, words, letters, numbers, typography, captions, photographs of people, shadows, surfaces, tables, walls --ar 2:3`;
}
