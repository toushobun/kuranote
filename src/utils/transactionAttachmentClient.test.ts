import { afterEach, describe, expect, it, vi } from "vitest";

import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";

import {
  confirmReceiptPhotoUpload,
  discardReceiptPhoto,
  loadReceiptPhotos,
  requestReceiptPhotoUpload,
} from "./transactionAttachmentClient";

const ledgerId = "00000000-0000-4000-8000-000000009001";
const attachmentId = "00000000-0000-4000-8000-000000009002";
const recordId = "00000000-0000-4000-8000-000000009003";
const attachment = {
  id: attachmentId,
  fullUrl: "https://example.test/full.jpg",
  thumbnailUrl: "https://example.test/thumb.jpg",
};
const uploadInput = { ledgerId, byteSize: 512, width: 100, height: 100 };
const signedToken = {
  path: "receipt.jpg",
  signedUrl: attachment.fullUrl,
  token: "signed-token",
};

afterEach(() => vi.unstubAllGlobals());

function stubFetch(...responses: Response[]) {
  const fetch = vi.fn<typeof globalThis.fetch>();
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("小票照片 API 客户端", () => {
  it("申请、确认和撤销上传使用同一个账本与附件", async () => {
    const signed = {
      attachmentId,
      full: signedToken,
      thumbnail: signedToken,
    };
    const fetch = stubFetch(
      Response.json(signed, { status: 201 }),
      Response.json({ ok: true }),
      Response.json({ ok: true }),
    );

    await expect(requestReceiptPhotoUpload(uploadInput)).resolves.toEqual(
      signed,
    );
    await confirmReceiptPhotoUpload(ledgerId, attachmentId);
    await discardReceiptPhoto(ledgerId, attachmentId);

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/transactions/attachments/upload-requests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(uploadInput),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `/api/transactions/attachments/${attachmentId}/confirm`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ledgerId }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      `/api/transactions/attachments/${attachmentId}?ledgerId=${ledgerId}`,
      { method: "DELETE" },
    );
  });

  it("按当前账本和记录读取预览签名 URL", async () => {
    const fetch = stubFetch(Response.json({ attachments: [attachment] }));
    await expect(loadReceiptPhotos(ledgerId, recordId)).resolves.toEqual([
      attachment,
    ]);
    expect(fetch).toHaveBeenCalledWith(
      `/api/transactions/${recordId}/attachments?ledgerId=${ledgerId}`,
      expect.objectContaining({ headers: { accept: "application/json" } }),
    );
  });

  it.each([
    () => requestReceiptPhotoUpload(uploadInput),
    () => loadReceiptPhotos(ledgerId, recordId),
    () => confirmReceiptPhotoUpload(ledgerId, attachmentId),
    () => discardReceiptPhoto(ledgerId, attachmentId),
  ])("使用服务端返回的安全中文错误", async (request) => {
    stubFetch(
      Response.json({ error: { message: m.noPermission } }, { status: 403 }),
    );
    await expect(request()).rejects.toThrow(m.noPermission);
  });

  it("网络请求失败时显示对应的中文提示", async () => {
    const fetch = stubFetch();
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(requestReceiptPhotoUpload(uploadInput)).rejects.toThrow(
      m.uploadFailed,
    );
    await expect(loadReceiptPhotos(ledgerId, recordId)).rejects.toThrow(
      m.loadFailed,
    );
  });

  it("无法解析错误响应或成功数据无效时显示对应的中文提示", async () => {
    stubFetch(
      new Response("<html>", { status: 500 }),
      Response.json({ attachments: null }),
      new Response("<html>"),
    );
    await expect(requestReceiptPhotoUpload(uploadInput)).rejects.toThrow(
      m.uploadFailed,
    );
    await expect(loadReceiptPhotos(ledgerId, recordId)).rejects.toThrow(
      m.loadFailed,
    );
    await expect(loadReceiptPhotos(ledgerId, recordId)).rejects.toThrow(
      m.loadFailed,
    );
  });
});
