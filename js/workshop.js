// js/workshop.js
import { get, set } from "https://cdn.jsdelivr.net/npm/idb-keyval/+esm";
import { 
  generateMuseumPrompts, 
  generateArtworkPrompt, 
  generateTicketPrompt,
  generateExtractionPrompt,
  ART_STYLE_CATEGORIES,
  ARCHITECTURE_STYLES,
  pickRandomArtStyleForArchitecture
} from "./prompt-templates.js";
import { getAllTickets, deleteTicket, formatVisitedAt, formatSerial } from "./tickets.js";
import { playHaptic, playSE } from "./effects.js";
import { 
  escapeHtml, safeCssUrl, resolveImageSrc, 
  compressImageToBlob, blobToDataUrl, dataUrlToBlob 
} from "./utils.js";

const STORAGE_KEY = "museum-journey-custom";
let currentDraft = null; 
let currentEditId = null;
let originalMuseumData = null;
let magneticHandler = null;
let wsInitialized = false;

// =================================================================
// ランダム設計用パーツリスト（3トーン構造）
// 各トーン10要素ずつ。トーン内で「自然系・都市系・装飾系」などを混ぜる。
// =================================================================
const RANDOM_PARTS = {
  // -----------------------------------------------------------
  // bright（明るい・優しい・開かれた）
  // -----------------------------------------------------------
  bright: {
    names: [
      "陽だまりの絵本館",
      "朝露の草原パビリオン",
      "海風が吹き抜ける白い邸宅",
      "丘の上の小さな図書館",
      "都市の高層ホワイトキューブ",
      "湖上に浮かぶ幾何学ギャラリー",
      "ガラスの空中回廊",
      "天空のガラス温室",
      "花咲く中庭の回廊",
      "光と紙の小さな美術館"
    ],
    concepts: [
      "光と木の温もりにあふれた、心が安らぐ優しい空間。",
      "透明なテント構造で、朝もやと柔らかな光だけを閉じ込めた空間。",
      "真っ白な壁と青い海。風が心地よく通り抜ける開かれた空間。",
      "古い木の床と本棚の匂い。窓辺に午後の光が静かに差し込む空間。",
      "一切の無駄を排した、純白で無機質な極限のギャラリー空間。",
      "水面に浮かぶ、直線と平面だけで構成された理知的な空間。",
      "ガラスの床と空中の通路。都市の上空に浮かぶ静かな展示空間。",
      "壁も天井もガラス張りで、植物と自然光が調和した生命力あふれる空間。",
      "秘密の花園を囲むように造られた、装飾的で優美な回廊。",
      "和紙と木と金箔が、柔らかな光に包まれて輝く小さな空間。"
    ],
    locations: [
      "見晴らしの良い丘の上",
      "穏やかな地中海の海辺",
      "朝露に濡れた広大な草原",
      "雲海を見下ろす山の頂",
      "大都市の摩天楼、最上階",
      "空気が澄み切った高山の頂",
      "風の通り抜ける港町の埠頭",
      "忘れられた貴族の広大な庭園",
      "桜並木に囲まれた静かな丘",
      "陽光の差し込む北欧の小さな村"
    ],
    artists: [
      "かつて絵本作家だった老人",
      "光を追い求める印象派の画家",
      "植物と対話する植物学者",
      "朝の光を記録する水彩画家",
      "現代都市を解構築するグラフィックデザイナー",
      "数学と図形に魅入られた構成主義者",
      "色彩理論を追い求める抽象画家",
      "ノスタルジーを描くイラストレーター",
      "優美な曲線を愛する装飾画家",
      "和紙と顔料を用いる現代日本画家"
    ],
    architectureStyles: [
      "warm daylight & wood",
      "urban high-rise gallery",
      "modern glass and steel",
      "mediterranean villa"
    ]
  },

  // -----------------------------------------------------------
  // middle（中庸・洗練・落ち着き）
  // -----------------------------------------------------------
  middle: {
    names: [
      "記憶の古い木造校舎",
      "静寂の書院造ギャラリー",
      "苔むす石庭のパビリオン",
      "インダストリアル・ロフト",
      "風の通る海上プラットフォーム",
      "鉄骨と硝子の交差する展示室",
      "星降る夜の天文ギャラリー",
      "砂漠のオアシス・パビリオン",
      "無限の鏡面ラビリンス",
      "古都の路地にひらく蔵"
    ],
    concepts: [
      "歩くたびに床が鳴る、どこか懐かしくセピア色に染まった空間。",
      "枯山水の庭を望む、研ぎ澄まされた静けさを持つ現代和風の空間。",
      "苔と石と木が、光と影の境界線の上で静かに息づく空間。",
      "むき出しの鉄骨とレンガ。無骨な力強さと現代アートが交差する空間。",
      "海の上に組まれた鉄と木の足場。自然の風を受けて動く空間。",
      "鉄骨と硝子が幾何学に交差し、光が斜めに差し込む静かな展示室。",
      "巨大な天窓から満天の星空を仰ぎ見る、宇宙と繋がる静寂のドーム。",
      "乾いた土壁と直線的なモダンデザインが融合した、果てしない砂の上の箱。",
      "壁面が全て鏡で覆われ、空間と視覚が無限に拡張していく迷宮。",
      "白壁の蔵を改装した、古いものと新しいものが穏やかに同居する空間。"
    ],
    locations: [
      "蝉時雨が降る、遠い田舎の廃校",
      "苔むした静かな古都の路地裏",
      "枯山水の庭を持つ寺の裏手",
      "雨の降るダウンタウンの古い倉庫街",
      "凪いだ海の上にぽつんと浮かぶ人工島",
      "夕暮れに染まる工業地帯の高架下",
      "白夜が続く果てしない氷原",
      "どこまでも続く砂丘の真ん中",
      "月明かりに照らされた湖畔の小道",
      "霧に包まれた中世の石畳の通り"
    ],
    artists: [
      "余白の美を追求する現代日本画家",
      "枯れた花だけを描き続ける老画家",
      "墨と紙だけで世界を描く水墨画家",
      "風と重力で動くキネティック彫刻家",
      "モノクロームの世界だけを撮る写真家",
      "鉄と錆を素材にする現代彫刻家",
      "光と水のインスタレーション作家",
      "夢と現実の境界を曖昧にするシュルレアリスト",
      "大量消費社会を皮肉るポップアーティスト",
      "古い書物のページを切り貼りするコラージュ作家"
    ],
    architectureStyles: [
      "industrial warehouse",
      "japanese shoin-zukuri",
      "traditional japanese wood",
      "east-asian palace"
    ]
  },

  // -----------------------------------------------------------
  // quiet（しっとり・深い・静謐）
  // -----------------------------------------------------------
  quiet: {
    names: [
      "忘却のコンクリート要塞",
      "深海の沈没船ミュージアム",
      "雨音の響くゴシック大聖堂",
      "夜の石窟回廊",
      "時の止まった洋館",
      "雪に埋もれた終着駅",
      "砂の底の美術館",
      "廃墟となった天文台",
      "霧に閉ざされた旧鉱山",
      "苔と影に沈む地下聖堂"
    ],
    concepts: [
      "都市の喧騒から隔絶された、冷たいコンクリートと圧倒的な静寂の空間。",
      "水没したかつての豪華客船。冷たく青い光だけが揺らめく水底の空間。",
      "ステンドグラスから鈍い光が差し込む、祈りと懺悔のための高い天井。",
      "自然の岩肌をくり抜いて作られた、冷たく湿った地下の遺跡回廊。",
      "何百年も人が入っていないような、分厚い埃と静寂に包まれたクラシックな部屋。",
      "誰も来ないプラットホーム。鉄骨とガラスが冷たい風を遮るだけの空間。",
      "風化した砂の中に半ば埋もれた、忘れられた展示室。",
      "観測をやめて久しい、星空に向けたままの巨大な望遠鏡が静かに眠る空間。",
      "霧と苔が、放棄されたトロッコと坑道を静かに包み込む空間。",
      "地下深く、蝋燭の灯りだけが石壁を照らす祈りのための空間。"
    ],
    locations: [
      "深く暗い青に沈んだ海の底",
      "終わらない雨が降り続く古い街",
      "誰も知らない地下空洞の奥深く",
      "茨とツタに覆われた暗い森の奥",
      "猛吹雪が吹き荒れる白い荒野",
      "濃い霧に包まれた山奥の斜面",
      "見捨てられた炭鉱町の外れ",
      "永遠に夜が続く惑星の縁",
      "潮の引いた岩礁に取り残された廃灯台",
      "氷河の裂け目にひらく深い洞窟"
    ],
    artists: [
      "荒々しい筆致を持つ抽象表現主義者",
      "夢と現実の境界を曖昧にするシュルレアリスト",
      "宗教画と死生観を描く古典画家",
      "神話と土着信仰を彫る彫刻家",
      "静物画だけを描き続けた忘れられた画家",
      "孤独と空虚をキャンバスにぶつける表現主義者",
      "廃墟だけを描き続ける油彩画家",
      "深海生物を細密に描く生物学者画家",
      "黒と灰色だけで風景を描く銅版画家",
      "亡き人の記憶を蝋で形にする彫刻家"
    ],
    architectureStyles: [
      "brutalist concrete",
      "gothic cathedral",
      "classic renaissance mansion",
      "ruins and remnants"
    ]
  },

  // -----------------------------------------------------------
  // shared（トーン非依存の共通要素）
  // -----------------------------------------------------------
  shared: {
    architectsMeta: [
      "名もなき設計士", "アメリア・ヴォイド", "ジョン・ドウ", "灰の建築家", "K",
      "忘却のアルチザン", "機械知性 M-7", "エル・ミズ", "空想の旅人", "沈黙の観測者"
    ],
    builders: [
      "星空建築株式会社", "重工建設", "水脈アーキテクチャ", "記憶の修復工房", "幻影ゼネコン"
    ]
  }
};

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 1セット分のランダム抽出（同じトーンから引き、ごくまれに1要素だけ別トーンの肌触りを混ぜる）
function pickRandomMuseumSet() {
  const tones = ["bright", "middle", "quiet"];
  const mainTone = tones[Math.floor(Math.random() * tones.length)];
  const group = RANDOM_PARTS[mainTone];
  const shared = RANDOM_PARTS.shared;

  // 10%の確率で、アーティスト像だけ別のトーンから引く（偶発的な揺らぎ）
  let artistGroup = group;
  if (Math.random() < 0.10) {
    const others = tones.filter(t => t !== mainTone);
    const sub = others[Math.floor(Math.random() * others.length)];
    artistGroup = RANDOM_PARTS[sub];
  }

  return {
    tone: mainTone,
    name: getRandomItem(group.names),
    concept: getRandomItem(group.concepts),
    location: getRandomItem(group.locations),
    artist: getRandomItem(artistGroup.artists),
    architecture: getRandomItem(group.architectureStyles),
    architectMeta: getRandomItem(shared.architectsMeta),
    builder: getRandomItem(shared.builders)
  };
}

