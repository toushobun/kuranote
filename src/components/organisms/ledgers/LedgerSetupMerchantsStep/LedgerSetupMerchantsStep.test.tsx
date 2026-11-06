import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";

import {
  getLedgerSetupTemplate,
  ledgerSetupWriteErrorMessages,
  type LedgerSetupTemplate,
} from "internal/ledger";
import {
  getChecklistGroup,
  getChecklistGroupExpandButton,
  getChecklistItemCheckbox,
  toggleChecklistGroup,
} from "molecules/ui/GroupedPresetChecklist/groupedPresetChecklistTestUtils";
import {
  clickCloseWizard,
  clickNext,
  clickPrevious,
  createSaveDraftMock,
  getCurrentStepItem,
  getSavedInput,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { merchantRegionButtonName } from "organisms/merchants/MerchantPresetSelector/merchantPresetSelectorTestUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupMerchantDefaultSelectedKeys,
  ledgerSetupMerchantTemplateFixture,
} from "test/mocks/ledgerSetup";
import type { LedgerSetupDraftSaveAction } from "types/ledgers";

function createMerchantsProgress({
  selectedKeys = ledgerSetupMerchantDefaultSelectedKeys,
  skipped = false,
  template = ledgerSetupMerchantTemplateFixture,
}: {
  selectedKeys?: string[];
  skipped?: boolean;
  template?: LedgerSetupTemplate | null;
} = {}) {
  const base = createLedgerSetupProgressFixture({ step: 3 });
  return createLedgerSetupProgressFixture(
    {
      draft: { ...base.setup.draft, merchants: { selectedKeys, skipped } },
      step: 3,
    },
    template,
  );
}

/** 渲染停在第 3 步「商家」的向导。 */
function renderMerchantsStep({
  progress = createMerchantsProgress(),
  saveDraft = createSaveDraftMock(progress),
}: {
  progress?: ReturnType<typeof createMerchantsProgress>;
  saveDraft?: Mock<LedgerSetupDraftSaveAction>;
} = {}) {
  return renderLedgerSetupWizard({ progress, saveDraft });
}

function getTagCheckbox(tagName: string) {
  return screen.getByRole("checkbox", {
    name: `选择「${tagName}」的全部商家`,
  });
}

function expectNextLabel(label: string) {
  expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
}

