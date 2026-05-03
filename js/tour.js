// js/tour.js
import { state, setState } from "./state.js";
import { fadeBlackTransition, fadeWhiteTransition, playTuningSequence, applyKenBurns, playAmbience, stopAmbience, playHaptic, playSE } from "./effects.js";
import { addVisitor } from "./data.js";
import { saveTicket } from "./tickets.js";
import { escapeHtml, safeCssUrl, resolveImageSrc } from "./utils.js";

export function startTour() {
  state.tourStartTime = new Date();
  playHaptic("heavy");
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-tuning").classList.add("active");
  
  playTuningSequence(state.departure, state.museum.name, () => {
    fadeBlackTransition(() => {
      document.getElementById("screen-tuning").classList.remove("active");
      document.getElementById("screen-tour").classList.add("active");
      state.currentPhaseIndex = 0;
      renderCurrentPhase();
    });
  });
}

export async function advancePhase() {
  playHaptic("light");
  playSE("click");
  state.currentPhaseIndex++;
  
  if (state.currentPhaseIndex >= state.museum.phases.length) {
    await addVisitor();
    fadeWhiteTransition(() => {
      stopAmbience(); 
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      showImpressionStep();
      document.getElementById("screen-ending").classList.add("active");
    });
    return;
  }
  fadeBlackTransition(() => {
    renderCurrentPhase();
  });
}

// ツアーを途中で終え、半券のフローへ静かに合流する
export async function exitTourEarly() {
  // 短くても訪れたことには変わりないので、足跡は加算する
  await addVisitor();
  fadeWhiteTransition(() => {
    stopAmbience();
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    showImpressionStep();
    document.getElementById("screen-ending").classList.add("active");
  });
}

export function previousPhase() {
  playHaptic("light");
  playSE("cancel");
  if (state.currentPhaseIndex <= 0) return;
  state.currentPhaseIndex--;
  fadeBlackTransition(() => {
    renderCurrentPhase();
  });
}

function renderCurrentPhase() {
  const phase = state.museum.phases[state.currentPhaseIndex];

  const delayedUI = document.querySelectorAll(".delayed-ui, .delayed-ui-late");
  delayedUI.forEach(el => {
    el.classList.remove("play");
    void el.offsetWidth;
    el.classList.add("play");
  });

  // textContent 経由なのでエスケープ不要だが念のため明示
  document.getElementById("tour-title").textContent = phase.title || "";
  document.getElementById("tour-phase").textContent = state.museum.name || "";

  const imgEl = document.getElementById("tour-image");
  const phaseSrc = resolveImageSrc(phase.image);
  if (phaseSrc) {
    imgEl.style.backgroundImage = safeCssUrl(phaseSrc);
  } else {
    imgEl.style.backgroundImage = "none";
    imgEl.style.backgroundColor = "#1a1a1a";
  }
  applyKenBurns(imgEl);

  const flavor = document.getElementById("tour-flavor-text");
  if (state.currentPhaseIndex === 0 && state.museum.custom) {
    // innerHTML を使う箇所はすべてエスケープ
    flavor.innerHTML = `<strong>建築データ:</strong> 敷地 ${escapeHtml(state.museum.area)} / 設計 ${escapeHtml(state.museum.architect)} / 施工 ${escapeHtml(state.museum.builder)}`;
    flavor.classList.remove("hidden");
  } else {
    flavor.classList.add("hidden");
  }

  const descEl = document.getElementById("tour-description");
  if (phase.desc && phase.desc.trim()) {
    descEl.innerHTML = escapeHtml(phase.desc).replace(/\n/g, "<br>");
    descEl.classList.remove("hidden");
  } else {
    descEl.innerHTML = "";
    descEl.classList.add("hidden");
  }

  const prevBtn = document.getElementById("btn-prev-phase");
  if (prevBtn) {
    if (state.currentPhaseIndex > 0) {
      prevBtn.classList.remove("hidden");
    } else {
      prevBtn.classList.add("hidden");
    }
  }

  renderActivities(phase);

  let audioType = "silence";
  if (phase.id === "approach" || phase.id === "garden" || phase.id === "roof") {
    audioType = "wind";
  } else if (phase.id === "cafe") {
    audioType = "cafe";
  }
  playAmbience(audioType);
}

