// js/data.js
import { getAllCustomMuseums } from "./workshop.js";
import { get, set } from "https://cdn.jsdelivr.net/npm/idb-keyval/+esm";

const DEFAULT_MUSEUMS = [
  {
    id: "m_sample1",
    name: "忘却の近代ギャラリー",
    concept: "都市の喧騒から隔絶された、コンクリートと静寂の空間。",
    architect: "名もなき建築家",
    builder: "重工建設",
    area: "1,200㎡",
    hasCafe: true,
    cafeMenu: "ブラックコーヒーと無地のクッキー",
    custom: false,
    rooms: 1,
    artworks: [
      { title: "沈黙のフォルム I", desc: "モノクロームの写真。歪んだオブジェが写っている。", link: "", image: "" }
    ],
    phases: [
      { id: "approach", title: "アプローチ", desc: "冷たいコンクリートの壁が続く。入口は、重い鉄の扉だ。", image: "", audio: "wind" },
      { id: "exhibition1", title: "第1展示室", desc: "広々とした空間。冷たいコンクリートの壁に、いくつかの作品が飾られている。", image: "", audio: "silence" },
      { id: "cafe", title: "併設カフェ", desc: "窓から灰色の空が見える。コーヒーの香りが微かに漂う。", image: "", audio: "cafe" }
    ]
  }
];

export async function loadData() {
  const customMuseums = await getAllCustomMuseums();
  return {
    museums: [...DEFAULT_MUSEUMS, ...customMuseums]
  };
}

export async function getTotalVisitors() {
  try { 
    return (await get("mj-visitors")) || 0; 
  } catch { return 0; }
}

export async function addVisitor() {
  const v = await getTotalVisitors();
  await set("mj-visitors", v + 1);
}