// =================================================================
// 画風・建築様式プルダウン構築
// =================================================================
function buildArtStyleCategoryOptions(selectEl, currentValue = "") {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  
  const optNone = document.createElement("option");
  optNone.value = "";
  optNone.textContent = "指定なし(展示室のテーマに合わせる)";
  selectEl.appendChild(optNone);
  
  const optRandom = document.createElement("option");
  optRandom.value = "random";
  optRandom.textContent = "ランダム(建築様式に合った画風を自動選択)";
  selectEl.appendChild(optRandom);
  
  const optSep = document.createElement("option");
  optSep.disabled = true;
  optSep.textContent = "──────────────";
  selectEl.appendChild(optSep);
  
  Object.entries(ART_STYLE_CATEGORIES).forEach(([key, def]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = def.label;
    selectEl.appendChild(opt);
  });
  
  if (currentValue !== undefined && currentValue !== null) {
    selectEl.value = currentValue;
  }
}

function buildArchitectureStyleOptions(selectEl, currentValue = "brutalist concrete") {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  
  Object.entries(ARCHITECTURE_STYLES).forEach(([key, def]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = def.label;
    selectEl.appendChild(opt);
  });
  
  if (currentValue !== undefined && currentValue !== null) {
    if (!ARCHITECTURE_STYLES[currentValue]) {
      if (currentValue === "classic renaissance") {
        selectEl.value = "classic renaissance mansion";
      } else {
        selectEl.value = "brutalist concrete";
      }
    } else {
      selectEl.value = currentValue;
    }
  }
}

// =================================================================
// クリップボードコピー
// =================================================================
async function copyToClipboard(text, btnElement) {
  const originalHTML = btnElement.innerHTML;
  try {
    await navigator.clipboard.writeText(text);
    btnElement.innerHTML = `
      <svg class="icon-quiet" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" aria-hidden="true">
        <path d="M3 8 H13"/>
      </svg>
      <span>写し取りました</span>
    `;
    btnElement.classList.add("copied");
    setTimeout(() => {
      btnElement.innerHTML = originalHTML;
      btnElement.classList.remove("copied");
    }, 2000);
  } catch (err) {
    alert("コピーに失敗しました。お手数ですが手動で選択してコピーしてください。");
  }
}

// =================================================================
// データ管理
// =================================================================
async function getVisitorsCount() {
  try { return (await get("mj-visitors")) || 0; } catch { return 0; }
}

export async function getAllCustomMuseums() {
  try { 
    const list = await get(STORAGE_KEY);
    return list || [];
  } catch { return []; }
}

export async function saveCustomMuseum(museum) {
  const list = await getAllCustomMuseums();
  const index = list.findIndex(m => m.id === museum.id);
  if (index >= 0) {
    list[index] = museum;
  } else {
    list.push(museum);
  }
  await set(STORAGE_KEY, list);
}

async function museumToExportable(museum) {
  const cloned = JSON.parse(JSON.stringify(museum, (key, value) => {
    if (value instanceof Blob) return undefined;
    return value;
  }));
  
  if (museum.phases) {
    for (let i = 0; i < museum.phases.length; i++) {
      const srcPhase = museum.phases[i];
      const dstPhase = cloned.phases[i];
      if (srcPhase.image instanceof Blob) {
        dstPhase.image = await blobToDataUrl(srcPhase.image);
      } else {
        dstPhase.image = srcPhase.image || null;
      }
      if (srcPhase.artworks) {
        for (let j = 0; j < srcPhase.artworks.length; j++) {
          const srcArt = srcPhase.artworks[j];
          const dstArt = dstPhase.artworks[j];
          if (srcArt.image instanceof Blob) {
            dstArt.image = await blobToDataUrl(srcArt.image);
          } else {
            dstArt.image = srcArt.image || null;
          }
        }
      }
    }
  }
  if (museum.ticketDesign && museum.ticketDesign.image) {
    if (museum.ticketDesign.image instanceof Blob) {
      cloned.ticketDesign.image = await blobToDataUrl(museum.ticketDesign.image);
    } else {
      cloned.ticketDesign.image = museum.ticketDesign.image;
    }
  }
  return cloned;
}

async function bindSingleInvitation(museum) {
  const exportable = await museumToExportable(museum);

  const invitationPack = {
    _format: "museum-journey-invitation",
    _version: "1.0",
    _generatedAt: new Date().toISOString(),
    _notice: "This file contains a museum designed with 'Museum That Is Not on the Map' (地図にない美術館). The application, its prompt generation system, and the museums constructed through it are copyrighted works of the original author.",
    _license: "All rights reserved. Personal and non-commercial sharing is permitted. Commercial use, redistribution on other platforms, or extraction of images for separate use without the author's permission is prohibited.",
    _japanese_notice: "このファイルは「地図にない美術館」で設計された美術館データです。本アプリおよびそこから生成された美術館の著作権は作者に帰属します。個人的な鑑賞および非商用での共有は自由です。無断での商用利用・転載・画像の単独抽出はご遠慮ください。",
    museums: [exportable]
  };

  const jsonStr = JSON.stringify(invitationPack, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const safeName = (museum.name || "untitled")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 40);
  a.download = `invitation_${safeName}.museum`;
  a.click();
  URL.revokeObjectURL(url);
}

function importableToMuseum(museum) {
  if (museum.phases) {
    museum.phases.forEach(phase => {
      if (typeof phase.image === "string" && phase.image.startsWith("data:")) {
        const blob = dataUrlToBlob(phase.image);
        if (blob) phase.image = blob;
      }
      if (phase.artworks) {
        phase.artworks.forEach(art => {
          if (typeof art.image === "string" && art.image.startsWith("data:")) {
            const blob = dataUrlToBlob(art.image);
            if (blob) art.image = blob;
          }
        });
      }
    });
  }
  if (museum.ticketDesign && typeof museum.ticketDesign.image === "string" 
      && museum.ticketDesign.image.startsWith("data:")) {
    const blob = dataUrlToBlob(museum.ticketDesign.image);
    if (blob) museum.ticketDesign.image = blob;
  }
  return museum;
}

