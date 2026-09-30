"use client";

import {
  useActionState,
  useCallback,
  useState,
  useTransition,
  type ChangeEvent,
  type RefObject,
} from "react";

import { userErrorMessages } from "internal/user";
import type { AvatarAction, AvatarActionState } from "types/user";
import { compressAvatarImage } from "utils/avatarImage";

type Feedback = { kind: "failure" | "success"; message: string };

const initialState: AvatarActionState = {};

/**
 * 更换头像流程：选择图片 → 浏览器压缩为 512px WebP → 提交 Server Action。
 * 压缩与上传期间视为处理中，禁止重复选择。
 */
export function useProfileAvatarUploader(
  action: AvatarAction,
  inputRef: RefObject<HTMLInputElement | null>,
) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [, startTransition] = useTransition();

  const trackedAction = useCallback<AvatarAction>(
    async (previousState, formData) => {
      const nextState = await action(previousState, formData);

      if (nextState.error) {
        setFeedback({ kind: "failure", message: nextState.error });
      } else if (nextState.success) {
        setFeedback({ kind: "success", message: nextState.success });
      }

      return nextState;
    },
    [action],
  );
  const [, formAction, isUploading] = useActionState(
    trackedAction,
    initialState,
  );
  const pending = isCompressing || isUploading;

  function openFilePicker() {
    if (pending) return;
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 清空选择，便于再次选择同一张图片。
    event.target.value = "";
    if (!file || pending) return;

    setIsCompressing(true);
    let compressed: Blob;
    try {
      compressed = await compressAvatarImage(file);
    } catch {
      setFeedback({
        kind: "failure",
        message: userErrorMessages.avatarImageUnreadable,
      });
      return;
    } finally {
      setIsCompressing(false);
    }

    const formData = new FormData();
    formData.set("avatar", compressed);
    startTransition(() => formAction(formData));
  }

  return {
    closeFeedback: () => setFeedback(null),
    feedback,
    handleFileChange,
    openFilePicker,
    pending,
  };
}
