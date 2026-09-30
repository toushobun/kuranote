import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  avatarMaxDimension,
  compressAvatarImage,
  getAvatarScaledSize,
} from "utils/avatarImage";

describe("getAvatarScaledSize", () => {
  it("按比例把最长边缩放到 512px", () => {
    expect(getAvatarScaledSize(2048, 1024)).toEqual({
      height: 256,
      width: 512,
    });
    expect(getAvatarScaledSize(1000, 3000)).toEqual({
      height: 512,
      width: 171,
    });
  });

  it("小图保持原尺寸不放大", () => {
    expect(getAvatarScaledSize(300, 200)).toEqual({ height: 200, width: 300 });
  });

  it("极端长宽比时边长至少为 1px", () => {
    expect(getAvatarScaledSize(10000, 1)).toEqual({
      height: 1,
      width: avatarMaxDimension,
    });
  });
});

describe("compressAvatarImage", () => {
  const context = {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "",
    globalCompositeOperation: "source-over",
  };
  const bitmap = { close: vi.fn(), height: 1500, width: 2000 };
  let encodedTypes: Record<string, string | null>;

  beforeEach(() => {
    encodedTypes = { "image/jpeg": "image/jpeg", "image/webp": "image/webp" };
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => bitmap),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as never,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (callback, type) {
        const encodedType = encodedTypes[type ?? ""];
        callback(encodedType ? new Blob(["x"], { type: encodedType }) : null);
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("缩放到最长边 512px 并输出 WebP", async () => {
    const result = await compressAvatarImage(new Blob(["png"]));

    expect(result.type).toBe("image/webp");
    expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 512, 384);
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/webp",
      0.85,
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it("浏览器不支持 WebP 编码时铺白底后改用 JPEG", async () => {
    encodedTypes["image/webp"] = "image/png";

    const result = await compressAvatarImage(new Blob(["png"]));

    expect(result.type).toBe("image/jpeg");
    expect(context.globalCompositeOperation).toBe("destination-over");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 512, 384);
  });

  it("无法编码时抛出异常并释放图片", async () => {
    encodedTypes = {};

    await expect(compressAvatarImage(new Blob(["png"]))).rejects.toThrow();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it("图片无法解码时抛出异常", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode failed");
      }),
    );

    await expect(compressAvatarImage(new Blob(["bad"]))).rejects.toThrow(
      "decode failed",
    );
  });
});
