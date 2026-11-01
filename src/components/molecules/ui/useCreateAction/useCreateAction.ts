"use client";
import { useActionState } from "react";
import type { ActionState } from "types/actions";

/** 页面与弹层共用提交；只有弹层消费新增结果，成功导航仍交给 Action。 */
export function useCreateAction<State extends ActionState, Entity>(
  action: (state: Awaited<State>, data: FormData) => Promise<State>,
  initial: Awaited<State>,
  getCreated: (state: State) => Entity | undefined,
  onCreated?: (entity: Entity) => void,
) {
  return useActionState<State, FormData>((previous, data) => {
    if (onCreated) data.set("presentation", "dialog");
    return action(previous, data).then((state) => {
      const entity = getCreated(state);
      if (entity) onCreated?.(entity);
      return state;
    });
  }, initial);
}
