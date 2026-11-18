import { beforeEach, describe, expect, it, vi } from "vitest";
import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import { uploadReceiptPhoto } from "./transactionPhotoUpload";

const mocks = vi.hoisted(() => ({
  compressImage: vi.fn(),
  requestReceiptPhotoUpload: vi.fn(),
  confirmReceiptPhotoUpload: vi.fn(),
  discardReceiptPhoto: vi.fn(),
  uploadToSignedUrl: vi.fn(),
}));

vi.mock("utils/imageCompression", () => ({
  compressImage: mocks.compressImage,
}));
vi.mock("internal/transaction/adapter/next/attachmentActions", () => ({
  requestReceiptPhotoUpload: mocks.requestReceiptPhotoUpload,
  confirmReceiptPhotoUpload: mocks.confirmReceiptPhotoUpload,
  discardReceiptPhoto: mocks.discardReceiptPhoto,
}));
vi.mock("lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ uploadToSignedUrl: mocks.uploadToSignedUrl }),
    },
  }),
}));

const file = () => new File(["image"], "receipt.heic", { type: "image/heic" });
const full = {
  blob: new Blob(["full"], { type: "image/jpeg" }),
  width: 1200,
  height: 800,
};
const thumb = {
  blob: new Blob(["thumbnail"], { type: "image/jpeg" }),
  width: 320,
  height: 213,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requestReceiptPhotoUpload.mockResolvedValue({
    attachmentId: "attachment-1",
    full: { path: "ledger/attachment-1.jpg", token: "full-token" },
    thumbnail: {
      path: "ledger/attachment-1_thumb.jpg",
      token: "thumb-token",
    },
  });
  mocks.confirmReceiptPhotoUpload.mockResolvedValue(undefined);
  mocks.discardReceiptPhoto.mockResolvedValue(undefined);
  mocks.uploadToSignedUrl.mockResolvedValue({ error: null });
});

describe("uploadReceiptPhoto", () => {
  it("浏览器无法解码 HEIC 时显示友好提示，且不申请上传", async () => {
    mocks.compressImage.mockRejectedValueOnce(
      new DOMException("The source image could not be decoded", "InvalidStateError"),
    );

    await expect(uploadReceiptPhoto(file())).rejects.toThrow(m.imageDecodeFailed);
    expect(mocks.requestReceiptPhotoUpload).not.toHaveBeenCalled();
    expect(mocks.uploadToSignedUrl).not.toHaveBeenCalled();
  });

  it("缩略图解码或编码失败时也显示友好提示", async () => {
    mocks.compressImage
      .mockResolvedValueOnce(full)
      .mockRejectedValueOnce(new Error("image encoding failed"));

    await expect(uploadReceiptPhoto(file())).rejects.toThrow(m.imageDecodeFailed);
    expect(mocks.requestReceiptPhotoUpload).not.toHaveBeenCalled();
  });

  it("正常压缩的大图和缩略图保持原有签名上传、确认流程", async () => {
    mocks.compressImage.mockResolvedValueOnce(full).mockResolvedValueOnce(thumb);

    await expect(uploadReceiptPhoto(file())).resolves.toEqual({
      attachmentId: "attachment-1",
      width: 1200,
      height: 800,
    });
    expect(mocks.compressImage).toHaveBeenNthCalledWith(1, expect.any(File), {
      maxDimension: 1600,
      mimeType: "image/jpeg",
      quality: 0.75,
    });
    expect(mocks.compressImage).toHaveBeenNthCalledWith(2, expect.any(File), {
      maxDimension: 320,
      mimeType: "image/jpeg",
      quality: 0.7,
    });
    expect(mocks.requestReceiptPhotoUpload).toHaveBeenCalledWith({
      byteSize: full.blob.size,
      height: 800,
      width: 1200,
    });
    expect(mocks.uploadToSignedUrl).toHaveBeenCalledTimes(2);
    expect(mocks.confirmReceiptPhotoUpload).toHaveBeenCalledWith("attachment-1");
    expect(mocks.discardReceiptPhoto).not.toHaveBeenCalled();
  });
});
