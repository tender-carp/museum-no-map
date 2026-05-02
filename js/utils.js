// js/utils.js

/**
 * HTMLエスケープ。innerHTMLに外部由来データを差し込む全箇所で使用する。
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * CSSのurl(...)に差し込む値をエスケープ。
 * ダブルクォート・シングルクォート・改行を除去し、url("...")の形で返す。
 */
export function safeCssUrl(value) {
  if (!value) return "none";
  // 改行・引用符を取り除く（CSS injectionの基本対策）
  const cleaned = String(value).replace(/["'\\\n\r]/g, "");
  return `url("${cleaned}")`;
}

// =================================================================
// 画像ソースの抽象化レイヤー
// 旧データ（DataURL文字列）と新データ（Blob）を透過的に扱う
// =================================================================

// Blobから生成したObjectURLをキャッシュし、不要時に解放する
const objectUrlCache = new WeakMap();

/**
 * 保存形式（Blob または DataURL文字列）から、表示に使えるURL文字列を返す。
 * Blobの場合は ObjectURL を生成・キャッシュする。
 */
export function resolveImageSrc(value) {
  if (!value) return "";
  if (typeof value === "string") {
    // 旧形式（DataURL）または既存のURL
    return value;
  }
  if (value instanceof Blob) {
    if (objectUrlCache.has(value)) {
      return objectUrlCache.get(value);
    }
    const url = URL.createObjectURL(value);
    objectUrlCache.set(value, url);
    return url;
  }
  return "";
}

/**
 * Blob → DataURL の変換（エクスポート時に使用）
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * DataURL → Blob の変換（インポート時に使用）
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (!dataUrl.startsWith("data:")) return null;
  
  const [header, base64] = dataUrl.split(",");
  if (!base64) return null;
  
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  
  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * 画像ファイルをCanvasで圧縮し、Blobとして返す。
 * 旧来の compressImage がDataURLを返していたのを、Blobを返すように変更。
 */
export function compressImageToBlob(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (evt) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image decode failed"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        // JPEGで透過部分が黒くなるのを防ぐため白で塗りつぶす
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("toBlob returned null"));
          },
          "image/jpeg",
          quality
        );
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}