function renderActivities(phase) {
  const list = document.getElementById("activity-list");
  list.innerHTML = "";
  const acts = [];

  if (phase.id.startsWith("exhibition")) {
    const arts = phase.artworks || [];
    if (arts.length > 0) {
      const mediumDict = {
        "oil painting": "油彩", "watercolor": "水彩", "acrylic painting": "アクリル",
        "pastel art": "パステル", "charcoal drawing": "木炭・鉛筆", "digital illustration": "デジタルアート",
        "photography": "写真", "sculpture": "立体"
      };
      arts.forEach((art) => {
        let metaInfo = [];
        if (art.mediumSelect) {
          const mediumLabel = art.mediumSelect === "custom" ? art.customMedium : (mediumDict[art.mediumSelect] || art.mediumSelect);
          if (mediumLabel) metaInfo.push(mediumLabel);
        }
        if (art.size) metaInfo.push(art.size);
        let finalDesc = art.desc || "";
        if (metaInfo.length > 0) {
          finalDesc = `【 ${metaInfo.join(" / ")} 】\n\n${finalDesc}`;
        }
        acts.push({
          name: `『${art.title || "無題"}』の前に立つ`,
          cleanTitle: art.title || "無題",
          desc: finalDesc,
          link: art.link,
          image: art.image,
          isArtwork: true,
          author: art.originalCreator,
          createdAt: art.createdAt,
          originMuseum: art.originMuseum
        });
      });
    }
  }

  if (phase.id === "cafe" && state.museum.cafeMenu) acts.push({ name: "メニューに目を落とす", desc: `${state.museum.cafeMenu}。`, isArtwork: false });
  if (phase.id === "shop") acts.push({ name: "画集を手に取る", desc: "インクの匂いがする。記憶を持ち帰るための小さな儀式。", isArtwork: false });
  
  acts.push({ name: "空間を広く見渡す", desc: "", isArtwork: false, isSpaceFocus: true });

  acts.forEach(a => {
    const btn = document.createElement("div");
    btn.className = "activity-card-quiet";
    // テキストノードとして安全に組み立てる
    const icon = document.createElement("span");
    icon.className = "focus-icon";
    icon.textContent = "・";
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(" " + a.name));
    
    btn.addEventListener("mouseenter", () => playSE("hover"));
    
    btn.onclick = () => {
      playSE("click");
      runActivity(a, a.image || phase.image);
    };
    list.appendChild(btn);
  });
}

