import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compressImage, getScaledImageSize } from "utils/imageCompression";

describe("getScaledImageSize", () => {
  it("小图不放大，宽高等比缩放", () => {
    expect(getScaledImageSize(300, 200, 1600)).toEqual({
      width: 300,
      height: 200,
    });
    expect(getScaledImageSize(3200, 1600, 1600)).toEqual({
      width: 1600,
      height: 800,
    });
  });
  it("极端长宽比仍保留最小一个像素", () => {
    expect(getScaledImageSize(20000, 1, 320)).toEqual({
      width: 320,
      height: 1,
    });
  });
});

describe("compressImage", () => {
  const bitmap = { width: 3200, height: 1600, close: vi.fn() };
  const context = {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "",
    globalCompositeOperation: "source-over",
  };

  beforeEach(() => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as never,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (callback, mimeType) {
        callback(new Blob(["jpeg"], { type: mimeType }));
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("小票 JPEG 压缩修正 EXIF 方向、铺白底并释放位图", async () => {
    const result = await compressImage(new Blob(["img"]), {
      maxDimension: 1600,
      mimeType: "image/jpeg",
      quality: 0.75,
    });
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), {
      imageOrientation: "from-image",
    });
    expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 800);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1600, 800);
    expect(result).toEqual({
      blob: expect.any(Blob),
      width: 1600,
      height: 800,
    });
    expect(result.blob.type).toBe("image/jpeg");
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it("缩略图压缩到 320px", async () => {
    const result = await compressImage(new Blob(["img"]), {
      maxDimension: 320,
      mimeType: "image/jpeg",
      quality: 0.7,
    });
    expect(result).toMatchObject({ width: 320, height: 160 });
  });

  it("输出不符合格式时拒绝成功并释放位图", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(new Blob(["png"], { type: "image/png" })),
    );
    await expect(
      compressImage(new Blob(["img"]), {
        maxDimension: 1600,
        mimeType: "image/jpeg",
        quality: 0.75,
      }),
    ).rejects.toThrow();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
});
