/** 头像压缩后的最长边（px）。 */
export const avatarMaxDimension = 512;

const avatarImageQuality = 0.85;

/** 按比例缩放到最长边不超过上限，小图不放大。 */
export function getAvatarScaledSize(
  width: number,
  height: number,
  maxDimension = avatarMaxDimension,
): { height: number; width: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, avatarImageQuality);
  });
}

/**
 * 在浏览器中把图片缩放到最长边 512px 并转成 WebP。
 * 不支持 WebP 编码的浏览器（如 Safari）会返回 PNG，此时改用 JPEG，避免文件过大。
 * 图片无法解码时抛出异常，由调用方提示用户换一张图片。
 */
export async function compressAvatarImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  try {
    const { height, width } = getAvatarScaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("canvas 2d context unavailable");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const webp = await canvasToBlob(canvas, "image/webp");
    if (webp?.type === "image/webp") return webp;

    // JPEG 不支持透明，先铺白底。
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);

    const jpeg = await canvasToBlob(canvas, "image/jpeg");
    if (jpeg?.type === "image/jpeg") return jpeg;

    throw new Error("avatar image encoding failed");
  } finally {
    bitmap.close();
  }
}
