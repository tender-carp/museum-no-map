// js/image-upload.js
import { supabase } from "./supabase.js";

/**
 * Blob を Supabase Storage に upload して public URL を返す
 */
export async function uploadImage({
  museumId,
  fileName,
  blob
}) {
  const path = `${museumId}/${fileName}`;

  const { error } = await supabase.storage
    .from("museums")
    .upload(path, blob, {
      upsert: true,           // 同名なら上書き
      contentType: blob.type
    });

  if (error) {
    throw new Error("Upload failed: " + error.message);
  }

  const { data } = supabase.storage
    .from("museums")
    .getPublicUrl(path);

  return data.publicUrl;
}