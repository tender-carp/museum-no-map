// js/effects.js

// デバイスのバイブレーション（ハプティクス）による触覚フィードバック
export function playHaptic(type = "light") {
  if (navigator.vibrate) {
    if (type === "light") navigator.vibrate(15);
    if (type === "heavy") navigator.vibrate([30, 50, 30]);
  }
}

// -----------------------------------------------------------------
// UI 効果音 (SE) 管理
// -----------------------------------------------------------------
const seAudioElements = {};

export function playSE(type) {
  const seMap = {
    "hover": "audio/se/hover.mp3",
    "click": "audio/se/click.mp3",
    "cancel": "audio/se/cancel.mp3",
    "warp": "audio/se/warp.mp3"
  };
  
  if (!seMap[type]) return;

  if (!seAudioElements[type]) {
    seAudioElements[type] = new Audio(seMap[type]);
  }
  
  const audio = seAudioElements[type];
  audio.currentTime = 0; 
  
  if (type === "hover") audio.volume = 0.1;
  else audio.volume = 0.4;

  audio.play().catch(() => { /* Autoplayブロック時は無視 */ });
}

// -----------------------------------------------------------------
// Web Audio API による環境音管理（タイトル）
// AudioContext + GainNode でフェードを精密にコントロールする
// -----------------------------------------------------------------
let audioCtx = null;
let titleSourceNode = null;
let titleGainNode = null;
let titleAudioBuffer = null;
let titleStartTime = 0;
let titleAudioElement = null; // ストリーミング用フォールバック
let titleIsIntended = false;
let titleUnlockListener = null;

const TITLE_AMBIENCE_URL = "audio/ambience/title-ambient.mp3";
const TITLE_VOLUME = 0.2;
const TITLE_FADE_OUT_SEC = 1.5;

function getAudioContext() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

async function loadTitleBuffer() {
  if (titleAudioBuffer) return titleAudioBuffer;
  const ctx = getAudioContext();
  if (!ctx) return null;
  try {
    const res = await fetch(TITLE_AMBIENCE_URL);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    titleAudioBuffer = await ctx.decodeAudioData(arr);
    return titleAudioBuffer;
  } catch (e) {
    console.log("Title ambience load failed", e);
    return null;
  }
}

function startTitleNode() {
  const ctx = getAudioContext();
  if (!ctx || !titleAudioBuffer) return;
  
  // 既に鳴っている場合は何もしない
  if (titleSourceNode) return;
  
  titleSourceNode = ctx.createBufferSource();
  titleSourceNode.buffer = titleAudioBuffer;
  titleSourceNode.loop = true;
  
  titleGainNode = ctx.createGain();
  titleGainNode.gain.setValueAtTime(0, ctx.currentTime);
  titleGainNode.gain.linearRampToValueAtTime(TITLE_VOLUME, ctx.currentTime + 0.8);
  
  titleSourceNode.connect(titleGainNode).connect(ctx.destination);
  titleSourceNode.start(0);
  titleStartTime = ctx.currentTime;
}

export async function playTitleAmbience() {
  titleIsIntended = true;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // ブラウザのAutoplay制限により、ユーザー操作前は AudioContext が suspended の可能性
  if (ctx.state === "suspended") {
    if (!titleUnlockListener) {
      titleUnlockListener = async () => {
        if (!titleIsIntended) return;
        try {
          await ctx.resume();
          await loadTitleBuffer();
          startTitleNode();
        } catch (e) { /* noop */ }
        document.removeEventListener("click", titleUnlockListener);
        document.removeEventListener("touchstart", titleUnlockListener);
        titleUnlockListener = null;
      };
      document.addEventListener("click", titleUnlockListener, { once: false });
      document.addEventListener("touchstart", titleUnlockListener, { once: false });
    }
    return;
  }
  
  await loadTitleBuffer();
  startTitleNode();
}

