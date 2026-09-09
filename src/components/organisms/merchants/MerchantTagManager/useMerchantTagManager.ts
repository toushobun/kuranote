"use client";

import { useState, useTransition } from "react";

import { merchantText } from "config/merchantText";
import type {
  MerchantTag,
  MerchantTagActionState,
  MerchantTagReorderAction,
} from "types/merchants";

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
  const [isPending, startTransition] = useTransition();

  function submitOrder(ids: string[]) {
    if (isPending) return;
    const tagById = new Map(orderedTags.map((tag) => [tag.id, tag]));
    const nextTags = ids.flatMap((id) => {
      const tag = tagById.get(id);
      return tag ? [tag] : [];
    });
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
          error: merchantText.categoryReorderFallback,
          errorKey: crypto.randomUUID(),
        });
      }
    });
  }

  return { isPending, orderedTags, submitOrder };
}
