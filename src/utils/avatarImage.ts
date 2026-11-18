import { compressImage, getScaledImageSize } from "utils/imageCompression";

/** 头像压缩后的最长边（px）。 */
export const avatarMaxDimension = 512;

export function getAvatarScaledSize(
  width: number,
  height: number,
  maxDimension = avatarMaxDimension,
): { height: number; width: number } {
  return getScaledImageSize(width, height, maxDimension);
}

/** 头像优先采用 WebP，不支持时回退 JPEG。 */
export async function compressAvatarImage(file: Blob): Promise<Blob> {
  const { blob } = await compressImage(file, {
    fallbackMimeType: "image/jpeg",
    maxDimension: avatarMaxDimension,
    mimeType: "image/webp",
    quality: 0.85,
  });
  return blob;
}
