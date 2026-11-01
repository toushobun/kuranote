const stateKey = "kuranoteUnsavedChanges";

type Marker = {
  id: string;
  position: "base" | "sentinel";
  scrollRestoration: ScrollRestoration;
};
type HistoryState = Record<string, unknown> & {
  [stateKey]?: Marker;
};

export type GuardHistoryPort = {
  state: () => HistoryState | null;
  href: () => string;
  replace: (state: HistoryState) => void;
  push: (state: HistoryState) => void;
  go: (delta: number) => void;
  scrollPosition: () => { x: number; y: number };
  scrollTo: (position: { x: number; y: number }) => void;
  scrollRestoration: () => ScrollRestoration;
  setScrollRestoration: (mode: ScrollRestoration) => void;
  afterTraversal: (callback: () => void) => void;
};

/** 只遍历同 URL 的内部记录；实际路由离开由调用方在清理完成后执行。 */
export class UnsavedChangesHistory {
  private originalScrollMode: ScrollRestoration | null = null;
  private savedScroll: {
    x: number;
    y: number;
    mode: ScrollRestoration;
  } | null = null;
  private href = "";
  private dirty = false;
  private hasSentinel = false;
  private suspended = false;
  private leaving = false;
  private saving = false;
  private connection = 0;
  private traversal: { position: Marker["position"]; done: () => void } | null =
    null;
  private operation: Promise<void> = Promise.resolve();

  constructor(
    private readonly port: GuardHistoryPort,
    private onBack: () => void,
    private id: string,
  ) {}

  connect(onBack?: () => void) {
    if (onBack) this.onBack = onBack;
    const connection = ++this.connection;
    this.suspended = false;
    this.leaving = false;
    const marker = this.marker();
    this.originalScrollMode = marker?.scrollRestoration ?? null;
    if (marker?.position === "sentinel") {
      this.id = marker.id;
      this.href = this.port.href();
      this.hasSentinel = true;
    } else if (marker?.id !== this.id) {
      // 成功跳转后再次通过 Link 进入的是新记录，旧会话不能再假定前方存在哨兵。
      this.hasSentinel = false;
      this.href = this.port.href();
    }
    return () => this.connection === connection;
  }

  shouldBlockUnload() {
    return this.dirty && !this.leaving;
  }

  needsCleanup() {
    return this.hasSentinel;
  }

  private marker() {
    return this.port.state()?.[stateKey];
  }

  private write(position: Marker["position"], push = false) {
    const state = {
      ...this.port.state(),
      [stateKey]: {
        id: this.id,
        position,
        scrollRestoration:
          this.originalScrollMode ?? this.port.scrollRestoration(),
      },
    };
    if (push) this.port.push(state);
    else this.port.replace(state);
  }

  private enqueue(action: () => void | Promise<void>) {
    const next = this.operation.then(action);
    this.operation = next.catch(() => {});
    return next;
  }

  private move(position: Marker["position"]) {
    if (this.marker()?.position === position) return Promise.resolve();
    this.preserveScroll();
    return new Promise<void>((done) => {
      this.traversal = { position, done };
      this.port.go(position === "base" ? -1 : 1);
    });
  }

  private preserveScroll() {
    this.savedScroll ??= {
      ...this.port.scrollPosition(),
      mode: this.originalScrollMode ?? this.port.scrollRestoration(),
    };
    // 只修改内部记录的恢复模式，真正来源页的浏览器滚动恢复保持原样。
    if (this.port.href() === this.href)
      this.port.setScrollRestoration("manual");
    this.port.scrollTo(this.savedScroll);
  }

  private restoreScroll(done: () => void = () => {}) {
    this.port.afterTraversal(() => {
      if (this.savedScroll) {
        this.port.scrollTo(this.savedScroll);
        if (!this.traversal) {
          const protecting =
            this.dirty &&
            this.hasSentinel &&
            !this.leaving &&
            (!this.suspended || this.saving);
          this.port.setScrollRestoration(
            protecting ? "manual" : this.savedScroll.mode,
          );
          this.savedScroll = null;
        }
      }
      done();
    });
  }

