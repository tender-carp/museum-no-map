// js/main.js
import { loadData } from "./data.js";
import { state, setState, resetTourState } from "./state.js";
import { initWorkshop } from "./workshop.js";
import { startTour, advancePhase, previousPhase, closeActivity, proceedToTicket, exitTourEarly } from "./tour.js";
import { playHaptic, unlockAudio, playSE, playTitleAmbience, stopAmbience } from "./effects.js";
import { escapeHtml, safeCssUrl, resolveImageSrc } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  let DATA;
  try {
    DATA = await loadData();
  } catch (e) {
    console.error("[main] loadData FAILED", e);
    DATA = { museums: [] };
  }

  try {
    await initWorkshop();
  } catch (e) {
    console.error("[main] initWorkshop FAILED", e);
  }

  document.querySelectorAll("button, .card, .impression-card, .activity-card-quiet").forEach(el => {
    el.addEventListener("mouseenter", () => playSE("hover"));
  });

  playTitleAmbience();

  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest("#screen-tour") || e.target.closest("#activity-overlay")) {
      e.preventDefault();
    }
  });

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  }

  function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (!el) return;
    el.onclick = handler;
  }

  let tapCount = 0;
  let tapTimeout;
  const mainTitle = document.getElementById("main-title");
  if (mainTitle) {
    mainTitle.addEventListener("click", () => {
      tapCount++;
      clearTimeout(tapTimeout);
      if (tapCount >= 5) {
        if(localStorage.getItem("mj_dev_mode") === "true") {
          localStorage.removeItem("mj_dev_mode");
          alert("【開発者モード】オフにしました。");
        } else {
          localStorage.setItem("mj_dev_mode", "true");
          alert("【開発者モード】オンにしました。");
        }
        location.reload();
      }
      tapTimeout = setTimeout(() => { tapCount = 0; }, 500);
    });
  }

  bindClick("btn-start", () => {
    playHaptic("light");
    playSE("click");
    unlockAudio(); 

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.log("Fullscreen error:", err));
    }

    showScreen("screen-departure");
    const inp = document.getElementById("input-departure");
    if (inp) inp.focus();
  });
  
  bindClick("btn-confirm-departure", async () => {
    playHaptic("light");
    playSE("click");
    unlockAudio(); 
    const dep = document.getElementById("input-departure").value.trim();
    setState("departure", dep || "名もなき場所");
    
    DATA = await loadData();
    renderMuseumMap(DATA.museums);
    showScreen("screen-museum");
  });

  bindClick("btn-workshop", async () => {
    playHaptic("light");
    playSE("click");
    try {
      await initWorkshop(); 
    } catch (e) {
      console.error("[btn-workshop] initWorkshop failed", e);
    }
    showScreen("screen-workshop");
  });
  
  bindClick("btn-back-to-title", () => {
    playHaptic("light");
    playSE("cancel");
    showScreen("screen-title");
  });
  
  bindClick("btn-next-phase", advancePhase);
  bindClick("btn-prev-phase", previousPhase);
  bindClick("btn-activity-skip", closeActivity);
  
  bindClick("btn-exit-tour", () => {
    playHaptic("light");
    playSE("cancel");
    exitTourEarly();
  });
  
  bindClick("btn-skip-impression", () => {
    playHaptic("light");
    playSE("cancel");
    setState("impression", null);
    proceedToTicket();
  });
  
  bindClick("btn-return-reality", async () => {
    playHaptic("heavy");
    playSE("cancel");

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.log("Exit fullscreen error:", err));
    }

    resetTourState();
    DATA = await loadData();
    showScreen("screen-title");
    playTitleAmbience();
  });

  // ====================================
  // 利用規約オーバーレイの開閉
  // ====================================
  bindClick("btn-show-terms", () => {
    playSE("click");
    const overlay = document.getElementById("terms-overlay");
    if (!overlay) return;
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.add("show"), 50);
  });

  bindClick("btn-close-terms", () => {
    playSE("cancel");
    const overlay = document.getElementById("terms-overlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    setTimeout(() => overlay.classList.add("hidden"), 600);
  });

  // 背景クリックでも閉じる
  const termsOverlay = document.getElementById("terms-overlay");
  if (termsOverlay) {
    termsOverlay.addEventListener("click", (e) => {
      if (e.target.id === "terms-overlay") {
        playSE("cancel");
        termsOverlay.classList.remove("show");
        setTimeout(() => termsOverlay.classList.add("hidden"), 600);
      }
    });
  }

  // ====================================
  // 美術館を贈るには／受け取るには オーバーレイ
  // ====================================
  bindClick("btn-show-etiquette", () => {
    playSE("click");
    const overlay = document.getElementById("etiquette-overlay");
    if (!overlay) return;
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.add("show"), 50);
  });

  bindClick("btn-close-etiquette", () => {
    playSE("cancel");
    const overlay = document.getElementById("etiquette-overlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    setTimeout(() => overlay.classList.add("hidden"), 600);
  });

  const etiquetteOverlay = document.getElementById("etiquette-overlay");
  if (etiquetteOverlay) {
    etiquetteOverlay.addEventListener("click", (e) => {
      if (e.target.id === "etiquette-overlay") {
        playSE("cancel");
        etiquetteOverlay.classList.remove("show");
        setTimeout(() => etiquetteOverlay.classList.add("hidden"), 600);
      }
    });
  }

  // ====================================
  // 招待状の作法ガイド（綴じた後／受け取った後）
  // ====================================
  bindClick("btn-close-invitation-guide", () => {
    playSE("cancel");
    const overlay = document.getElementById("invitation-guide-overlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    setTimeout(() => overlay.classList.add("hidden"), 600);
  });

  const invitationGuideOverlay = document.getElementById("invitation-guide-overlay");
  if (invitationGuideOverlay) {
    invitationGuideOverlay.addEventListener("click", (e) => {
      if (e.target.id === "invitation-guide-overlay") {
        playSE("cancel");
        invitationGuideOverlay.classList.remove("show");
        setTimeout(() => invitationGuideOverlay.classList.add("hidden"), 600);
      }
    });
  }

  function renderMuseumMap(museums) {
    const container = document.getElementById("museum-list");
    if (!container) return;
    container.innerHTML = "";
    museums.forEach(m => {
      const card = document.createElement("div");
      card.className = "card map-pin";
      
      const firstImage = m.phases[0]?.image;
      const imgSrc = resolveImageSrc(firstImage);
      
      // 画像div は innerHTML 経由で属性に埋め込まず、DOM プロパティで直接セットする
      const pinImgDiv = document.createElement("div");
      pinImgDiv.className = imgSrc ? "pin-img" : "pin-img empty";
      if (imgSrc) {
        pinImgDiv.style.backgroundImage = `url("${imgSrc}")`;
      }
      
      const pinInfoDiv = document.createElement("div");
      pinInfoDiv.className = "pin-info";
      pinInfoDiv.innerHTML = `
        <span class="pin-coord">環境座標: ${escapeHtml(m.location || "不明")}</span>
        <h3>${escapeHtml(m.name)}</h3>
      `;
      
      card.appendChild(pinImgDiv);
      card.appendChild(pinInfoDiv);
      
      card.addEventListener("mouseenter", () => playSE("hover"));
      
      card.onclick = () => {
        playHaptic("heavy");
        playSE("click");
        stopAmbience(true);
        unlockAudio(); 
        
        container.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        setState("museum", m);
        
        setTimeout(() => {
          startTour();
        }, 300);
      };
      container.appendChild(card);
    });
  }
});
