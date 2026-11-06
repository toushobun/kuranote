import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntlTimeZone } from "test/mockIntlTimeZone";

import {
  ledgerCreateErrorCodes,
  ledgerCreateErrorMessages,
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger";
import {
  clickNext,
  getCurrentStepItem,
  goPreviousTo,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupFixtureId,
} from "test/mocks/ledgerSetup";
import type {
  LedgerSetupBasicInfoActionState,
  LedgerSetupBasicInfoStateAction,
} from "types/ledgers";

beforeEach(() => {
  mockIntlTimeZone("Asia/Tokyo");
});
afterEach(() => {
  vi.restoreAllMocks();
});

function createSubmitMock(
  result: LedgerSetupBasicInfoActionState = {
    progress: createLedgerSetupProgressFixture(),
  },
) {
  return vi.fn<LedgerSetupBasicInfoStateAction>(async () => result);
}

function getSubmittedFormData(
  submit: ReturnType<typeof createSubmitMock>,
  call = 0,
) {
  return Object.fromEntries(submit.mock.calls[call][1].entries());
}

function selectCurrency(label: string) {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "默认货币" }));
  fireEvent.click(screen.getByRole("option", { name: label }));
}

describe("LedgerSetupBasicInfoStep", () => {
  it("显示引导文案与默认值", () => {
    renderLedgerSetupWizard();

    expect(
      screen.getByRole("heading", { name: "先给账本起个名字吧" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("这些信息之后都可以在账本设置中修改"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("账本名称")).toHaveValue("家庭账本");
    expect(
      screen.getByRole("combobox", { name: "默认货币" }),
    ).toHaveTextContent("JPY 日元");
    expect(screen.getByLabelText("我的显示名")).toHaveValue("DENG SONGWEN");
    expect(screen.getByLabelText("琥珀橙")).toBeChecked();
  });

  it.each([
    ["Asia/Tokyo", "日本"],
    ["Asia/Shanghai", "中国"],
  ])("按浏览器时区 %s 预选 %s", (timeZone, region) => {
    mockIntlTimeZone(timeZone);
    renderLedgerSetupWizard();
    expect(screen.getByRole("radio", { name: region })).toBeChecked();
  });

  it("其他时区不预选地区，未选择时不能提交", async () => {
    mockIntlTimeZone("UTC");
    const submit = createSubmitMock();
    renderLedgerSetupWizard({ submitBasicInfo: submit });
    const japan = screen.getByRole("radio", { name: "日本" });
    expect(japan).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "中国" })).not.toBeChecked();
    expect(japan).toBeInvalid();
    await act(async () => clickNext());
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(japan);
    clickNext();
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(getSubmittedFormData(submit)).toMatchObject({ livingRegion: "jp" });
  });

  it("已有创建中账本时显示该账本的基本信息", () => {
    renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({
        baseCurrency: "USD",
        displayColor: "sky",
        displayName: "旅人",
        name: "旅行账本",
        step: 1,
      }),
    });

    expect(screen.getByLabelText("账本名称")).toHaveValue("旅行账本");
    expect(
      screen.getByRole("combobox", { name: "默认货币" }),
    ).toHaveTextContent("USD 美元");
    expect(screen.getByLabelText("我的显示名")).toHaveValue("旅人");
    expect(screen.getByLabelText("天空蓝")).toBeChecked();
  });

  it("首次提交不带账本 ID（创建账本）", async () => {
    const submit = createSubmitMock();
    renderLedgerSetupWizard({ submitBasicInfo: submit });

    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "旅行账本" },
    });
    clickNext();

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(getSubmittedFormData(submit)).toEqual({
      baseCurrency: "JPY",
      ledgerId: "",
      livingRegion: "jp",
      ledgerName: "旅行账本",
      memberDisplayColor: "amber",
      memberDisplayName: "DENG SONGWEN",
    });
  });

  it("返回第 1 步再次提交时带账本 ID（更新基本信息）并进入下一步", async () => {
    const submit = createSubmitMock();
    renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 2 }),
      submitBasicInfo: submit,
    });

    await goPreviousTo("基本信息");
    clickNext();

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(getSubmittedFormData(submit)).toMatchObject({
      ledgerId: ledgerSetupFixtureId,
    });
    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("账户"));
  });

  it("校验失败时显示模块错误文案并留在第 1 步", async () => {
    renderLedgerSetupWizard({
      submitBasicInfo: createSubmitMock({
        error: ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameTooLong],
        errorKey: "error-1",
      }),
    });

    clickNext();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("账本保存失败");
    expect(alert).toHaveTextContent(
      ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameTooLong],
    );
    expect(getCurrentStepItem()).toHaveTextContent("基本信息");
  });

  it("提交失败时显示反馈并保留输入", async () => {
    const { onClose } = renderLedgerSetupWizard({
      submitBasicInfo: createSubmitMock({
        error: ledgerCreateErrorMessages[ledgerCreateErrorCodes.createFailed],
        errorKey: "error-1",
      }),
    });

    fireEvent.change(screen.getByLabelText("我的显示名"), {
      target: { value: "旅人" },
    });
    await act(async () => clickNext());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ledgerCreateErrorMessages[ledgerCreateErrorCodes.createFailed],
    );
    expect(screen.getByLabelText("我的显示名")).toHaveValue("旅人");
    expect(getCurrentStepItem()).toHaveTextContent("基本信息");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("提交中下一步显示加载状态并禁用", async () => {
    renderLedgerSetupWizard({
      submitBasicInfo: vi.fn(() => new Promise<never>(() => {})),
    });

    clickNext();

    const button = await screen.findByRole("button", { name: "保存中" });
    expect(button).toBeDisabled();
    expect(
      within(button).getByRole("progressbar", { name: "保存中" }),
    ).toBeInTheDocument();
  });

  it("已存在创建中账本时恢复到该账本，提示还没创建完而不是显示失败", async () => {
    const restored = createLedgerSetupProgressFixture({
      name: "之前的账本",
      step: 3,
    });
    renderLedgerSetupWizard({
      submitBasicInfo: createSubmitMock({ progress: restored, restored: true }),
    });

    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("商家"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent(
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
    );

    fireEvent.click(within(notice).getByRole("button", { name: "关闭提示" }));
    expect(
      screen.queryByText(
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
      ),
    ).not.toBeInTheDocument();
  });

  it("恢复到的创建中账本基于旧版预设时，同时提示预设内容已更新", async () => {
    const restored = createLedgerSetupProgressFixture({
      name: "之前的账本",
      step: 3,
      templateUpdated: true,
    });
    renderLedgerSetupWizard({
      submitBasicInfo: createSubmitMock({ progress: restored, restored: true }),
    });

    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("商家"));
    expect(screen.getByRole("status")).toHaveTextContent(
      `${ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists]}预设内容已更新，请重新确认`,
    );
  });

  it("正常提交成功时不显示还没创建完的提示", async () => {
    renderLedgerSetupWizard({ submitBasicInfo: createSubmitMock() });

    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("账户"));
    expect(
      screen.queryByText(
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
      ),
    ).not.toBeInTheDocument();
  });

  it("修改默认货币直接提交，不再显示清空选择确认", async () => {
    const submit = createSubmitMock();
    renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 1 }),
      submitBasicInfo: submit,
    });
    selectCurrency("USD 美元");
    clickNext();
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByRole("dialog", { name: "修改默认货币" }),
    ).not.toBeInTheDocument();
    expect(getSubmittedFormData(submit)).toMatchObject({
      baseCurrency: "USD",
      livingRegion: "jp",
    });
  });
});