  setDirty(dirty: boolean) {
    this.dirty = dirty;
    return this.enqueue(async () => {
      if (dirty && !this.suspended) await this.arm();
      else if (!dirty) await this.remove();
    });
  }

  private async arm() {
    if (this.href && this.port.href() !== this.href) return;
    this.href = this.port.href();
    this.originalScrollMode ??= this.port.scrollRestoration();
    // 基准和哨兵都必须在遍历之前设为 manual；popstate 才修改目标模式已太晚。
    this.port.setScrollRestoration("manual");
    if (this.hasSentinel) {
      await this.move("sentinel");
      return;
    }
    this.write("base");
    this.write("sentinel", true);
    this.hasSentinel = true;
  }

  private async remove() {
    if (!this.hasSentinel || this.port.href() !== this.href) return;
    await this.move("base");
  }

  handlePopState() {
    const marker = this.marker();
    if (this.saving && this.hasSentinel) {
      this.preserveScroll();
      if (this.port.href() !== this.href) {
        this.port.go(1);
        return true;
      }
      if (marker?.position === "sentinel") {
        this.port.go(-1);
        return true;
      }
    }
    // 连按后退可能在恢复哨兵之前越过基准；先保住当前 React 树，等待已发出的前进。
    if (
      this.hasSentinel &&
      this.dirty &&
      !this.suspended &&
      (marker?.id !== this.id || this.port.href() !== this.href)
    ) {
      this.preserveScroll();
      // 浏览器可能用第二次 back 取消尚未完成的 forward，因此在这里重新发出恢复。
      this.port.go(1);
      return true;
    }
    if (
      marker?.position === "sentinel" &&
      !this.dirty &&
      (!this.href || this.port.href() === this.href)
    ) {
      this.id = marker.id;
      this.href = this.port.href();
      this.hasSentinel = true;
    }
    if (marker?.id !== this.id || this.port.href() !== this.href) return;
    this.preserveScroll();
    if (this.traversal?.position === marker.position) {
      const { done } = this.traversal;
      this.traversal = null;
      this.restoreScroll(done);
      return true;
    }
    if (this.traversal?.position === "sentinel" && marker.position === "base") {
      this.port.go(1);
      return true;
    }
    if (marker.position === "base" && this.dirty && !this.suspended) {
      // 先恢复已有哨兵再弹框，确认动作始终从同一个位置开始，取消不新增记录。
      const restored = this.move("sentinel");
      void this.enqueue(async () => {
        await restored;
        if (this.dirty && !this.suspended) this.onBack();
      });
    } else if (marker.position === "sentinel" && !this.dirty) {
      // 前进碰到已失效的内部记录时回到基准，不复活已放弃的输入。
      void this.enqueue(() => this.move("base"));
    } else {
      this.restoreScroll();
    }
    // 同 URL 的哨兵遍历不交给 Next，避免连续后退时异步路由恢复覆盖当前记录。
    return true;
  }

  leave(action: () => void) {
    if (this.leaving) return Promise.resolve();
    this.leaving = true;
    this.suspended = true;
    return this.enqueue(async () => {
      await this.remove();
      this.hasSentinel = false;
      action();
    });
  }

  async runAction<T>(action: () => Promise<T>): Promise<T> {
    this.suspended = true;
    this.saving = true;
    await this.enqueue(() => this.remove());
    try {
      const result = await action();
      this.saving = false;
      this.suspended = false;
      // 返回状态表示仍留在表单（含保存失败、关联同步确认）；服务端 redirect 会抛出导航信号。
      await this.setDirty(this.dirty);
      return result;
    } catch (error) {
      this.saving = false;
      const redirect =
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT;");
      if (!redirect) {
        this.suspended = false;
        await this.setDirty(this.dirty);
      } else if (this.port.href() === this.href && this.originalScrollMode) {
        this.port.setScrollRestoration(this.originalScrollMode);
      }
      throw error;
    }
  }

  dispose() {
    this.suspended = true;
    return this.enqueue(() => this.remove());
  }
}