export function stopAmbience(isTitle = false) {
  if (isTitle) {
    titleIsIntended = false;
    
    if (titleUnlockListener) {
      document.removeEventListener("click", titleUnlockListener);
      document.removeEventListener("touchstart", titleUnlockListener);
      titleUnlockListener = null;
    }
    
    const ctx = audioCtx;
    if (ctx && titleGainNode && titleSourceNode) {
      // GainNode で精密にフェードアウト
      const now = ctx.currentTime;
      titleGainNode.gain.cancelScheduledValues(now);
      titleGainNode.gain.setValueAtTime(titleGainNode.gain.value, now);
      titleGainNode.gain.linearRampToValueAtTime(0, now + TITLE_FADE_OUT_SEC);
      
      const sourceToStop = titleSourceNode;
      const gainToDisconnect = titleGainNode;
      titleSourceNode = null;
      titleGainNode = null;
      
      setTimeout(() => {
        try {
          sourceToStop.stop();
          sourceToStop.disconnect();
          gainToDisconnect.disconnect();
        } catch (e) { /* already stopped */ }
      }, TITLE_FADE_OUT_SEC * 1000 + 100);
    }
    
  } else {
    // ツアー中の環境音（HTMLAudioElement 経由）を止める
    const audioEl = document.getElementById("tour-audio");
    if (audioEl) {
      audioEl.pause();
    }
  }
}

// -----------------------------------------------------------------
// ツアー中の環境音（HTMLAudioElement のまま）
// -----------------------------------------------------------------
export function unlockAudio() {
  const audioEl = document.getElementById("tour-audio");
  if (audioEl) {
    audioEl.volume = 0; 
  }
  // AudioContext のロック解除も兼ねる
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

export function playAmbience(type) {
  const audioEl = document.getElementById("tour-audio");
  if (!audioEl) return;

  const audioMap = {
    "wind": "audio/ambience/wind.mp3",
    "silence": "audio/ambience/room-tone.mp3",
    "cafe": "audio/ambience/cafe.mp3"
  };
  
  const src = audioMap[type] || audioMap["silence"];
  
  if (audioEl.getAttribute("src") === src && !audioEl.paused) {
    return;
  }

  audioEl.src = src;
  audioEl.loop = true;
  audioEl.volume = 0.3;
  
  audioEl.play().catch(e => console.log("Audio play prevented:", e));
}

// -----------------------------------------------------------------
// 画面トランジション演出
// -----------------------------------------------------------------
export function fadeBlackTransition(midCallback) {
  return new Promise(resolve => {
    const veil = document.createElement("div");
    veil.className = "fade-veil black";
    document.body.appendChild(veil);
    
    requestAnimationFrame(() => veil.style.opacity = "1");
    
    setTimeout(() => {
      if (midCallback) midCallback();
      veil.style.opacity = "0";
      setTimeout(() => { veil.remove(); resolve(); }, 1200);
    }, 1000);
  });
}

export function fadeWhiteTransition(midCallback) {
  return new Promise(resolve => {
    const veil = document.createElement("div");
    veil.className = "fade-veil white";
    document.body.appendChild(veil);
    
    requestAnimationFrame(() => veil.style.opacity = "1");
    
    setTimeout(() => {
      if (midCallback) midCallback();
      veil.style.opacity = "0";
      setTimeout(() => { veil.remove(); resolve(); }, 2000);
    }, 2000);
  });
}

export function playTuningSequence(departure, museumName, callback) {
  const textEl = document.getElementById("tuning-text");
  textEl.style.opacity = "0";
  
  setTimeout(() => {
    textEl.textContent = "まもなく、扉が開きます。";
    textEl.style.opacity = "1";
    
    setTimeout(() => {
      textEl.style.opacity = "0";
      setTimeout(() => {
        if(callback) callback();
      }, 800);
    }, 2500);
  }, 800);
}

export function applyKenBurns(element) {
  if (!element) return;
  element.classList.remove("ken-burns");
  void element.offsetWidth; 
  element.classList.add("ken-burns");
}