// =================================================================
// ポスター画像(Canvas)自動生成ロジック
// =================================================================
function loadImageObj(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sWidth = img.width, sHeight = img.height, sx = 0, sy = 0;
  if (imgRatio > canvasRatio) {
    sWidth = img.height * canvasRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / canvasRatio;
    sy = (img.height - sHeight) / 2;
  }
  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

function fillTextWrap(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('');
  let line = '';
  for (let n = 0; n < chars.length; n++) {
    const testLine = line + chars[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = chars[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

async function generateAndShowPoster(museum) {
  playHaptic("light");
  playSE("click");
  
  const overlay = document.getElementById("share-overlay");
  const imgEl = document.getElementById("poster-preview-img");
  const dlBtn = document.getElementById("btn-download-poster");
  const twBtn = document.getElementById("btn-share-twitter");
  const guideText = document.getElementById("share-guide-text");
  
  imgEl.classList.remove("loaded");
  imgEl.src = "";
  guideText.classList.add("hidden");
  
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("show"), 50);

  await document.fonts.ready;

  const canvas = document.getElementById("poster-canvas");
  const ctx = canvas.getContext("2d");
  const CW = 1200;
  const CH = 630;
  
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, CW, CH);

  const coverBlob = museum.phases?.[0]?.image || museum.phases?.[1]?.image;
  if (coverBlob) {
    try {
      const src = resolveImageSrc(coverBlob);
      const img = await loadImageObj(src);
      drawImageCover(ctx, img, 0, 0, CW, CH);
    } catch (e) { console.error("Cover image load failed"); }
  }

  const grad = ctx.createLinearGradient(0, 0, CW, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.95)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.7)");
  grad.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  const marginLeft = 100;
  let currentY = 160;

  ctx.fillStyle = "#d4b574"; 
  ctx.font = "300 64px 'Noto Serif JP', serif";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 20;
  ctx.fillText(museum.name || "無名の空間", marginLeft, currentY);
  ctx.shadowBlur = 0;

  currentY += 40;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(marginLeft, currentY, 400, 1);

  currentY += 60;
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "300 24px 'Noto Sans JP', sans-serif";
  ctx.fillText(`設計: ${museum.architect || "名もなき設計士"}`, marginLeft, currentY);
  currentY += 40;
  ctx.fillText(`環境: ${museum.location || "不明な場所"}`, marginLeft, currentY);
  
  currentY += 80;
  ctx.fillStyle = "#e0e0e0";
  ctx.font = "300 28px 'Noto Serif JP', serif";
  if (museum.concept) {
    fillTextWrap(ctx, museum.concept, marginLeft, currentY, 600, 44);
  }

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "300 20px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Generated by 地図にない美術館", CW - 60, CH - 60);
  ctx.font = "400 16px 'Noto Sans JP', sans-serif";
  ctx.fillText("yoshimitsuoct28-debug.github.io/museum-no-map", CW - 60, CH - 35);
  ctx.textAlign = "left";

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  imgEl.src = dataUrl;
  imgEl.onload = () => imgEl.classList.add("loaded");
  
  dlBtn.href = dataUrl;
  dlBtn.download = `invitation_${(museum.name || "untitled").slice(0, 10)}.jpg`;

  twBtn.onclick = async () => {
    playSE("click");
    const tweetText = `地図にない美術館を、ひとつ建てました。\n\n『${museum.name || "無名の空間"}』\n環境：${museum.location || "不明"}\n\nブラウザで静かに開く、地図にない場所です。\nhttps://yoshimitsuoct28-debug.github.io/museum-no-map/\n\n#地図にない美術館 #個人開発 #Webアプリ`;
    
    const canvas = document.getElementById("poster-canvas");
    
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        guideText.classList.remove("hidden");
        guideText.innerHTML = 
          "招待状の画像をクリップボードに写しました。<br>" +
          "X の投稿画面で <strong>Ctrl+V</strong>(スマホは長押し→貼り付け)で添付してください。<br>" +
          "本文は下のボタンからコピーできます。";
      } else {
        guideText.classList.remove("hidden");
        guideText.innerHTML = 
          "お使いのブラウザでは画像の自動コピーに対応していません。<br>" +
          "「画像を保存する」ボタンから保存し、X の投稿画面で添付してください。";
      }
      
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, "_blank");
    } catch (err) {
      console.error("画像コピー失敗", err);
      try { await navigator.clipboard.writeText(tweetText); } catch(_) {}
      guideText.classList.remove("hidden");
      guideText.innerHTML = 
        "画像の自動コピーに失敗しました。<br>" +
        "「画像を保存する」ボタンから保存し、X の投稿画面で添付してください。";
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
    }
  };
}

