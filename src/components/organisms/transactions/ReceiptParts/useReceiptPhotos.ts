"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transactionAttachmentLimits } from "config/transactionAttachmentLimits";
import { transactionAttachmentMessages as m } from "config/transactionAttachmentMessages";
import {
  discardReceiptPhoto,
  loadReceiptPhotos,
} from "utils/transactionAttachmentClient";
import { uploadReceiptPhoto } from "utils/transactionPhotoUpload";

export type ReceiptPhotoEntry = {
  key: string;
  attachmentId?: string;
  previewUrl: string;
  fullUrl: string;
  status: "uploaded" | "uploading" | "failed";
  source: "saved" | "draft";
  file?: File;
};

export type ReceiptPhotoController = {
  photos: ReceiptPhotoEntry[];
  error: string | null;
  loading: boolean;
  loadFailed: boolean;
  touched: boolean;
  savingPhotos: boolean;
  addFiles: (files: FileList | File[]) => void;
  remove: (key: string) => void;
  retry: (key: string) => void;
  prepareForSave: (data: FormData) => Promise<boolean>;
};

/** 只控制照片状态、重试、清理与待保存 ID；不依赖任何小票 UI。 */
export function useReceiptPhotos({
  ledgerId,
  recordId,
  readOnly = false,
}: {
  ledgerId: string;
  recordId?: string;
  readOnly?: boolean;
}): ReceiptPhotoController {
  const [photos, setPhotos] = useState<ReceiptPhotoEntry[]>([]);
  const photosRef = useRef<ReceiptPhotoEntry[]>([]);
  const pendingRef = useRef(new Map<string, Promise<void>>());
  const removedRef = useRef(new Set<string>());
  const draftIdsRef = useRef(new Set<string>());
  const saveInFlightRef = useRef(false);
  const keyCounter = useRef(0);
  const [loading, setLoading] = useState(Boolean(recordId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const updatePhotos = useCallback(
    (update: (prev: ReceiptPhotoEntry[]) => ReceiptPhotoEntry[]) => {
      const next = update(photosRef.current);
      photosRef.current = next;
      setPhotos(next);
    },
    [],
  );

  useEffect(() => {
    let mounted = true;
    if (recordId) {
      void loadReceiptPhotos(ledgerId, recordId)
        .then((result) => {
          if (!mounted) return;
          // 异步读取时用户可能已开始上传，不要覆盖新选照片。
          updatePhotos((entries) => [
            ...result.map((photo) => ({
              key: photo.id,
              attachmentId: photo.id,
              previewUrl: photo.thumbnailUrl,
              fullUrl: photo.fullUrl,
              status: "uploaded" as const,
              source: "saved" as const,
            })),
            ...entries,
          ]);
        })
        .catch((caught: unknown) => {
          if (mounted) {
            setLoadError(
              caught instanceof Error ? caught.message : m.loadFailed,
            );
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [ledgerId, recordId, updatePhotos]);

  useEffect(() => {
    const drafts = draftIdsRef.current;
    const pending = pendingRef.current;
    return () => {
      // 保存开始后不能与服务端认领竞争删除；遗留草稿由定时任务兜底。
      // 即使跳过删除，也必须释放图片预览所占的浏览器 Object URL。
      if (!saveInFlightRef.current) {
        const cleanup = async () => {
          await Promise.allSettled([...pending.values()]);
          await Promise.allSettled(
            [...drafts].map((attachmentId) =>
              discardReceiptPhoto(ledgerId, attachmentId),
            ),
          );
        };
        void cleanup();
      }
      for (const photo of photosRef.current) {
        if (photo.file && photo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      }
    };
  }, [ledgerId]);

  const upload = useCallback(
    (key: string, file: File) => {
      updatePhotos((list) =>
        list.map((photo) =>
          photo.key === key
            ? { ...photo, status: "uploading" as const }
            : photo,
        ),
      );
      const task = uploadReceiptPhoto(file, ledgerId)
        .then((uploaded) => {
          draftIdsRef.current.add(uploaded.attachmentId);
          if (removedRef.current.has(key)) {
            void discardReceiptPhoto(ledgerId, uploaded.attachmentId).catch(
              () => {},
            );
            draftIdsRef.current.delete(uploaded.attachmentId);
            return;
          }
          updatePhotos((list) =>
            list.map((photo) =>
              photo.key === key
                ? {
                    ...photo,
                    attachmentId: uploaded.attachmentId,
                    status: "uploaded" as const,
                  }
                : photo,
            ),
          );
        })
        .catch((caught: unknown) => {
          if (!removedRef.current.has(key)) {
            setError(caught instanceof Error ? caught.message : m.uploadFailed);
            updatePhotos((list) =>
              list.map((photo) =>
                photo.key === key
                  ? { ...photo, status: "failed" as const }
                  : photo,
              ),
            );
          }
        })
        .finally(() => {
          pendingRef.current.delete(key);
        });
      pendingRef.current.set(key, task);
    },
    [ledgerId, updatePhotos],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      if (readOnly || (recordId && (loading || loadError))) return;
      const available = Math.max(
        0,
        transactionAttachmentLimits.maxCount - photosRef.current.length,
      );
      const selected = Array.from(files);
      if (selected.length > available) setError(m.maxCount);
      else setError(null);
      for (const file of selected.slice(0, available)) {
        const key = `receipt-photo-${++keyCounter.current}`;
        const previewUrl = URL.createObjectURL(file);
        updatePhotos((list) => [
          ...list,
          {
            key,
            previewUrl,
            fullUrl: previewUrl,
            file,
            status: "uploading",
            source: "draft",
          },
        ]);
        upload(key, file);
      }
      if (selected.length && available > 0) setTouched(true);
    },
    [loadError, loading, readOnly, recordId, updatePhotos, upload],
  );

  const remove = useCallback(
    (key: string) => {
      if (readOnly) return;
      const photo = photosRef.current.find((item) => item.key === key);
      if (!photo) return;
      removedRef.current.add(key);
      updatePhotos((list) => list.filter((item) => item.key !== key));
      setTouched(true);
      setError(null);
      if (photo.file && photo.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      if (photo.source === "draft" && photo.attachmentId) {
        draftIdsRef.current.delete(photo.attachmentId);
        void discardReceiptPhoto(ledgerId, photo.attachmentId).catch(() => {});
      }
    },
    [ledgerId, readOnly, updatePhotos],
  );

  const retry = useCallback(
    (key: string) => {
      if (readOnly) return;
      const photo = photosRef.current.find((item) => item.key === key);
      if (!photo?.file || photo.status !== "failed") return;
      setError(null);
      setTouched(true);
      upload(key, photo.file);
    },
    [readOnly, upload],
  );

  const prepareForSave = useCallback(
    async (data: FormData) => {
      if (recordId && (loading || loadError)) {
        return false;
      }
      // 从开始等待上传到服务端认领期间，禁止卸载清理抢先删除照片。
      saveInFlightRef.current = true;
      setSavingPhotos(true);
      try {
        await Promise.allSettled([...pendingRef.current.values()]);
        const next = photosRef.current;
        if (
          next.some(
            (photo) => photo.status !== "uploaded" || !photo.attachmentId,
          )
        ) {
          saveInFlightRef.current = false;
          setError(m.photoUploadBlock);
          return false;
        }
        // React 在点击保存时已经序列化 FormData，上传完成后需覆盖最新 ID。
        data.delete("attachmentIds");
        data.set("attachmentIdsPresent", "true");
        for (const photo of next)
          data.append("attachmentIds", photo.attachmentId!);
        return true;
      } finally {
        setSavingPhotos(false);
      }
    },
    [loadError, loading, recordId],
  );

  return {
    photos,
    error: loadError ?? error,
    loading,
    loadFailed: Boolean(loadError),
    touched,
    savingPhotos,
    addFiles,
    remove,
    retry,
    prepareForSave,
  };
}
