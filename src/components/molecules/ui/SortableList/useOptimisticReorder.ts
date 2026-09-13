"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { BaseActionState } from "types/auth";

type ReorderState = BaseActionState & { errorKey?: string };

export function orderItemsByIds<T extends { id: string }>(
  items: T[],
  ids: string[],
) {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort(
    (a, b) =>
      (positions.get(a.id) ?? ids.length) - (positions.get(b.id) ?? ids.length),
  );
}

export function useOptimisticReorder<T>({
  items,
  action,
  onError,
  fallbackMessage,
}: {
  items: T;
  action: (formData: FormData) => Promise<ReorderState>;
  onError: (state: ReorderState) => void;
  fallbackMessage: string;
}) {
  const [order, setOrder] = useState<{
    source: T;
    apply: (items: T) => T;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestItems = useRef(items);
  const submitting = useRef(false);
  useEffect(() => {
    latestItems.current = items;
  }, [items]);
  const orderedItems =
    order && (isPending || order.source === items) ? order.apply(items) : items;

  function submitOrder(formData: FormData, apply: (items: T) => T) {
    if (submitting.current) return;
    submitting.current = true;
    const previous = order;
    const source = items;
    const applyOrder =
      previous?.source === source
        ? (items: T) => apply(previous.apply(items))
        : apply;
    setOrder({ source, apply: applyOrder });
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.error) {
          setOrder(latestItems.current === source ? previous : null);
          onError(result);
        } else {
          setOrder({ source: latestItems.current, apply: applyOrder });
        }
      } catch {
        setOrder(latestItems.current === source ? previous : null);
        onError({ error: fallbackMessage, errorKey: crypto.randomUUID() });
      } finally {
        submitting.current = false;
      }
    });
  }

  return { orderedItems, isPending, submitOrder };
}
