// js/tickets.js
import { get, set } from "https://cdn.jsdelivr.net/npm/idb-keyval/+esm";

const TICKETS_KEY = "mj-tickets";
const MAX_TICKETS = 100; // 有限であることがコンセプト

export async function saveTicket(ticket) {
  try {
    const list = (await get(TICKETS_KEY)) || [];
    const newTicket = {
      ...ticket,
      id: "tk_" + Date.now(),
      visitedAt: new Date().toISOString()
    };
    list.push(newTicket);
    // 古いものから自然に失われていく
    while (list.length > MAX_TICKETS) list.shift();
    await set(TICKETS_KEY, list);
    return newTicket;
  } catch (e) {
    console.error("Failed to save ticket", e);
    return null;
  }
}

export async function getAllTickets() {
  try {
    return (await get(TICKETS_KEY)) || [];
  } catch {
    return [];
  }
}

export async function deleteTicket(id) {
  try {
    const list = await getAllTickets();
    const filtered = list.filter(t => t.id !== id);
    await set(TICKETS_KEY, filtered);
  } catch (e) {
    console.error("Failed to delete ticket", e);
  }
}

// 訪問日時を表示用にフォーマット
export function formatVisitedAt(isoString) {
  try {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day}  ${hh}:${mm}`;
  } catch {
    return "---";
  }
}

// 通し番号をゼロ埋めで
export function formatSerial(index) {
  return "No. " + String(index + 1).padStart(4, "0");
}
