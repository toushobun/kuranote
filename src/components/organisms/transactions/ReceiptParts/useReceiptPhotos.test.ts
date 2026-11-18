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

  it("保存认领期间卸载页面不会抢先删除已上传照片", async () => {
    mocks.uploadReceiptPhoto.mockResolvedValue({
      attachmentId: "photo-saving",
      width: 100,
      height: 100,
    });
    const { result, unmount } = renderHook(() => useReceiptPhotos());
    act(() => result.current.addFiles([file()]));
    await waitFor(() =>
      expect(result.current.photos[0]?.status).toBe("uploaded"),
    );

    const data = new FormData();
    expect(await result.current.prepareForSave(data)).toBe(true);
    expect(data.getAll("attachmentIds")).toEqual(["photo-saving"]);
    unmount();
    await Promise.resolve();
    expect(mocks.discardReceiptPhoto).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("上传未结束就开始保存，页面卸载后仍允许交给服务端认领", async () => {
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
    const { result, unmount } = renderHook(() => useReceiptPhotos());
    act(() => result.current.addFiles([file()]));
    const data = new FormData();
    const saving = result.current.prepareForSave(data);
    unmount();

    await act(async () => {
      resolveUpload?.({ attachmentId: "photo-pending", width: 100, height: 100 });
      expect(await saving).toBe(true);
    });
    expect(data.getAll("attachmentIds")).toEqual(["photo-pending"]);
    expect(mocks.discardReceiptPhoto).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("未开始保存时卸载仍会尽力删除草稿照片", async () => {
    mocks.uploadReceiptPhoto.mockResolvedValue({
      attachmentId: "photo-abandoned",
      width: 100,
      height: 100,
    });
    const { result, unmount } = renderHook(() => useReceiptPhotos());
    act(() => result.current.addFiles([file()]));
    await waitFor(() =>
      expect(result.current.photos[0]?.status).toBe("uploaded"),
    );
    unmount();
    await waitFor(() =>
      expect(mocks.discardReceiptPhoto).toHaveBeenCalledWith("photo-abandoned"),
    );
  });

  it("旧记录照片仍在读取时不能保存，避免意外清空已有照片", async () => {
    let resolveLoad:
      | ((
          photos: { id: string; fullUrl: string; thumbnailUrl: string }[],
        ) => void)
      | undefined;
    mocks.loadReceiptPhotos.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useReceiptPhotos({ recordId: "record-1" }),
    );
    const data = new FormData();
    expect(await result.current.prepareForSave(data)).toBe(false);
    expect(data.has("attachmentIdsPresent")).toBe(false);
    await act(async () => {
      resolveLoad?.([
        { id: "saved-1", fullUrl: "/full.jpg", thumbnailUrl: "/thumb.jpg" },
      ]);
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(await result.current.prepareForSave(data)).toBe(true);
    expect(data.getAll("attachmentIds")).toEqual(["saved-1"]);
  });

  it("旧照片读取失败时禁止提交空关联，防止误删", async () => {
    mocks.loadReceiptPhotos.mockRejectedValue(new Error("network unavailable"));
    const { result } = renderHook(() =>
      useReceiptPhotos({ recordId: "record-1" }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const data = new FormData();
    expect(await result.current.prepareForSave(data)).toBe(false);
    expect(data.has("attachmentIdsPresent")).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("旧照片读取期间禁止添加，避免新旧照片合计超过五张", async () => {
    let resolveLoad:
      | ((
          photos: { id: string; fullUrl: string; thumbnailUrl: string }[],
        ) => void)
      | undefined;
    mocks.loadReceiptPhotos.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const { result } = renderHook(() =>
      useReceiptPhotos({ recordId: "record-1" }),
    );
    act(() => result.current.addFiles([file()]));
    expect(result.current.photos).toHaveLength(0);
    expect(mocks.uploadReceiptPhoto).not.toHaveBeenCalled();

    await act(async () => {
      resolveLoad?.(
        Array.from({ length: 5 }, (_, index) => ({
          id: `saved-${index}`,
          fullUrl: "/full.jpg",
          thumbnailUrl: "/thumb.jpg",
        })),
      );
    });
    await waitFor(() => expect(result.current.photos).toHaveLength(5));
    act(() => result.current.addFiles([file()]));
    expect(result.current.photos).toHaveLength(5);
    expect(mocks.uploadReceiptPhoto).not.toHaveBeenCalled();
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
