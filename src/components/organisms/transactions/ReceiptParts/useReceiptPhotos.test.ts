import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReceiptPhotos } from "./useReceiptPhotos";

const mocks = vi.hoisted(() => ({
  loadReceiptPhotos: vi.fn(),
  uploadReceiptPhoto: vi.fn(),
  discardReceiptPhoto: vi.fn(),
}));
vi.mock("internal/transaction/adapter/next/attachmentActions", () => ({
  loadReceiptPhotos: mocks.loadReceiptPhotos,
  discardReceiptPhoto: mocks.discardReceiptPhoto,
}));
vi.mock("utils/transactionPhotoUpload", () => ({
  uploadReceiptPhoto: mocks.uploadReceiptPhoto,
}));

beforeEach(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  });
  mocks.discardReceiptPhoto.mockResolvedValue(undefined);
  mocks.loadReceiptPhotos.mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function file(name = "receipt.jpg") {
  return new File(["picture"], name, { type: "image/jpeg" });
}

describe("useReceiptPhotos", () => {
  it("选六张只取前五张并显示上限提示", async () => {
    mocks.uploadReceiptPhoto.mockResolvedValue({
      attachmentId: "photo",
      width: 100,
      height: 100,
    });
    const { result } = renderHook(() => useReceiptPhotos());
    act(() =>
      result.current.addFiles(
        Array.from({ length: 6 }, (_, i) => file(`${i}.jpg`)),
      ),
    );
    expect(result.current.photos).toHaveLength(5);
    expect(result.current.error).toBe("最多 5 张照片");
    expect(result.current.touched).toBe(true);
  });

  it("上传未完成时保存必须等待，再提交最终 ID", async () => {
    let resolveUpload:
      | ((value: {
          attachmentId: string;
          width: number;
          height: number;
        }) => void)
      | undefined;
    mocks.uploadReceiptPhoto.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const { result } = renderHook(() => useReceiptPhotos());
    act(() => result.current.addFiles([file()]));
    const form = new FormData();
    let saved: boolean | undefined;
    await act(async () => {
      const pending = result.current.prepareForSave(form).then((value) => {
        saved = value;
      });
      await Promise.resolve();
      expect(saved).toBeUndefined();
      resolveUpload?.({ attachmentId: "photo-1", width: 100, height: 100 });
      await pending;
    });
    expect(saved).toBe(true);
    expect(form.getAll("attachmentIds")).toEqual(["photo-1"]);
    expect(form.get("attachmentIdsPresent")).toBe("true");
  });

  it("上传失败不能保存，重新上传成功后允许保存", async () => {
    mocks.uploadReceiptPhoto.mockRejectedValueOnce(new Error("上传失败"));
    mocks.uploadReceiptPhoto.mockResolvedValueOnce({
      attachmentId: "photo-1",
      width: 100,
      height: 100,
    });
    const { result } = renderHook(() => useReceiptPhotos());
    act(() => result.current.addFiles([file()]));
    await waitFor(() =>
      expect(result.current.photos[0]?.status).toBe("failed"),
    );
    expect(await result.current.prepareForSave(new FormData())).toBe(false);
    act(() => result.current.retry(result.current.photos[0]!.key));
    await waitFor(() =>
      expect(result.current.photos[0]?.status).toBe("uploaded"),
    );
    expect(await result.current.prepareForSave(new FormData())).toBe(true);
  });

  it("移除草稿触发未保存标志与尽力删除", async () => {
    mocks.uploadReceiptPhoto.mockResolvedValue({
      attachmentId: "photo-1",
      width: 100,
      height: 100,
    });
    const { result } = renderHook(() => useReceiptPhotos());
    act(() => result.current.addFiles([file()]));
    await waitFor(() =>
      expect(result.current.photos[0]?.status).toBe("uploaded"),
    );
    const key = result.current.photos[0]!.key;
    act(() => result.current.remove(key));
    expect(result.current.photos).toHaveLength(0);
    expect(result.current.touched).toBe(true);
    await waitFor(() =>
      expect(mocks.discardReceiptPhoto).toHaveBeenCalledWith("photo-1"),
    );
  });

  it("编辑记录读取原照片并在提交时保留全部未移除 ID", async () => {
    mocks.loadReceiptPhotos.mockResolvedValue([
      { id: "saved-1", fullUrl: "/full.jpg", thumbnailUrl: "/thumb.jpg" },
    ]);
    const { result } = renderHook(() =>
      useReceiptPhotos({ recordId: "record-1" }),
    );
    await waitFor(() => expect(result.current.photos).toHaveLength(1));
    const data = new FormData();
    expect(await result.current.prepareForSave(data)).toBe(true);
    expect(data.getAll("attachmentIds")).toEqual(["saved-1"]);
  });
});