function runActivity(act, imageSrc) {
  playHaptic("light");
  const overlay = document.getElementById("activity-overlay");
  const imgEl = document.getElementById("activity-image");
  const textContainer = document.getElementById("activity-text");

  overlay.classList.remove("show", "mode-artwork", "mode-space", "hidden");
  if (act.isArtwork) overlay.classList.add("mode-artwork");
  else overlay.classList.add("mode-space");

  const resolvedSrc = resolveImageSrc(imageSrc);
  if (resolvedSrc) {
    imgEl.style.backgroundImage = safeCssUrl(resolvedSrc);
    imgEl.classList.remove("ken-burns");
    void imgEl.offsetWidth;
    imgEl.classList.add("ken-burns");
  } else {
    imgEl.style.backgroundImage = "none";
  }

  if (act.isSpaceFocus) {
    textContainer.classList.add("hidden");
  } else {
    textContainer.classList.remove("hidden");
    
    // cleanTitle は事前にデータから取り出してあるものを使う（正規表現破綻を回避）
    const titleText = act.cleanTitle !== undefined ? act.cleanTitle : act.name;
    document.getElementById("activity-title").textContent = titleText;

    const authorEl = document.getElementById("activity-author");
    if (act.isArtwork && act.author) {
      const year = act.createdAt ? new Date(act.createdAt).getFullYear() : new Date().getFullYear();
      let authorText = `Author: ${act.author} (${year})`;
      
      if (act.originMuseum && act.originMuseum !== state.museum.name) {
        const currentArchitect = state.museum.architect || "名もなき設計士";
        authorText += ` / Collection of ${currentArchitect}`;
      }
      
      authorEl.textContent = authorText;
      authorEl.classList.remove("hidden");
    } else {
      if (authorEl) {
        authorEl.textContent = "";
        authorEl.classList.add("hidden");
      }
    }

    document.getElementById("activity-description").innerHTML = escapeHtml(act.desc).replace(/\n/g, "<br>");

    const link = document.getElementById("activity-link");
    if (act.link) {
      // hrefにユーザー入力URLを入れる場合は、http(s)スキームのみ許可
      const safeHref = /^https?:\/\//i.test(act.link) ? act.link : "#";
      link.href = safeHref;
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
  }

  setTimeout(() => {
    overlay.classList.add("show");
    
    // スマホで「空間を広く見渡す」を開いた時、視点（スクロール位置）を中央にセットする
    if (act.isSpaceFocus && window.innerWidth <= 768) {
      const container = document.getElementById("activity-image-container");
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    }
  }, 50);
}

export function closeActivity() {
  playHaptic("light");
  playSE("cancel");
  const overlay = document.getElementById("activity-overlay");
  overlay.classList.remove("show");
  setTimeout(() => overlay.classList.add("hidden"), 800);
}

function showImpressionStep() {
  document.getElementById("ending-step-impression").classList.remove("hidden");
  document.getElementById("ending-step-ticket").classList.add("hidden");
  
  const list = document.getElementById("impression-list");
  list.innerHTML = "";
  const candidates = [];
  state.museum.phases.forEach(phase => {
    candidates.push({ type: "space", label: phase.title, sublabel: "— 空間", value: `空間「${phase.title}」` });
    if (phase.artworks && phase.artworks.length > 0) {
      phase.artworks.forEach(art => {
        candidates.push({ type: "artwork", label: `『${art.title || "無題"}』`, sublabel: "— 作品", value: `作品『${art.title || "無題"}』` });
      });
    }
  });
  candidates.forEach(c => {
    const card = document.createElement("div");
    card.className = `impression-card impression-${c.type}`;
    card.innerHTML = `<div class="imp-label">${escapeHtml(c.label)}</div><div class="imp-sub">${escapeHtml(c.sublabel)}</div>`;
    
    card.addEventListener("mouseenter", () => playSE("hover"));
    
    card.onclick = () => {
      playHaptic("light");
      playSE("click");
      setState("impression", c.value);
      proceedToTicket();
    };
    list.appendChild(card);
  });
}

export function proceedToTicket() {
  fadeBlackTransition(() => {
    document.getElementById("ending-step-impression").classList.add("hidden");
    document.getElementById("ending-step-ticket").classList.remove("hidden");
    generateTicket();
  });
}

async function generateTicket() {
  const endTime = new Date();
  const diffMs = endTime - state.tourStartTime;
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));

  const ticketData = {
    departure: state.departure,
    museumName: state.museum.name,
    museumId: state.museum.id,
    museumStyle: state.museum.style || null,
    coverImage: state.museum.phases[0]?.image || null,
    ticketDesign: state.museum.ticketDesign || null,
    durationMin: diffMins,
    impression: state.impression || null
  };

  document.getElementById("ticket-departure").textContent = ticketData.departure;
  document.getElementById("ticket-museum").textContent = ticketData.museumName;
  document.getElementById("ticket-time").textContent = `約 ${ticketData.durationMin} 分間`;

  if (ticketData.impression) {
    document.getElementById("ticket-impression").textContent = ticketData.impression;
    document.getElementById("ticket-impression-wrap").classList.remove("hidden");
  } else {
    document.getElementById("ticket-impression-wrap").classList.add("hidden");
  }

  applyTicketDesign(ticketData);
  await saveTicket(ticketData);
}

function applyTicketDesign(ticketData) {
  const receipt = document.querySelector("#ending-step-ticket .ticket-receipt");
  if (!receipt) return;
  if (ticketData.ticketDesign && ticketData.ticketDesign.image) {
    const src = resolveImageSrc(ticketData.ticketDesign.image);
    receipt.classList.add("has-custom-design");
    receipt.style.backgroundImage = safeCssUrl(src);
  } else {
    receipt.classList.remove("has-custom-design");
    receipt.style.backgroundImage = "";
  }
}
