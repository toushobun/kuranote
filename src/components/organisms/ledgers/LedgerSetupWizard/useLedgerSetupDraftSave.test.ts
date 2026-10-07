import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  type LedgerSetupDraft,
} from "internal/ledger";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupFixtureId,
} from "test/mocks/ledgerSetup";
import type {
  LedgerSetupDraftActionState,
  LedgerSetupDraftSaveAction,
} from "types/ledgers";

import { createSaveDraftMock } from "./ledgerSetupWizardTestUtils";
import { useLedgerSetupDraftSave } from "./useLedgerSetupDraftSave";

const progress = createLedgerSetupProgressFixture({ step: 3 });
const draft: LedgerSetupDraft = {
  ...progress.setup.draft,
  accounts: { items: [], skipped: true },
};

function renderDraftSave({
  saveDraft = createSaveDraftMock(progress),
  step = 2,
}: {
  saveDraft?: LedgerSetupDraftSaveAction;
  step?: number;
} = {}) {
  const callbacks = {
    onBusyChange: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onProgressChange: vi.fn(),
    onProgressRefresh: vi.fn(),
  };
  const { result } = renderHook(() =>
    useLedgerSetupDraftSave({
      ...callbacks,
      actions: { saveDraft, submitBasicInfo: vi.fn() },
      progress,
      step,
    }),
  );

  return { ...callbacks, result, saveDraft };
}

function createPendingSave() {
  let resolve: (state: LedgerSetupDraftActionState) => void = () => {};
  const saveDraft = vi.fn<LedgerSetupDraftSaveAction>(
    () =>
      new Promise((next) => {
        resolve = next;
      }),
  );

  return {
    resolve: (state: LedgerSetupDraftActionState) => resolve(state),
    saveDraft,
  };
}

describe("useLedgerSetupDraftSave", () => {
  it("下一步：保存草稿并把 setup_step 设为下一步，成功后更新进度并前进", async () => {
    const { onNext, onPrevious, onProgressChange, result, saveDraft } =
      renderDraftSave({ step: 3 });

    await act(() => result.current.saveAndGoNext(draft));

    expect(saveDraft).toHaveBeenCalledWith({
      draft,
      ledgerId: ledgerSetupFixtureId,
      step: 4,
    });
    expect(onProgressChange).toHaveBeenCalledWith({
      ...progress,
      setup: { ...progress.setup, draft, step: 4 },
    });
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("上一步：同样保存修改，setup_step 不倒退（保留已保存的较大步骤）", async () => {
    const { onNext, onPrevious, onProgressChange, result, saveDraft } =
      renderDraftSave({ step: 2 });

    await act(() => result.current.saveAndGoPrevious(draft));

    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ draft, step: 3 }),
    );
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("上一步：当前步骤比已保存的步骤大时保存当前步骤", async () => {
    const { result, saveDraft } = renderDraftSave({ step: 4 });

    await act(() => result.current.saveAndGoPrevious(draft));

    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ step: 4 }),
    );
  });

  it("保存中标记为保存中并通知骨架锁定，完成后解除", async () => {
    const pending = createPendingSave();
    const { onBusyChange, result } = renderDraftSave({
      saveDraft: pending.saveDraft,
    });

    let saving: Promise<void> = Promise.resolve();
    act(() => {
      saving = result.current.saveAndGoNext(draft);
    });

    expect(result.current.isSaving).toBe(true);
    expect(onBusyChange).toHaveBeenLastCalledWith(true);

    // 保存中重复点击不会再次保存。
    await act(() => result.current.saveAndGoNext(draft));
    expect(pending.saveDraft).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ progress });
      await saving;
    });

    expect(result.current.isSaving).toBe(false);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it("失败时不前进，并返回失败弹框使用的状态", async () => {
    const failure = { error: "创建进度保存失败，请稍后重试。", errorKey: "e1" };
    const { onNext, onProgressChange, result } = renderDraftSave({
      saveDraft: vi.fn(async () => failure),
    });

    await act(() => result.current.saveAndGoNext(draft));

    expect(onNext).not.toHaveBeenCalled();
    expect(onProgressChange).not.toHaveBeenCalled();
    expect(result.current.failureState).toEqual(failure);
    expect(result.current.accountNameDuplicateError).toBeNull();
  });

  it("账户重名时不显示失败弹框，返回重名文案", async () => {
    const message =
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.accountNameDuplicate];
    const { onNext, result } = renderDraftSave({
      saveDraft: vi.fn(async () => ({
        accountNameDuplicate: true,
        error: message,
        errorKey: "e1",
      })),
    });

    await act(() => result.current.saveAndGoNext(draft));

    expect(onNext).not.toHaveBeenCalled();
    expect(result.current.accountNameDuplicateError).toBe(message);
    expect(result.current.failureState).toEqual({});
  });

  it("预设内容已更新时用重新读取的进度刷新向导，不前进", async () => {
    const refreshed = createLedgerSetupProgressFixture({ step: 2 });
    const { onNext, onProgressChange, onProgressRefresh, result } =
      renderDraftSave({
        saveDraft: vi.fn(async () => ({ outdated: true, progress: refreshed })),
      });

    await act(() => result.current.saveAndGoNext(draft));

    expect(onProgressRefresh).toHaveBeenCalledWith(refreshed);
    expect(onProgressChange).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});
