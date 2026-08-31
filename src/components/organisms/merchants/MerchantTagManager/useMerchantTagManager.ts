"use client";

import type { DragEvent } from "react";
import { useRef, useState, useTransition } from "react";

import type {
  MerchantTag,
  MerchantTagActionState,
  MerchantTagReorderAction,
} from "types/merchants";

export type MerchantTagMoveDirection = -1 | 1;

type UseMerchantTagManagerParams = {
  onReorderError: (state: MerchantTagActionState) => void;
  reorderAction: MerchantTagReorderAction;
  tags: MerchantTag[];
};

export function useMerchantTagManager({
  onReorderError,
  reorderAction,
  tags,
}: UseMerchantTagManagerParams) {
  const [optimistic, setOptimistic] = useState<{
    source: MerchantTag[];
    tags: MerchantTag[];
  } | null>(null);
  const orderedTags = optimistic?.source === tags ? optimistic.tags : tags;
  const draggedIdRef = useRef<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitOrder(nextTags: MerchantTag[]) {
    const previous = orderedTags;
    const formData = new FormData();
    formData.set("tagIds", JSON.stringify(nextTags.map((tag) => tag.id)));
    setOptimistic({ source: tags, tags: nextTags });
    startTransition(async () => {
      try {
        const result = await reorderAction(formData);
        if (result.error) {
          setOptimistic({ source: tags, tags: previous });
          onReorderError(result);
        }
      } catch {
        setOptimistic({ source: tags, tags: previous });
        onReorderError({
          error: "标签排序保存失败，请稍后重试。",
          errorKey: crypto.randomUUID(),
        });
      }
    });
  }

  function moveTag(tagId: string, direction: MerchantTagMoveDirection) {
    if (isPending) return;
    const currentIndex = orderedTags.findIndex((tag) => tag.id === tagId);
    const targetIndex = currentIndex + direction;
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= orderedTags.length
    )
      return;
    const next = [...orderedTags];
    const [tag] = next.splice(currentIndex, 1);
    if (!tag) return;
    next.splice(targetIndex, 0, tag);
    submitOrder(next);
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, tagId: string) {
    if (isPending) {
      event.preventDefault();
      return;
    }
    draggedIdRef.current = tagId;
    setDraggedId(tagId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", tagId);
  }

  function dropOn(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const sourceId = draggedIdRef.current;
    if (!sourceId || sourceId === targetId) return finishDrag();
    const next = [...orderedTags];
    const sourceIndex = next.findIndex((tag) => tag.id === sourceId);
    const targetIndex = next.findIndex((tag) => tag.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return finishDrag();
    const [tag] = next.splice(sourceIndex, 1);
    if (!tag) return finishDrag();
    next.splice(targetIndex, 0, tag);
    submitOrder(next);
    finishDrag();
  }

  function finishDrag() {
    draggedIdRef.current = null;
    setDraggedId(null);
  }

  return {
    draggedId,
    dropOn,
    finishDrag,
    isPending,
    moveTag,
    orderedTags,
    startDrag,
  };
}