// =================================================================
// 初期化
// =================================================================
export async function initWorkshop() {
  const isDevMode = localStorage.getItem("mj_dev_mode") === "true";
  const totalVisitors = await getVisitorsCount();
  
  const calculatedMaxRooms = 3 + Math.floor(totalVisitors / 10);
  const maxRooms = isDevMode ? 20 : Math.min(calculatedMaxRooms, 20);
  
  document.getElementById("workshop-status").textContent = 
    isDevMode ? "【開発者モード】全ての拡張機能が解放されています。" 
              : `現在の総来客数(足跡): ${totalVisitors} 人 —— あなただけの理想の箱を定義する。`;

  const styleSelect = document.getElementById("ws-style");
  if (styleSelect && !styleSelect.dataset.built) {
    buildArchitectureStyleOptions(styleSelect, "brutalist concrete");
    styleSelect.dataset.built = "true";
  }

  const artStyleCategorySelect = document.getElementById("ws-art-style-category");
  if (artStyleCategorySelect && !artStyleCategorySelect.dataset.built) {
    buildArtStyleCategoryOptions(artStyleCategorySelect, "");
    artStyleCategorySelect.dataset.built = "true";
  }

  const roomSelect = document.getElementById("ws-rooms");
  if(roomSelect.options.length === 0 || roomSelect.dataset.maxRooms != maxRooms) {
    roomSelect.innerHTML = "";
    roomSelect.dataset.maxRooms = maxRooms;
    for(let i = 1; i <= maxRooms; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${i}室` + (i === 5 ? " (中規模)" : i === 10 ? " (大規模)" : i === 20 ? " (無限回廊)" : "");
      if(i === 2 && !currentEditId) opt.selected = true;
      roomSelect.appendChild(opt);
    }
  }

  const canShop = isDevMode || maxRooms >= 5;
  const canGarden = isDevMode || maxRooms >= 8;
  const canRoof = isDevMode || maxRooms >= 10;
  
  if(canShop) document.getElementById("wrap-shop").classList.remove("hidden");
  if(canGarden) document.getElementById("wrap-garden").classList.remove("hidden");
  if(canRoof) document.getElementById("wrap-roof").classList.remove("hidden");

  if(!wsInitialized) {
    
    // トーンの揃った1セットをまとめて引く「偶然に任せる」
    const btnRandom = document.getElementById("btn-random-design");
    if (btnRandom) {
      btnRandom.addEventListener("click", () => {
        playHaptic("light");
        
        const setData = pickRandomMuseumSet();
        
        document.getElementById("ws-name").value = setData.name;
        document.getElementById("ws-concept").value = setData.concept;
        document.getElementById("ws-location").value = setData.location;
        document.getElementById("ws-style").value = setData.architecture;
        document.getElementById("ws-architect").value = setData.architectMeta;
        document.getElementById("ws-builder").value = setData.builder;
        document.getElementById("ws-artist").value = setData.artist;
        document.getElementById("ws-art-style").value = "";
        
        const randomArea = Math.floor(Math.random() * 9000 + 1000).toLocaleString() + "㎡";
        document.getElementById("ws-area").value = randomArea;
        
        const pickedStyleKey = pickRandomArtStyleForArchitecture(setData.architecture);
        const artStyleCategorySelect = document.getElementById("ws-art-style-category");
        if (artStyleCategorySelect) {
          artStyleCategorySelect.value = pickedStyleKey;
        }
        
        const roomOpts = document.getElementById("ws-rooms").options;
        const randomRoomIndex = Math.floor(Math.random() * Math.min(roomOpts.length, 5));
        document.getElementById("ws-rooms").selectedIndex = randomRoomIndex;
        
        const inputs = document.querySelectorAll("#tab-build input[type='text'], #tab-build textarea, #tab-build select");
        inputs.forEach(el => {
          el.style.borderColor = "var(--accent)";
          setTimeout(() => el.style.borderColor = "", 400);
        });
      });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        if(btn.dataset.tab === "library") await renderLibrary();
        if(btn.dataset.tab === "tickets") await renderTicketStack();
      });
    });

    document.getElementById("btn-generate-prompts").addEventListener("click", () => {
      const artStyleCategoryEl = document.getElementById("ws-art-style-category");
      let artStyleCategoryValue = artStyleCategoryEl ? artStyleCategoryEl.value : "";
      
      if (artStyleCategoryValue === "random") {
        const archStyle = document.getElementById("ws-style").value;
        artStyleCategoryValue = pickRandomArtStyleForArchitecture(archStyle);
        if (artStyleCategoryEl) artStyleCategoryEl.value = artStyleCategoryValue;
      }
      
      const input = {
        name: document.getElementById("ws-name").value || "無名の美術館",
        concept: document.getElementById("ws-concept").value,
        location: document.getElementById("ws-location").value || "不明な場所",
        style: document.getElementById("ws-style").value,
        architect: document.getElementById("ws-architect").value || "名もなき設計士",
        builder: document.getElementById("ws-builder").value,
        area: document.getElementById("ws-area").value,
        artist: document.getElementById("ws-artist").value,
        artStyle: document.getElementById("ws-art-style").value,
        artStyleCategory: artStyleCategoryValue,
        rooms: parseInt(document.getElementById("ws-rooms").value),
        hasCafe: document.getElementById("ws-has-cafe").checked,
        cafeMenu: document.getElementById("ws-cafe-menu").value,
        hasShop: document.getElementById("ws-has-shop")?.checked || false,
        hasGarden: document.getElementById("ws-has-garden")?.checked || false,
        hasRoof: document.getElementById("ws-has-roof")?.checked || false,
        hasCustomTicket: document.getElementById("ws-has-custom-ticket")?.checked || false,
        guestbookUrl: document.getElementById("ws-has-guestbook")?.checked 
                        ? document.getElementById("ws-guestbook-url").value.trim() 
                        : null
      };

      const generatedData = generateMuseumPrompts(input);
      
      const phases = generatedData.filter(p => p.type === "phase").map(p => {
        let existingPhase = null;
        
        if (currentDraft && currentDraft.phases) {
          existingPhase = currentDraft.phases.find(ep => ep.id === p.id);
        }
        if (!existingPhase && originalMuseumData) {
          existingPhase = originalMuseumData.phases.find(ep => ep.id === p.id);
        }
        
        return { 
          id: p.id, 
          title: p.title, 
          image: existingPhase ? existingPhase.image : null,
          desc: existingPhase ? existingPhase.desc : "",
          artworks: p.id.startsWith("exhibition") 
                      ? (existingPhase && existingPhase.artworks 
                          ? existingPhase.artworks.map(a => ({ ...a })) 
                          : []) 
                      : undefined
        };
      });
      
      const preservedTicketDesign =
        (currentDraft && currentDraft.ticketDesign) ||
        (originalMuseumData && originalMuseumData.ticketDesign) ||
        null;
      
      const museumSeed = currentEditId || ("seed_" + (input.name || "untitled") + "_" + Date.now());
      
      currentDraft = { 
        ...input, 
        phases: phases, 
        ticketDesign: preservedTicketDesign,
        museumSeed: (currentDraft && currentDraft.museumSeed) || (originalMuseumData && originalMuseumData.museumSeed) || museumSeed
      };
      
      renderPrompts(generatedData);
      document.getElementById("ws-prompts-output").classList.remove("hidden");
      
      updateTicketPromptUI(input);
      checkCanRegister();
    });

    document.getElementById("btn-register-museum").addEventListener("click", async () => {
      if(!currentDraft) return;
      currentDraft.id = currentEditId ? currentEditId : "m_" + Date.now();
      currentDraft.custom = true;
      
      const wantsCustomTicket = document.getElementById("ws-has-custom-ticket")?.checked;
      if (!wantsCustomTicket) {
        currentDraft.ticketDesign = null;
      }

      const architectName = document.getElementById("ws-architect").value || "名もなき設計士";
      const museumName = document.getElementById("ws-name").value || "無名の美術館";
      const currentDate = new Date().toISOString();

      currentDraft.phases.forEach(phase => {
        if (phase.artworks) {
          phase.artworks.forEach(art => {
            if (!art.originalCreator) {
              art.originalCreator = architectName;
              art.createdAt = currentDate;
              art.originMuseum = museumName;
            }
          });
        }
      });

      try {
        await saveCustomMuseum(currentDraft);
        alert(currentEditId ? "美術館の改修が完了しました!(上書き保存)" : "図鑑に登録しました!");
        resetWorkshopForm();
        document.querySelector('[data-tab="library"]').click();
      } catch (e) {
        console.error("保存失敗", e);
        alert("データの保存に失敗しました。容量オーバーの可能性があります。");
      }
    });

    document.getElementById("btn-cancel-edit").addEventListener("click", () => {
      resetWorkshopForm();
      document.querySelector('[data-tab="library"]').click();
    });

    document.getElementById("btn-export-all").addEventListener("click", async () => {
      const list = await getAllCustomMuseums();
      if (list.length === 0) { alert("書き出すデータが存在しません。"); return; }
      try {
        const exportable = await Promise.all(list.map(museumToExportable));
        
        const invitationPack = {
          _format: "museum-journey-invitation",
          _version: "1.0",
          _generatedAt: new Date().toISOString(),
          _notice: "This file contains museums designed with 'Museum That Is Not on the Map' (地図にない美術館). The application, its prompt generation system, and the museums constructed through it are copyrighted works of the original author.",
          _license: "All rights reserved. Personal and non-commercial sharing is permitted. Commercial use, redistribution on other platforms, or extraction of images for separate use without the author's permission is prohibited.",
          _japanese_notice: "このファイルは「地図にない美術館」で設計された美術館データです。本アプリおよびそこから生成された美術館の著作権は作者に帰属します。個人的な鑑賞および非商用での共有は自由です。無断での商用利用・転載・画像の単独抽出はご遠慮ください。",
          museums: exportable
        };
        
        const jsonStr = JSON.stringify(invitationPack, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "all_museums_backup.museum";
        a.click();
        URL.revokeObjectURL(url);
        showInvitationGuide("backup", null, list.length);
      } catch (e) {
        console.error("Export failed", e);
        alert("書き出しに失敗しました。");
      }
    });

    document.getElementById("import-pack").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const importedData = JSON.parse(evt.target.result);
          
          let museumsArray = null;
          if (Array.isArray(importedData)) {
            museumsArray = importedData;
          } else if (importedData && importedData._format === "museum-journey-invitation" && Array.isArray(importedData.museums)) {
            museumsArray = importedData.museums;
          } else {
            throw new Error("Invalid format");
          }
          
          const validated = museumsArray.filter(m => 
            m && typeof m === "object" 
            && typeof m.id === "string" 
            && typeof m.name === "string"
            && Array.isArray(m.phases)
          ).map(importableToMuseum);
          
          const current = await getAllCustomMuseums();
          const currentIds = current.map(m => m.id);
          const newData = validated.filter(m => !currentIds.includes(m.id));
          await set(STORAGE_KEY, [...current, ...newData]);
          await renderLibrary();
          if (newData.length > 0) {
            const firstName = newData[0].name || "無名の美術館";
            showInvitationGuide("receive", firstName, newData.length);
          } else {
            showInvitationGuide("receive_duplicate", null, 0);
          }
        } catch (err) {
          console.error(err);
          alert("ファイルの読み込みに失敗しました。正しいデータファイルを選択してください。");
        }
        e.target.value = ""; 
      };
      reader.readAsText(file);
    });

    const cbGuestbook = document.getElementById("ws-has-guestbook");
    if (cbGuestbook) {
      cbGuestbook.addEventListener("change", (e) => {
        const block = document.getElementById("ws-guestbook-block");
        if (!block) return;
        if (e.target.checked) {
          block.classList.remove("hidden");
        } else {
          block.classList.add("hidden");
        }
      });
    }

    const cbCustomTicket = document.getElementById("ws-has-custom-ticket");
    if (cbCustomTicket) {
      cbCustomTicket.addEventListener("change", (e) => {
        const block = document.getElementById("ws-ticket-design-block");
        if (!block) return;
        if (e.target.checked) {
          block.classList.remove("hidden");
          if (currentDraft) updateTicketPromptUI(currentDraft);
        } else {
          block.classList.add("hidden");
        }
      });
    }
    
    const ticketImageInput = document.getElementById("ws-ticket-image-input");
    if (ticketImageInput) {
      ticketImageInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const blob = await compressImageToBlob(file, 1000, 0.8);
          const preview = document.getElementById("ws-ticket-preview");
          if (preview) {
            const ticketObjUrl = URL.createObjectURL(blob);
            preview.onload = () => URL.revokeObjectURL(ticketObjUrl);
            preview.src = ticketObjUrl;
            preview.classList.remove("hidden");
          }
          if (!currentDraft) currentDraft = {};
          currentDraft.ticketDesign = {
            image: blob,
            createdAt: new Date().toISOString()
          };
        } catch (err) {
          console.error(err);
          alert("画像の読み込みに失敗しました。");
        }
      });
    }

    const btnCopyTicket = document.getElementById("btn-copy-ticket-prompt");
    if (btnCopyTicket) {
      btnCopyTicket.addEventListener("click", async (e) => {
        const textarea = document.getElementById("ws-ticket-prompt-text");
        if (textarea) await copyToClipboard(textarea.value, e.target);
      });
    }

    const btnCloseViewer = document.getElementById("btn-close-ticket-viewer");
    if (btnCloseViewer) btnCloseViewer.addEventListener("click", closeTicketViewer);
    const viewerOverlay = document.getElementById("ticket-viewer-overlay");
    if (viewerOverlay) {
      viewerOverlay.addEventListener("click", (e) => {
        if (e.target.id === "ticket-viewer-overlay") closeTicketViewer();
      });
    }

    const btnCloseShare = document.getElementById("btn-close-share");
    if(btnCloseShare) {
      btnCloseShare.addEventListener("click", () => {
        playSE("cancel");
        const overlay = document.getElementById("share-overlay");
        overlay.classList.remove("show");
        setTimeout(() => overlay.classList.add("hidden"), 600);
      });
    }

    const btnCloseGuide = document.getElementById("btn-close-invitation-guide");
    if(btnCloseGuide) {
      btnCloseGuide.addEventListener("click", () => {
        playSE("cancel");
        const overlay = document.getElementById("invitation-guide-overlay");
        overlay.classList.remove("show");
        setTimeout(() => overlay.classList.add("hidden"), 600);
      });
    }

    wsInitialized = true;
  }
}

// =================================================================
// 招待状作法ガイド
// =================================================================
function showInvitationGuide(mode, museumName = "", count = 0) {
  const overlay = document.getElementById("invitation-guide-overlay");
  const titleEl = document.getElementById("invitation-guide-title");
  const bodyEl = document.getElementById("invitation-guide-body");
  if (!overlay || !titleEl || !bodyEl) return;
  
  const safeName = museumName || "無名の美術館";
  
  if (mode === "bind") {
    titleEl.textContent = "招待状が綴じられました";
    bodyEl.textContent = 
`『${safeName}』の招待状が、あなたの手元に綴じられました。

このファイルを、招きたい人に手渡してください。
メール、メッセンジャー、AirDrop——届け方は問いません。

受け取った方は、自分の設計室の「所有する美術館」から、
「封を切る」を選ぶことで、この美術館を訪れることができます。`;
  } else if (mode === "backup") {
    titleEl.textContent = "控えが書き出されました";
    bodyEl.textContent = 
`所有する ${count} 館の美術館を、一通のファイルにまとめました。

これは贈るためではなく、あなた自身のための控えです。
別の端末に移すときや、万一のときに備えて、
静かな場所に保管してください。`;
  } else if (mode === "receive") {
    titleEl.textContent = "招待状が開かれました";
    bodyEl.textContent = count > 1
      ? `${count} 通の招待状を受け取りました。\n『${safeName}』をはじめ、所有する美術館に静かに加わっています。\n\nいつでも訪れることができます。`
      : `『${safeName}』への招待状を受け取りました。\n所有する美術館に静かに加わっています。\n\nいつでも訪れることができます。`;
  } else if (mode === "receive_duplicate") {
    titleEl.textContent = "扉はすでに開かれています";
    bodyEl.textContent = 
`受け取った招待状の美術館は、すでにあなたの所有する美術館に
加わっているようです。

新たに加わったものはありませんでした。`;
  }
  
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("show"), 50);
}

function updateTicketPromptUI(input) {
  const cb = document.getElementById("ws-has-custom-ticket");
  const block = document.getElementById("ws-ticket-design-block");
  const promptArea = document.getElementById("ws-ticket-prompt-text");
  if (!cb || !block || !promptArea) return;
  
  if (!cb.checked) {
    block.classList.add("hidden");
    return;
  }
  
  block.classList.remove("hidden");
  const prompt = generateTicketPrompt({
    name: input.name,
    concept: input.concept,
    style: input.style
  });
  promptArea.value = prompt;
}

function resetWorkshopForm() {
  currentEditId = null;
  originalMuseumData = null;
  currentDraft = null;
  
  document.getElementById("edit-mode-banner").classList.add("hidden");
  document.getElementById("tab-build").classList.remove("is-editing");
  document.getElementById("tab-btn-build").textContent = "新規設計";
  document.getElementById("btn-register-museum").textContent = "この美術館を図鑑に登録する";
  document.getElementById("ws-prompts-output").classList.add("hidden");

  document.querySelectorAll("#tab-build input[type='text'], #tab-build textarea").forEach(el => el.value = "");
  document.getElementById("ws-has-cafe").checked = true;
  const optShop = document.getElementById("ws-has-shop"); if(optShop) optShop.checked = false;
  const optGarden = document.getElementById("ws-has-garden"); if(optGarden) optGarden.checked = false;
  const optRoof = document.getElementById("ws-has-roof"); if(optRoof) optRoof.checked = false;
  
  const cbGuestbook = document.getElementById("ws-has-guestbook");
  if (cbGuestbook) cbGuestbook.checked = false;
  const guestbookBlock = document.getElementById("ws-guestbook-block");
  if (guestbookBlock) guestbookBlock.classList.add("hidden");

  const cbCustomTicket = document.getElementById("ws-has-custom-ticket");
  if (cbCustomTicket) cbCustomTicket.checked = false;
  const ticketBlock = document.getElementById("ws-ticket-design-block");
  if (ticketBlock) ticketBlock.classList.add("hidden");
  
  const ticketPromptArea = document.getElementById("ws-ticket-prompt-text");
  if (ticketPromptArea) ticketPromptArea.value = "(プロンプト生成後に表示されます)";
  const ticketPreview = document.getElementById("ws-ticket-preview");
  if (ticketPreview) { ticketPreview.src = ""; ticketPreview.classList.add("hidden"); }
  const ticketImageInput = document.getElementById("ws-ticket-image-input");
  if (ticketImageInput) ticketImageInput.value = "";
  
  document.getElementById("ws-style").selectedIndex = 0;
  document.getElementById("ws-builder").selectedIndex = 0;
  document.getElementById("ws-rooms").selectedIndex = 1;
  
  const artStyleCategorySelect = document.getElementById("ws-art-style-category");
  if (artStyleCategorySelect) artStyleCategorySelect.value = "";
}

function loadMuseumForEdit(museum) {
  resetWorkshopForm();
  currentEditId = museum.id;
  originalMuseumData = museum;

  document.getElementById("edit-target-name").textContent = museum.name || "無名の美術館";
  document.getElementById("edit-mode-banner").classList.remove("hidden");
  document.getElementById("tab-build").classList.add("is-editing");
  document.getElementById("tab-btn-build").textContent = "⚠️ 改修中...";
  document.getElementById("btn-register-museum").textContent = "改修を完了する(上書き保存)";

  document.getElementById("ws-name").value = museum.name || "";
  document.getElementById("ws-concept").value = museum.concept || "";
  document.getElementById("ws-location").value = museum.location || "";
  
  const styleSelect = document.getElementById("ws-style");
  let resolvedStyle = museum.style || "brutalist concrete";
  if (!ARCHITECTURE_STYLES[resolvedStyle]) {
    if (resolvedStyle === "classic renaissance") resolvedStyle = "classic renaissance mansion";
    else resolvedStyle = "brutalist concrete";
  }
  styleSelect.value = resolvedStyle;
  
  document.getElementById("ws-architect").value = museum.architect || "";
  document.getElementById("ws-builder").value = museum.builder || "";
  document.getElementById("ws-area").value = museum.area || "";
  document.getElementById("ws-artist").value = museum.artist || "";
  document.getElementById("ws-art-style").value = museum.artStyle || "";
  
  const artStyleCategorySelect = document.getElementById("ws-art-style-category");
  if (artStyleCategorySelect) {
    artStyleCategorySelect.value = museum.artStyleCategory || "";
  }
  
  const roomSelect = document.getElementById("ws-rooms");
  if(Array.from(roomSelect.options).some(opt => opt.value == museum.rooms)) {
    roomSelect.value = museum.rooms;
  } else {
    roomSelect.value = roomSelect.options[roomSelect.options.length - 1].value;
  }

  document.getElementById("ws-has-cafe").checked = museum.hasCafe || false;
  document.getElementById("ws-cafe-menu").value = museum.cafeMenu || "";
  
  const optShop = document.getElementById("ws-has-shop"); if(optShop) optShop.checked = museum.hasShop || false;
  const optGarden = document.getElementById("ws-has-garden"); if(optGarden) optGarden.checked = museum.hasGarden || false;
  const optRoof = document.getElementById("ws-has-roof"); if(optRoof) optRoof.checked = museum.hasRoof || false;

  if (museum.guestbookUrl) {
    const cbGuestbook = document.getElementById("ws-has-guestbook");
    if(cbGuestbook) cbGuestbook.checked = true;
    const gbBlock = document.getElementById("ws-guestbook-block");
    if(gbBlock) gbBlock.classList.remove("hidden");
    document.getElementById("ws-guestbook-url").value = museum.guestbookUrl;
  }

  if (museum.ticketDesign && museum.ticketDesign.image) {
    const cbCustomTicket = document.getElementById("ws-has-custom-ticket");
    if (cbCustomTicket) cbCustomTicket.checked = true;
    const ticketBlock = document.getElementById("ws-ticket-design-block");
    if (ticketBlock) ticketBlock.classList.remove("hidden");
    const ticketPromptArea = document.getElementById("ws-ticket-prompt-text");
    if (ticketPromptArea) {
      ticketPromptArea.value = generateTicketPrompt({ name: museum.name, concept: museum.concept, style: resolvedStyle });
    }
    const ticketPreview = document.getElementById("ws-ticket-preview");
    if (ticketPreview) {
      ticketPreview.src = resolveImageSrc(museum.ticketDesign.image);
      ticketPreview.classList.remove("hidden");
    }
  }

  document.getElementById("tab-btn-build").click();
}

function renderPrompts(promptData) {
  const container = document.getElementById("prompts-container");
  container.innerHTML = "";
  
  promptData.forEach((p) => {
    const block = document.createElement("div");
    block.className = "prompt-block";
    const phaseDraft = currentDraft.phases[p.refIndex];
    
    const previewSrc = resolveImageSrc(phaseDraft.image);
    
    let deleteBtnHtml = "";
    if (p.id.startsWith("exhibition")) {
      deleteBtnHtml = `<button type="button" class="btn-remove-room" style="font-size: 0.75rem; padding: 0.3rem 0.8rem; border: 1px solid #444; color: #888; border-radius: 2px; background: transparent; cursor: pointer; transition: 0.3s;">この展示室を削除</button>`;
    }

    block.innerHTML = `
      <h4 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
        <span>${escapeHtml(p.title)}</span>
        ${deleteBtnHtml}
      </h4>
      <div class="prompt-box" style="margin-top:0;">
        <textarea readonly class="phase-prompt-text"></textarea>
        <div class="prompt-box-actions">
          <button type="button" class="btn-prompt-action btn-copy btn-with-icon">
            <svg class="icon-quiet" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="9" height="11" rx="0.5"/>
              <path d="M5.5 3 V1.5 a0.5 0.5 0 0 1 0.5 -0.5 H13 a0.5 0.5 0 0 1 0.5 0.5 V12.5"/>
            </svg>
            <span>写し取る</span>
          </button>
          <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" class="btn-prompt-action btn-chatgpt btn-with-icon">
            <svg class="icon-quiet" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 3 H3 V13 H13 V10"/>
              <path d="M9 3 H13 V7"/>
              <path d="M13 3 L8 8"/>
            </svg>
            <span>外部の対話AIを呼ぶ</span>
          </a>
        </div>
      </div>
      <label class="file-upload">空間画像を設定する<input type="file" accept="image/*" class="phase-img-input"></label>
      <img class="preview-img ${phaseDraft.image ? '' : 'hidden'}" alt="">
      <label class="phase-desc-label" style="margin-top: 1.2rem; display: block; color: var(--text-soft); font-size: 0.9rem;">
        この空間に添える言葉 <span style="color: var(--text-dim); font-size: 0.8rem;">(任意)</span>
        <textarea class="phase-desc-input" rows="3" placeholder="画像を見ながら、もし言葉が浮かんだら。&#10;鑑賞中、この空間の脇に静かに添えられます。" style="margin-top: 0.5rem; font-family: inherit; line-height: 1.8;"></textarea>
      </label>
    `;
    
    block.querySelector(".phase-prompt-text").value = p.text;
    if (previewSrc) block.querySelector(".preview-img").src = previewSrc;
    
    const descInput = block.querySelector(".phase-desc-input");
    if (phaseDraft.desc) {
      descInput.value = phaseDraft.desc;
    }
    descInput.addEventListener("input", (e) => {
      phaseDraft.desc = e.target.value;
    });
    
    block.querySelector(".btn-copy").addEventListener("click", async (e) => {
      const textarea = block.querySelector(".phase-prompt-text");
      await copyToClipboard(textarea.value, e.target);
    });
    
    block.querySelector(".phase-img-input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try {
        const blob = await compressImageToBlob(file, 1200, 0.8);
        const img = block.querySelector(".preview-img");
        const phaseObjUrl = URL.createObjectURL(blob);
        img.onload = () => URL.revokeObjectURL(phaseObjUrl);
        img.src = phaseObjUrl;
        img.classList.remove("hidden");
        phaseDraft.image = blob;
        checkCanRegister();
      } catch (err) {
        console.error(err);
        alert("画像の読み込みに失敗しました。");
      }
    });

    const btnRemoveRoom = block.querySelector(".btn-remove-room");
    if (btnRemoveRoom) {
      btnRemoveRoom.addEventListener("mouseenter", () => {
        btnRemoveRoom.style.background = "#222";
        btnRemoveRoom.style.color = "#fff";
        btnRemoveRoom.style.borderColor = "#666";
      });
      btnRemoveRoom.addEventListener("mouseleave", () => {
        btnRemoveRoom.style.background = "transparent";
        btnRemoveRoom.style.color = "#888";
        btnRemoveRoom.style.borderColor = "#444";
      });

      btnRemoveRoom.addEventListener("click", () => {
        const roomSelect = document.getElementById("ws-rooms");
        let currentRooms = parseInt(roomSelect.value);
        if (currentRooms <= 1) {
          alert("展示室は最低1室必要です。");
          return;
        }

        if (!confirm(`「${p.title}」を削除しますか?\n(これ以降の展示室の番号は繰り上がり、画像などは保持されます)`)) return;

        roomSelect.value = currentRooms - 1;

        const phaseIndex = currentDraft.phases.findIndex(ph => ph.id === p.id);
        if (phaseIndex !== -1) {
          currentDraft.phases.splice(phaseIndex, 1);
        }

        let exCount = 1;
        currentDraft.phases.forEach(ph => {
          if (ph.id.startsWith("exhibition")) {
            ph.id = `exhibition${exCount}`;
            ph.title = `第${exCount}展示室`;
            exCount++;
          }
        });

        document.getElementById("btn-generate-prompts").click();
      });
    }

    if (p.id.startsWith("exhibition")) {
      const artsContainer = document.createElement("div");
      artsContainer.className = "room-artworks-container";
      
      const roomNumber = parseInt(p.id.replace("exhibition", ""));
      const roomIndex = roomNumber - 1; 

      if (phaseDraft.artworks && phaseDraft.artworks.length > 0) {
        phaseDraft.artworks.forEach(art => {
          addArtworkUI(artsContainer, phaseDraft, art, roomIndex);
        });
      }

      const btnAddArt = document.createElement("button");
      btnAddArt.type = "button";
      btnAddArt.className = "btn-secondary btn-add-room-art";
      btnAddArt.textContent = "+ この展示室に作品を追加する";
      
      btnAddArt.addEventListener("click", () => {
        if(phaseDraft.artworks.length >= 10) return alert("1つの展示室につき登録できる作品は最大10点までです。");
        addArtworkUI(artsContainer, phaseDraft, null, roomIndex);
      });

      block.appendChild(artsContainer);
      block.appendChild(btnAddArt);
    }

    container.appendChild(block);
  });
}

function buildArtworkPromptOptions(roomIndex) {
  return {
    artStyleCategory: currentDraft.artStyleCategory || "",
    architectureStyle: currentDraft.style || "",
    museumSeed: currentDraft.museumSeed || (currentDraft.id || currentDraft.name || "default"),
    artworkSeed: "" 
  };
}

function addArtworkUI(container, phaseDraft, existingArtData = null, roomIndex = 0) {
  const artData = existingArtData || { 
    title: "", desc: "", link: "", image: null, 
    mediumSelect: "", customMedium: "", size: "",
    artworkSeed: "art_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)
  };
  if (!existingArtData) phaseDraft.artworks.push(artData);
  
  if (!artData.artworkSeed) {
    artData.artworkSeed = "art_" + (artData.title || "untitled") + "_" + Math.random().toString(36).slice(2, 8);
  }

  const artBlock = document.createElement("div");
  artBlock.className = "artwork-form-block";
  
  let initMedium = artData.mediumSelect === "custom" ? artData.customMedium : artData.mediumSelect;
  
  const promptOptions = {
    ...buildArtworkPromptOptions(roomIndex),
    artworkSeed: artData.artworkSeed
  };
  
  const artPrompt = generateArtworkPrompt(
    currentDraft.artStyle, 
    artData.title, 
    artData.desc, 
    currentDraft.concept, 
    initMedium, 
    roomIndex,
    promptOptions
  );

  artBlock.innerHTML = `
    <h4><span class="art-number">作品</span> <button type="button" class="btn-remove-art">削除</button></h4>
    
    <div class="form-group-2col" style="margin-top:0.5rem; gap:0.5rem;">
      <input type="text" class="art-title" placeholder="作品名 (例: 沈黙のフォルム I)">
      <select class="art-medium-select" style="margin-top: 0;">
        <option value="">画材・素材 (指定なし)</option>
        <option value="oil painting">油彩</option>
        <option value="watercolor">水彩</option>
        <option value="acrylic painting">アクリル</option>
        <option value="pastel art">パステル</option>
        <option value="charcoal drawing">木炭・鉛筆</option>
        <option value="digital illustration">デジタルアート</option>
        <option value="photography">写真</option>
        <option value="sculpture">彫刻・立体</option>
        <option value="custom">その他 (自由入力)...</option>
      </select>
    </div>
    
    <input type="text" class="art-medium-custom hidden" placeholder="画材を自由入力 (例: 鉄、ガラス)">
    
    <div style="display:flex; gap:0.5rem; margin-top:0.3rem; align-items:center;">
      <input type="text" class="art-size" placeholder="サイズ (例: F50号 / 116.7×91.0cm)" style="margin-top:0; flex:1;">
      <button type="button" class="btn-secondary btn-random-size" style="padding: 0.6rem 0.8rem; font-size:0.8rem; white-space:nowrap; margin-top:0;">サイズおまかせ</button>
    </div>

    <input type="text" class="art-desc" placeholder="キャプション・説明 (例: 1970年代の作品。)">
    <input type="text" class="art-link" placeholder="外部リンク (例: https://booth.pm/...)">
    
    <div style="display:flex; gap:0.5rem; margin-top:1.5rem; align-items:stretch;">
      <button type="button" class="btn-secondary btn-update-prompt" style="flex:1; font-size:0.75rem; padding:0.6rem; display:flex; flex-direction:column; justify-content:center;">
        <span style="display:block; margin-bottom:0.2rem; color:var(--text-soft);">① ゼロから生成する</span>
        <span style="display:block; font-size:0.65rem; color:var(--text-dim);">入力内容から新規作成</span>
      </button>
      <button type="button" class="btn-secondary btn-extract-prompt" style="flex:1; font-size:0.75rem; padding:0.6rem; border-color:var(--accent-deep); display:flex; flex-direction:column; justify-content:center;">
        <span style="display:block; margin-bottom:0.2rem; color:var(--accent);">② 空間画像から抽出する</span>
        <span style="display:block; font-size:0.65rem; color:var(--text-dim);">壁の絵を真正面に直す</span>
      </button>
    </div>
    
    <p class="hint" style="margin-top:0.8rem; margin-bottom:0.3rem;">
      【ヒント】AIツールに「この展示室の空間画像」を読み込ませ、下のプロンプトを実行してください。<br>
      <span style="font-size:0.8rem;">※AIは長文や日本語を入れると「文字のポスター」を生成しやすくなります。うまく生成されない場合は、説明文をシンプルな英語のみに書き換えてください。</span>
    </p>
    
    <div class="prompt-box">
      <textarea readonly class="art-prompt-text"></textarea>
      <div class="prompt-box-actions">
        <button type="button" class="btn-prompt-action btn-copy btn-with-icon">
          <svg class="icon-quiet" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="9" height="11" rx="0.5"/>
            <path d="M5.5 3 V1.5 a0.5 0.5 0 0 1 0.5 -0.5 H13 a0.5 0.5 0 0 1 0.5 0.5 V12.5"/>
          </svg>
          <span>写し取る</span>
        </button>
        <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" class="btn-prompt-action btn-chatgpt btn-with-icon">
          <svg class="icon-quiet" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 3 H3 V13 H13 V10"/>
            <path d="M9 3 H13 V7"/>
            <path d="M13 3 L8 8"/>
          </svg>
          <span>外部の対話AIを呼ぶ</span>
        </a>
      </div>
    </div>
    
    <label class="file-upload">作品画像を設定する<input type="file" accept="image/*" class="art-img-input"></label>
    <img class="preview-img ${artData.image ? '' : 'hidden'}" alt="">
  `;

  artBlock.querySelector(".art-title").value = artData.title || "";
  artBlock.querySelector(".art-medium-custom").value = artData.customMedium || "";
  artBlock.querySelector(".art-size").value = artData.size || "";
  artBlock.querySelector(".art-desc").value = artData.desc || "";
  artBlock.querySelector(".art-link").value = artData.link || "";
  artBlock.querySelector(".art-prompt-text").value = artPrompt;
  
  const artPreviewSrc = resolveImageSrc(artData.image);
  if (artPreviewSrc) {
    artBlock.querySelector(".preview-img").src = artPreviewSrc;
  }

  const updateNumbers = () => {
    container.querySelectorAll('.artwork-form-block').forEach((el, idx) => {
      el.querySelector('.art-number').textContent = `作品 ${idx + 1}`;
    });
  };

  artBlock.querySelector(".btn-remove-art").addEventListener("click", () => {
    const idx = phaseDraft.artworks.indexOf(artData);
    if (idx > -1) phaseDraft.artworks.splice(idx, 1);
    artBlock.remove();
    updateNumbers();
    checkCanRegister();
  });

  artBlock.querySelector(".btn-copy").addEventListener("click", async (e) => {
    const textarea = artBlock.querySelector(".art-prompt-text");
    await copyToClipboard(textarea.value, e.target);
  });

  artBlock.querySelector(".art-title").addEventListener("input", e => artData.title = e.target.value);
  artBlock.querySelector(".art-desc").addEventListener("input", e => artData.desc = e.target.value);
  artBlock.querySelector(".art-link").addEventListener("input", e => artData.link = e.target.value);
  artBlock.querySelector(".art-size").addEventListener("input", e => artData.size = e.target.value);
  
  const selectMedium = artBlock.querySelector(".art-medium-select");
  const inputCustomMedium = artBlock.querySelector(".art-medium-custom");
  
  if (artData.mediumSelect) selectMedium.value = artData.mediumSelect;
  if (selectMedium.value === "custom") inputCustomMedium.classList.remove("hidden");

  selectMedium.addEventListener("change", (e) => {
    artData.mediumSelect = e.target.value;
    if (e.target.value === "custom") {
      inputCustomMedium.classList.remove("hidden");
    } else {
      inputCustomMedium.classList.add("hidden");
      artData.customMedium = "";
    }
  });
  inputCustomMedium.addEventListener("input", e => artData.customMedium = e.target.value);

  artBlock.querySelector(".btn-random-size").addEventListener("click", () => {
    const isSculpture = selectMedium.value === "sculpture";
    let sizeStr = "";
    if (isSculpture) {
       const h = Math.floor(Math.random() * 180) + 20;
       const w = Math.floor(Math.random() * 80) + 10;
       const d = Math.floor(Math.random() * 80) + 10;
       sizeStr = `H${h} × W${w} × D${d} cm`;
    } else {
       const types = ["F", "P", "M", "S"];
       const numbers = [4, 6, 8, 10, 15, 20, 30, 50, 80, 100, 120, 150];
       const type = types[Math.floor(Math.random() * types.length)];
       const num = numbers[Math.floor(Math.random() * numbers.length)];
       sizeStr = `${type}${num}号`;
    }
    artBlock.querySelector(".art-size").value = sizeStr;
    artData.size = sizeStr;
  });

  artBlock.querySelector(".btn-update-prompt").addEventListener("click", () => {
    const title = artBlock.querySelector(".art-title").value;
    const desc = artBlock.querySelector(".art-desc").value;
    
    let finalMedium = selectMedium.value;
    if (finalMedium === "custom") finalMedium = inputCustomMedium.value;
    
    const promptTextarea = artBlock.querySelector(".art-prompt-text");
    
    const opts = {
      ...buildArtworkPromptOptions(roomIndex),
      artworkSeed: artData.artworkSeed
    };
    
    promptTextarea.value = generateArtworkPrompt(
      currentDraft.artStyle, 
      title, 
      desc, 
      currentDraft.concept, 
      finalMedium, 
      roomIndex,
      opts
    );
    
    promptTextarea.style.backgroundColor = "#2a2a2a";
    setTimeout(() => { promptTextarea.style.backgroundColor = "transparent"; }, 400);
  });

  artBlock.querySelector(".btn-extract-prompt").addEventListener("click", () => {
    let finalMedium = selectMedium.value;
    if (finalMedium === "custom") finalMedium = inputCustomMedium.value;
    
    const promptTextarea = artBlock.querySelector(".art-prompt-text");
    const is3D = finalMedium === "sculpture";
    
    promptTextarea.value = generateExtractionPrompt(
      currentDraft.artStyle, 
      currentDraft.concept, 
      finalMedium,
      is3D
    );
    
    promptTextarea.style.backgroundColor = "rgba(212, 181, 116, 0.1)";
    promptTextarea.style.borderColor = "var(--accent)";
    setTimeout(() => { 
      promptTextarea.style.backgroundColor = "transparent"; 
      promptTextarea.style.borderColor = "#2a2a2a"; 
    }, 400);
  });

  artBlock.querySelector(".art-img-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    try {
      const blob = await compressImageToBlob(file, 1200, 0.8);
      const img = artBlock.querySelector(".preview-img");
      const artObjUrl = URL.createObjectURL(blob);
      img.onload = () => URL.revokeObjectURL(artObjUrl);
      img.src = artObjUrl;
      img.classList.remove("hidden");
      artData.image = blob;
      checkCanRegister();
    } catch (err) {
      console.error(err);
      alert("画像の読み込みに失敗しました。");
    }
  });

  container.appendChild(artBlock);
  updateNumbers();
  checkCanRegister();
}

function checkCanRegister() {
  if(!currentDraft) return;
  let isOk = true;
  for(const phase of currentDraft.phases) {
    if(!phase.image) isOk = false;
  }
  document.getElementById("btn-register-museum").disabled = !isOk;
}

// =================================================================
// ライブラリ描画とポスター生成トリガー
// =================================================================
async function renderLibrary() {
  const list = await getAllCustomMuseums();
  const container = document.getElementById("library-museums");
  container.innerHTML = list.length === 0 ? "<p class='hint'>まだ登録されていません。</p>" : "";
  
  list.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    
    const firstImage = m.phases?.[0]?.image;
    const imgSrc = resolveImageSrc(firstImage);
    
    const cardInner = `
      <h3>${escapeHtml(m.name)}</h3>
      <p style="font-size:0.8rem; color:#888;">設計: ${escapeHtml(m.architect)}</p>
      <div class="card-actions-row" style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1.2rem; border-top:1px solid #333; padding-top:1rem;">
        <button class="btn-primary btn-generate-poster" style="font-size:0.85rem; padding:0.6rem;">ポスター(画像)を発行する</button>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-secondary btn-edit-museum" style="flex:1; font-size:0.75rem; padding:0.4rem;">改修する</button>
          <button class="btn-secondary btn-bind-invitation" style="flex:1; font-size:0.75rem; padding:0.4rem;">招待状(.museum)</button>
        </div>
      </div>
    `;
    
    if (imgSrc) {
      div.innerHTML = `<img alt="" src="${imgSrc}">${cardInner}`;
    } else {
      div.innerHTML = `<div style="height:160px; background:#333; margin-bottom:1rem; border-radius:2px;"></div>${cardInner}`;
    }
    
    div.onclick = () => {};
    div.querySelector('.btn-edit-museum').onclick = (e) => { e.stopPropagation(); playSE("click"); loadMuseumForEdit(m); };
    div.querySelector('.btn-bind-invitation').onclick = async (e) => {
      e.stopPropagation(); playHaptic("light"); playSE("click");
      try { await bindSingleInvitation(m); showInvitationGuide("bind", m.name); } catch(err) { alert("失敗しました"); }
    };
    
    div.querySelector('.btn-generate-poster').onclick = (e) => {
      e.stopPropagation();
      generateAndShowPoster(m);
    };

    container.appendChild(div);
  });
}

// =================================================================
// 鑑賞の記録：半券の束
// =================================================================
async function renderTicketStack() {
  const tickets = await getAllTickets();
  const stack = document.getElementById("ticket-stack");
  const empty = document.getElementById("ticket-empty-message");
  const status = document.getElementById("tickets-status");
  
  if (!stack) return;
  stack.innerHTML = "";
  
  if (magneticHandler) {
    document.removeEventListener("mousemove", magneticHandler);
    magneticHandler = null;
  }
  
  if (tickets.length === 0) {
    if (empty) empty.classList.remove("hidden");
    if (status) status.textContent = "— 半券は古いものから自然に失われていきます。";
    return;
  }
  if (empty) empty.classList.add("hidden");
  if (status) status.textContent = `— 全 ${tickets.length} 枚の半券。古いものから自然に失われていきます。`;
  
  const reversed = [...tickets].reverse();
  
  reversed.forEach((ticket, idx) => {
    const stub = createTicketStub(ticket, tickets.length - 1 - idx);
    
    const seed = hashCode(ticket.id);
    const offsetX = (seed % 40) - 20;
    const offsetY = idx * 12;
    const rot = ((seed >> 4) % 60 - 30) / 10;
    
    stub.style.setProperty("--base-x", `${offsetX}px`);
    stub.style.setProperty("--base-y", `${offsetY}px`);
    stub.style.setProperty("--base-rot", `${rot}deg`);
    stub.style.zIndex = reversed.length - idx;
    
    stub.addEventListener("click", () => {
      playHaptic("light");
      openTicketViewer(ticket, tickets.length - 1 - idx);
    });
    
    stack.appendChild(stub);
  });
  
  stack.style.minHeight = `${reversed.length * 12 + 480}px`;
  
  if (window.matchMedia("(hover: hover)").matches) {
    setupMagneticBehavior();
  }
}

function createTicketStub(ticket, serialIndex) {
  const stub = document.createElement("div");
  stub.className = "ticket-stub default-stub";
  if (ticket.museumStyle) {
    stub.classList.add(`style-${slugifyStyle(ticket.museumStyle)}`);
  }
  
  const ticketDesignSrc = resolveImageSrc(ticket.ticketDesign?.image);
  if (ticketDesignSrc) {
    stub.classList.add("has-custom-design");
    stub.style.backgroundImage = safeCssUrl(ticketDesignSrc);
  }
  
  const visited = formatVisitedAt(ticket.visitedAt);
  const serial = formatSerial(serialIndex);
  
  const coverSrc = resolveImageSrc(ticket.coverImage);
  if (coverSrc) {
    stub.style.setProperty("--cover-image", safeCssUrl(coverSrc));
    stub.classList.add("has-cover");
  }
  
  stub.innerHTML = `
    <div class="stub-perforation"></div>
    <div class="stub-header">
      <div class="stub-serial">${escapeHtml(serial)}</div>
      <div class="stub-museum-name">${escapeHtml(ticket.museumName || "無名の美術館")}</div>
      <div class="stub-departure">from ${escapeHtml(ticket.departure || "---")}</div>
    </div>
    <div class="stub-cover"></div>
    <div class="stub-footer">
      <div class="stub-meta">
        <span>滞在</span><strong>${escapeHtml(String(ticket.durationMin))}分</strong>
      </div>
      <div class="stub-date">${escapeHtml(visited)}</div>
    </div>
  `;
  
  return stub;
}

function setupMagneticBehavior() {
  const stack = document.getElementById("ticket-stack");
  if (!stack) return;
  
  magneticHandler = (e) => {
    const stubs = stack.querySelectorAll(".ticket-stub");
    if (stubs.length === 0) return;
    
    let nearest = null;
    let minDist = 120;
    
    stubs.forEach(stub => {
      const rect = stub.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < minDist) {
        minDist = dist;
        nearest = { stub, cx, cy };
      }
    });
    
    stubs.forEach(stub => {
      if (nearest && stub === nearest.stub) {
        const dx = (e.clientX - nearest.cx) * 0.12;
        const dy = (e.clientY - nearest.cy) * 0.12;
        stub.classList.add("magnetic-hover");
        stub.style.setProperty("--mag-x", `${dx}px`);
        stub.style.setProperty("--mag-y", `${dy}px`);
      } else {
        stub.classList.remove("magnetic-hover");
        stub.style.setProperty("--mag-x", `0px`);
        stub.style.setProperty("--mag-y", `0px`);
      }
    });
  };
  
  document.addEventListener("mousemove", magneticHandler);
}

function openTicketViewer(ticket, serialIndex) {
  const overlay = document.getElementById("ticket-viewer-overlay");
  const inner = document.getElementById("ticket-viewer-inner");
  if (!overlay || !inner) return;
  
  const visited = formatVisitedAt(ticket.visitedAt);
  const serial = formatSerial(serialIndex);
  
  const designSrc = resolveImageSrc(ticket.ticketDesign?.image);
  const hasCustom = !!designSrc;
  const customClass = hasCustom ? " has-custom-design" : "";
  
  inner.innerHTML = `
    <div class="ticket-receipt viewer-receipt${customClass}">
      <div class="viewer-serial">${escapeHtml(serial)}</div>
      <h2 class="ticket-title">鑑賞の記録</h2>
      <div class="ticket-divider"></div>
      <div class="ticket-details">
        <p><span>出発地</span> <strong>${escapeHtml(ticket.departure || "---")}</strong></p>
        <p><span>到着地</span> <strong>${escapeHtml(ticket.museumName || "---")}</strong></p>
        <p><span>滞在時間</span> <strong>約 ${escapeHtml(String(ticket.durationMin))} 分間</strong></p>
      </div>
      ${ticket.impression ? `
        <div class="ticket-divider"></div>
        <p class="ticket-impression">心に残ったもの<br><strong>${escapeHtml(ticket.impression)}</strong></p>
      ` : ""}
      <div class="ticket-divider"></div>
      <p class="ticket-message">${escapeHtml(visited)}</p>
      <button class="btn-black btn-delete-ticket" style="margin-top:1rem;">この半券を破棄する</button>
    </div>
  `;
  
  if (hasCustom) {
    const receiptEl = inner.querySelector(".ticket-receipt");
    receiptEl.style.backgroundImage = safeCssUrl(designSrc);
  }
  
  inner.querySelector(".btn-delete-ticket").addEventListener("click", async () => {
    if (!confirm("この半券を破棄します。よろしいですか?")) return;
    await deleteTicket(ticket.id);
    closeTicketViewer();
    await renderTicketStack();
  });
  
  overlay.classList.remove("hidden");
  setTimeout(() => overlay.classList.add("show"), 50);
}

function closeTicketViewer() {
  playHaptic("light");
  const overlay = document.getElementById("ticket-viewer-overlay");
  if (!overlay) return;
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.add("hidden"), 600);
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function slugifyStyle(style) {
  return style.replace(/\s+/g, "-").toLowerCase();
}