describe("LedgerSetupMerchantsStep", () => {
  it("显示引导文案与按 sortOrder 排列的商家标签，初始勾选来自草稿", () => {
    renderMerchantsStep();

    expect(
      screen.getByRole("heading", { name: "挑选常去的商家" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("之后可以在商家管理中修改名称和别名"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "日本常用商家" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("region")
        .map((node) => node.getAttribute("aria-label")),
    ).toEqual([
      "超市",
      "餐饮",
      "家电数码",
      "电商",
      "订阅服务",
      "政府·公共服务",
    ]);
    expect(getTagCheckbox("餐饮")).toBeChecked();
    expect(getChecklistGroup("餐饮")).toHaveTextContent("3 / 3");
    expect(getTagCheckbox("家电数码")).not.toBeChecked();
    // 订阅服务中只有 Amazon 因「电商」默认勾选而被选中。
    expect(getChecklistGroup("订阅服务")).toHaveTextContent("1 / 3");
    expect(getTagCheckbox("订阅服务")).toHaveAttribute(
      "data-indeterminate",
      "true",
    );
    expectNextLabel("下一步 · 已选 7 家");
    expect(screen.queryByRole("button", { name: "跳过此步" })).toBeNull();
  });

  it("草稿中的勾选优先于标签的默认勾选", () => {
    renderMerchantsStep({
      progress: createMerchantsProgress({ selectedKeys: ["netflix"] }),
    });

    expect(getTagCheckbox("餐饮")).not.toBeChecked();
    expect(getChecklistGroup("订阅服务")).toHaveTextContent("1 / 3");
    expectNextLabel("下一步 · 已选 1 家");
  });

  it("地区计数之和等于下一步的数量，收起第一地区后保留勾选", async () => {
    renderMerchantsStep({
      progress: createMerchantsProgress({
        selectedKeys: ["starbucks", "haidilao"],
        template: getLedgerSetupTemplate("jp"),
      }),
    });
    const japan = screen.getByRole("button", merchantRegionButtonName("jp"));
    const china = screen.getByRole("button", merchantRegionButtonName("cn"));
    expect(japan).toHaveAccessibleDescription("已选 1 家");
    expect(china).toHaveAccessibleDescription("已选 1 家");
    expectNextLabel("下一步 · 已选 2 家");

    const restaurant = getChecklistGroupExpandButton("餐饮", 0);
    fireEvent.click(japan);
    await waitFor(() => expect(restaurant).not.toBeVisible());
    expectNextLabel("下一步 · 已选 2 家");
    fireEvent.click(japan);
    const dining = toggleChecklistGroup("餐饮", 0);
    expect(
      within(dining).getByRole("checkbox", { name: /星巴克/ }),
    ).toBeChecked();
  });

  it("多标签商家在各标签下联动，已选数量按去重后的商家计算", () => {
    renderMerchantsStep({
      progress: createMerchantsProgress({ selectedKeys: [] }),
    });
    expectNextLabel("下一步");

    toggleChecklistGroup("电商");
    toggleChecklistGroup("订阅服务");
    fireEvent.click(getChecklistItemCheckbox("电商", "Amazon"));

    expect(getChecklistItemCheckbox("订阅服务", "Amazon")).toBeChecked();
    expectNextLabel("下一步 · 已选 1 家");

    // 全选「家电数码」与「订阅服务」：Apple 同时属于两者，只算一次。
    fireEvent.click(getTagCheckbox("家电数码"));
    fireEvent.click(getTagCheckbox("订阅服务"));
    expectNextLabel("下一步 · 已选 4 家");
  });

  it("展开后商家行不显示网址，无官网时仍有名称", () => {
    renderMerchantsStep();

    const restaurant = toggleChecklistGroup("餐饮");
    const publicService = toggleChecklistGroup("政府·公共服务");

    expect(
      within(restaurant).queryByText("skylark.co.jp"),
    ).not.toBeInTheDocument();
    expect(
      within(restaurant).queryByText("mcdonalds.co.jp"),
    ).not.toBeInTheDocument();
    expect(
      getChecklistItemCheckbox("政府·公共服务", "病院"),
    ).toHaveAccessibleName("病院");
    expect(within(publicService).queryByText(/\./)).toBeNull();
  });

  it("只通过分类复选框批量选择，无地区更改或额外全选按钮", () => {
    renderMerchantsStep();
    toggleChecklistGroup("餐饮");
    expect(
      screen.queryByRole("button", { name: /^(更改|全部选择|全选|全不选)$/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(getTagCheckbox("餐饮"));
    expectNextLabel("下一步 · 已选 4 家");
    fireEvent.click(getTagCheckbox("餐饮"));
    expectNextLabel("下一步 · 已选 7 家");
  });

  it("下一步时保存勾选的商家，skipped 为 false，setup_step 为第 4 步", async () => {
    const progress = createMerchantsProgress();
    const saveDraft = createSaveDraftMock(progress);
    renderMerchantsStep({ progress, saveDraft });

    fireEvent.click(getTagCheckbox("餐饮"));
    clickNext();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("功能"));
    expect(getSavedInput(saveDraft)).toEqual({
      draft: {
        ...progress.setup.draft,
        merchants: {
          selectedKeys: ["aeon", "seiyu", "amazon", "mercari"],
          skipped: false,
        },
      },
      ledgerId: progress.setup.id,
      step: 4,
    });
  });

  it("上一步时保存当前勾选并保留原有的跳过状态，setup_step 不倒退", async () => {
    const progress = createMerchantsProgress({ skipped: true });
    const saveDraft = createSaveDraftMock(progress);
    renderMerchantsStep({ progress, saveDraft });

    fireEvent.click(getTagCheckbox("超市"));
    clickPrevious();

    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("账户"));
    expect(getSavedInput(saveDraft)).toMatchObject({
      draft: {
        merchants: {
          selectedKeys: ["mcdonalds", "gusto", "sukiya", "amazon", "mercari"],
          skipped: true,
        },
      },
      step: 3,
    });
  });

  it("保存中禁用勾选、操作栏与关闭按钮", async () => {
    renderMerchantsStep({
      saveDraft: vi.fn<LedgerSetupDraftSaveAction>(() => new Promise(() => {})),
    });

    toggleChecklistGroup("餐饮");
    clickNext();

    expect(
      await screen.findByRole("progressbar", { name: "保存中" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
    expect(getTagCheckbox("超市")).toBeDisabled();
    expect(getChecklistItemCheckbox("餐饮", "ガスト")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "关闭创建账本向导" }),
    ).toBeDisabled();

    clickCloseWizard();
    expect(
      screen.queryByRole("dialog", { name: "尚未保存" }),
    ).not.toBeInTheDocument();
  });

  it("保存失败时显示失败反馈并留在当前步骤", async () => {
    renderMerchantsStep({
      saveDraft: vi.fn<LedgerSetupDraftSaveAction>(async () => {
        throw new Error("network error");
      }),
    });

    clickNext();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("创建进度保存失败");
    expect(alert).toHaveTextContent(
      ledgerSetupWriteErrorMessages.draftSaveFailed,
    );
    expect(getCurrentStepItem()).toHaveTextContent("商家");
  });

  it("预设内容已更新时用重新读取的进度刷新勾选，并在顶部提示重新确认", async () => {
    const refreshed = createMerchantsProgress({ selectedKeys: ["netflix"] });
    renderMerchantsStep({
      saveDraft: vi.fn(async () => ({ outdated: true, progress: refreshed })),
    });

    fireEvent.click(getTagCheckbox("家电数码"));
    clickNext();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "预设内容已更新，请重新确认",
    );
    expect(getCurrentStepItem()).toHaveTextContent("商家");
    expect(getTagCheckbox("家电数码")).not.toBeChecked();
    expectNextLabel("下一步 · 已选 1 家");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  describe("所选币种没有模板", () => {
    const noTemplateProgress = () =>
      createMerchantsProgress({ selectedKeys: [], template: null });

    it("显示空状态，不显示勾选列表", () => {
      renderMerchantsStep({ progress: noTemplateProgress() });

      expect(screen.getByText("请先选择生活地区")).toBeInTheDocument();
      expect(
        screen.getByText("可以直接进入下一步，之后在商家管理中添加"),
      ).toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).toBeNull();
      expect(screen.queryByRole("button", { name: "全部选择" })).toBeNull();
      expect(screen.getByRole("button", { name: "上一步" })).toBeEnabled();
      expectNextLabel("下一步");
    });

    it("下一步时保存为 skipped: true、selectedKeys: []", async () => {
      const progress = noTemplateProgress();
      const saveDraft = createSaveDraftMock(progress);
      renderMerchantsStep({ progress, saveDraft });

      clickNext();

      await waitFor(() =>
        expect(getCurrentStepItem()).toHaveTextContent("功能"),
      );
      expect(getSavedInput(saveDraft)).toMatchObject({
        draft: { merchants: { selectedKeys: [], skipped: true } },
        step: 4,
      });
    });
  });
});
