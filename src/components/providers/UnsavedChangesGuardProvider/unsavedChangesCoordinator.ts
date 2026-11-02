import {
  UnsavedChangesHistory,
  type GuardHistoryPort,
} from "molecules/ui/UnsavedChangesDialog/unsavedChangesHistory";

type Entry = {
  dirty: boolean;
  layer: number | null;
  active: boolean;
  suspended: boolean;
  order: number;
  connection: number;
  onBack: () => void;
};

/** 一棵 React 树只持有一组历史记录，表单动作始终绑定自己的登记项。 */
export function createUnsavedChangesCoordinator(
  port: GuardHistoryPort,
  id: string,
) {
  const entries = new Set<Entry>();
  let order = 0;
  let connectedHref = "";
  const top = () =>
    [...entries]
      .filter((entry) => entry.active && (entry.dirty || entry.layer !== null))
      .sort((a, b) => (a.layer ?? -1) - (b.layer ?? -1) || a.order - b.order)
      .at(-1);
  const protecting = () =>
    [...entries].some(
      (entry) =>
        entry.active &&
        !entry.suspended &&
        (entry.dirty || entry.layer !== null),
    );
  const history = new UnsavedChangesHistory(
    port,
    () => {
      const target = top();
      if (target && !target.suspended) target.onBack();
    },
    id,
  );
  const sync = () => history.setDirty(protecting());
  return {
    handlePopState(event: PopStateEvent) {
      if (history.handlePopState()) event.stopImmediatePropagation();
    },
    createGuard() {
      const entry: Entry = {
        dirty: false,
        layer: null,
        active: false,
        suspended: false,
        order: 0,
        connection: 0,
        onBack: () => {},
      };
      return {
        register(onBack: () => void) {
          if (!entries.size || connectedHref !== port.href()) {
            history.connect();
            connectedHref = port.href();
          }
          entries.add(entry);
          entry.onBack = onBack;
          const connection = ++entry.connection;
          return () =>
            queueMicrotask(() => {
              if (entry.connection !== connection) return;
              entries.delete(entry);
              void sync();
            });
        },
        update(dirty: boolean, layer: number | null, active: boolean) {
          if (active && !entry.active) entry.order = ++order;
          Object.assign(entry, { dirty, layer, active });
          return sync();
        },
        isTop: () => top() === entry || (!top() && entry.active),
        shouldBlockUnload: () =>
          entry.active &&
          entry.dirty &&
          !entry.suspended &&
          history.shouldBlockUnload(),
        needsCleanup: () => history.needsCleanup(),
        async leave(action: () => void) {
          if (entry.layer === null) return history.leave(action);
          // UI 关闭与后退关闭都只停用本层；setDirty(false) 的内部遍历不会派发下一次后退。
          if (!entry.active) return;
          entry.active = false;
          await sync();
          action();
        },
        async runAction<T>(action: () => Promise<T>): Promise<T> {
          if (!entry.active) return action();
          entry.suspended = true;
          try {
            // 子层保存不能清理父表单的保护；只有本实例独占保护时才清理历史。
            if (protecting()) return await action();
            return await history.runAction(action);
          } finally {
            entry.suspended = false;
            await sync();
          }
        },
      };
    },
  };
}
