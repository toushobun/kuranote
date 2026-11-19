/** 浏览器重编码图片时不保留原图及 EXIF（包括位置信息）。 */
export type ImageCompressionOptions = {
  maxDimension: number;
  mimeType: "image/jpeg" | "image/webp";
  quality: number;
  fallbackMimeType?: "image/jpeg";
};

export type CompressedImage = {
  blob: Blob;
  height: number;
  width: number;
};

/** 按比例缩小，短边至少保留一个像素；小图不放大。 */
export function getScaledImageSize(
  width: number,
  height: number,
  maxDimension: number,
): { height: number; width: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

/** 兼容浏览器支持的图片输入格式；无法解码或无法编码时抛错。 */
export async function compressImage(
  file: Blob,
  options: ImageCompressionOptions,
): Promise<CompressedImage> {
  // 必须在重编码前校正 EXIF 方向，重新编码后的 Blob 不包含原始 EXIF。
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const { height, width } = getScaledImageSize(
      bitmap.width,
      bitmap.height,
      options.maxDimension,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context unavailable");

    context.drawImage(bitmap, 0, 0, width, height);

    // JPEG 没有透明通道，背景先铺白，避免透明图片变黑。
    if (options.mimeType === "image/jpeg") {
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
    }

    const primary = await canvasToBlob(
      canvas,
      options.mimeType,
      options.quality,
    );
    if (primary?.type === options.mimeType) {
      return { blob: primary, height, width };
    }

    if (options.fallbackMimeType === "image/jpeg") {
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      const fallback = await canvasToBlob(
        canvas,
        "image/jpeg",
        options.quality,
      );
      if (fallback?.type === "image/jpeg") {
        return { blob: fallback, height, width };
      }
    }

    throw new Error("image encoding failed");
  } finally {
    bitmap.close();
  }
}
