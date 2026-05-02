// js/state.js
export const state = {
  departure: "不明な場所",
  museum: null,
  currentPhaseIndex: 0,
  tourStartTime: null,
  impression: null
};

export function setState(key, value) {
  state[key] = value;
}

export function resetTourState() {
  state.museum = null;
  state.currentPhaseIndex = 0;
  state.tourStartTime = null;
  state.impression = null;
}
