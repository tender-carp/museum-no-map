// js/data.js
import { getAllCustomMuseums } from "./workshop.js";
import { get, set } from "https://cdn.jsdelivr.net/npm/idb-keyval/+esm";

const DEFAULT_MUSEUMS = [
  {
    id: "m_unkai_no_itadaki",
    name: "雲海ノ頂、硝子ノ回廊",
    concept: "木と硝子と雲海。朝の光だけが、静かに作品を照らす。",
    location: "雲海を見下ろす山の頂",
    style: "warm daylight & wood",
    architect: "名もなき設計士",
    builder: "水脈アーキテクチャ",
    area: "1,800㎡",
    artist: "金箔と灰で風景を描く現代日本画家",
    artStyle: "金箔・銀箔・墨を用いた抽象的な山水",
    artStyleCategory: "nihonga",
    rooms: 1,
    hasCafe: true,
    cafeMenu: "朝霧のカフェオレ",
    hasShop: false,
    hasGarden: false,
    hasRoof: false,
    custom: false,
    phases: [
      {
        id: "approach",
        title: "アプローチ",
        desc: "崖の縁から、硝子の回廊が静かに伸びている。\n足元には、雲海。\n扉はまだ、遠い。",
        image: "assets/default-museum/approach.png",
        artworks: undefined
      },
      {
        id: "entrance",
        title: "エントランス・ロビー",
        desc: "硝子の床の下を、雲がゆっくりと流れていく。\n誰もいない。一脚のベンチだけが、光の中に置かれている。",
        image: "assets/default-museum/entrance.png",
        artworks: undefined
      },
      {
        id: "exhibition1",
        title: "第1展示室",
        desc: "壁の絵が、朝の光を吸い込んで静かに発光している。\n金箔は、風景の記憶のように、ところどころ剥がれている。",
        image: "assets/default-museum/exhibition1.png",
        artworks: [
          {
            title: "雲海 I",
            desc: "夜明け前、山の頂から見下ろした雲海の記憶。\n金箔と銀箔が、光と霧の境界を曖昧にしている。",
            link: "",
            image: "assets/default-museum/artwork-unkai-1.png",
            mediumSelect: "custom",
            customMedium: "金箔・銀箔・墨／和紙",
            size: "F50号",
            originalCreator: "名もなき設計士",
            createdAt: "2026-01-01T00:00:00.000Z",
            originMuseum: "雲海ノ頂、硝子ノ回廊",
            artworkSeed: "art_unkai_1_default"
          }
        ]
      },
      {
        id: "cafe",
        title: "併設カフェ",
        desc: "硝子の向こうに、雲海が広がっている。\nカウンターに置かれた一杯のカフェオレから、白い湯気が立ちのぼる。",
        image: "assets/default-museum/cafe.png",
        artworks: undefined
      }
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
