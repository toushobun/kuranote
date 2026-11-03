import {
  UnsavedChangesHistory,
  type GuardHistoryPort,
} from "molecules/ui/UnsavedChangesDialog/unsavedChangesHistory";

type Entry = {
  dirty: boolean;
  href: string;
  handlesLinks: boolean;
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
  const isCurrent = (entry: Entry) =>
    entry.active && entry.href === connectedHref;
  const ordered = () =>
    [...entries]
      .filter(isCurrent)
      .sort((a, b) => (a.layer ?? -1) - (b.layer ?? -1) || a.order - b.order);
  const top = () =>
    ordered()
      .filter((entry) => entry.dirty || entry.layer !== null)
      .at(-1);
  const protecting = () =>
    [...entries].some(
      (entry) =>
        isCurrent(entry) &&
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
    createGuard(handlesLinks = true) {
      const entry: Entry = {
        dirty: false,
        href: "",
        handlesLinks,
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
          entry.href = port.href();
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
        isLinkOwner: () => {
          const guards = ordered().filter(
            (item) => item.handlesLinks && !item.suspended,
          );
          return (
            (guards.filter((item) => item.dirty).at(-1) ?? guards.at(-1)) ===
            entry
          );
        },
        shouldBlockUnload: () =>
          isCurrent(entry) &&
          entry.dirty &&
          !entry.suspended &&
          history.shouldBlockUnload(),
        needsCleanup: () => history.needsCleanup(),
        navigate(action: () => void) {
          if (!isCurrent(entry)) {
            action();
            return Promise.resolve();
          }
          // 路由变化必须等待内部哨兵清理，不能与 router.replace 并发。
          return history.leave(action);
        },
        async leave(action: () => void) {
          if (entry.layer === null) return history.leave(action);
          // UI 关闭与后退关闭都只停用本层；setDirty(false) 的内部遍历不会派发下一次后退。
          if (!entry.active) return;
          entry.active = false;
          await sync();
          action();
        },
        async runInPlaceAction<T>(action: () => Promise<T>): Promise<T> {
          // 同页保存只提交一个区域，其他草稿始终受保护；同步补回 Next revalidate 丢掉的标记。
          try {
            return await action();
          } finally {
            await sync();
          }
        },
        async runAction<T>(action: () => Promise<T>): Promise<T> {
          if (!isCurrent(entry)) return action();
          entry.suspended = true;
          let redirecting = false;
          try {
            // 子层保存不能清理父表单的保护；只有本实例独占保护时才清理历史。
            if (protecting()) return await action();
            return await history.runAction(action);
          } catch (error) {
            // Next 的成功重定向尚未完成时，不能重新压入被清理的哨兵。
            redirecting =
              typeof error === "object" &&
              error !== null &&
              "digest" in error &&
              typeof error.digest === "string" &&
              error.digest.startsWith("NEXT_REDIRECT;");
            throw error;
          } finally {
            if (!redirecting) {
              entry.suspended = false;
              await sync();
            }
          }
        },
      };
    },
  };
}
