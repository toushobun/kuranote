import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://localhost:3097";
const sourceUrl = `${baseUrl}/dashboard`;
const output = path.resolve(
  process.env.UNSAVED_GUARD_OUTPUT ?? ".next/976-evidence",
);
const tolerance = 1;

async function paint(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function scroll(page, y) {
  await page.evaluate(
    (top) => scrollTo({ top, left: 0, behavior: "instant" }),
    y,
  );
  await paint(page);
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - y) <= tolerance);
}
async function position(page, expected) {
  await page.waitForFunction(
    (value) => history.state?.kuranoteUnsavedChanges?.position === value,
    expected,
  );
  await paint(page);
}
async function keepScroll(page, expected, mode = "manual") {
  await paint(page);
  const actual = await page.evaluate(() => ({
    x: scrollX,
    y: scrollY,
    mode: history.scrollRestoration,
  }));
  assert.ok(
    Math.abs(actual.y - expected) <= tolerance,
    `滚动位置应为 ${expected}，实际 ${actual.y}`,
  );
  assert.equal(actual.mode, mode);
}
async function cancel(page) {
  await page.getByRole("button", { name: "继续编辑" }).click();
  await page
    .getByRole("dialog", { name: "尚未保存" })
    .waitFor({ state: "hidden" });
  await paint(page);
}
// 避免 locator.fill 自动把屏幕外字段滚进视口，专门验证表单还原触发的内部 history 遍历。
async function setValueWithoutScrolling(locator, value) {
  await locator.evaluate((element, next) => {
    const prototype =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, next);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function dismissReloadPrompt(page) {
  let nativePrompt = false;
  page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "beforeunload");
    nativePrompt = true;
    await dialog.dismiss();
  });
  await page.reload().catch(() => {});
  assert.equal(nativePrompt, true);
}
async function browserBack(page) {
  await page.goBack({ waitUntil: "commit" });
}
async function forwardPastInactiveSentinel(page) {
  const popCount = await page.evaluate(() => window.probePops.length);
  await page.goForward({ waitUntil: "commit" });
  // 先等前进及守卫回到基准的两次遍历，避免读到前进前的旧基准。
  await page.waitForFunction(
    (count) => window.probePops.length >= count + 2,
    popCount,
  );
  await position(page, "base");
}
async function newSession(browser, link, formId) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  const cdp = await page.context().newCDPSession(page);
  const rsc = [];
  const prefetchRsc = [];
  const resetRsc = () => {
    rsc.length = 0;
    prefetchRsc.length = 0;
  };
  const pendingRequests = new Set();
  page.on("request", (request) => pendingRequests.add(request.url()));
  page.on("requestfinished", (request) =>
    pendingRequests.delete(request.url()),
  );
  page.on("requestfailed", (request) => pendingRequests.delete(request.url()));
  const errors = [];
  const records = [];
  page.on("request", (request) => {
    if (request.headers().rsc === "1" || request.url().includes("_rsc=")) {
      rsc.push(request.url());
      if (request.headers()["next-router-prefetch"] === "1")
        prefetchRsc.push(request.url());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error("页面错误", error);
  });
  await page.addInitScript(() => {
    window.probePops = [];
    window.scrollSamples = [];
    addEventListener(
      "popstate",
      () => window.probePops.push({ href: location.href, y: scrollY }),
      true,
    );
    addEventListener("scroll", () => window.scrollSamples.push(scrollY), true);
  });
  async function record(step) {
    await paint(page);
    const navigation = await cdp.send("Page.getNavigationHistory");
    const state = await page.evaluate(
      (id) => ({
        mounts: window.probeMounts ?? 0,
        unmounts: window.probeUnmounts ?? 0,
        length: history.length,
        marker: history.state?.kuranoteUnsavedChanges?.position ?? null,
        sameForm: window.probeForm === document.getElementById(id),
        scrollX,
        scrollY,
        scrollRestoration: history.scrollRestoration,
        scrollSamples: window.scrollSamples,
      }),
      formId,
    );
    const row = {
      step,
      ...state,
      rscRequests: rsc.length,
      prefetchRscRequests: prefetchRsc.length,
      navigationRscRequests: rsc.length - prefetchRsc.length,
      currentIndex: navigation.currentIndex,
    };
    records.push(row);
    console.log(JSON.stringify(row));
    return row;
  }
  await page.goto(sourceUrl);
  await scroll(page, 320);
  const sourceScroll = await page.evaluate(() => scrollY);
  await page.evaluate(() => {
    addEventListener(
      "click",
      () => {
        window.sourceClickScroll = scrollY;
      },
      { once: true, capture: true },
    );
  });
  await page.getByRole("link", { name: link, exact: true }).click();
  assert.equal(
    await page.evaluate(() => window.sourceClickScroll),
    sourceScroll,
    "点击编辑入口本身不能滚动来源页",
  );
  await page.locator(`#${formId}`).waitFor();
  await page.waitForLoadState("networkidle").catch((error) => {
    console.error("尚未完成的浏览器请求", [...pendingRequests]);
    throw error;
  });
  await page.evaluate((id) => {
    window.probeForm = document.getElementById(id);
  }, formId);
  assert.equal(
    await page
      .locator("main.MuiContainer-maxWidthMd")
      .evaluate((main) => getComputedStyle(main).zIndex),
    "1",
  );
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "首页", exact: true })
    .waitFor();
  await keepScroll(page, 0, "auto");
  resetRsc();
  const baseline = await record(`${link}：AppShell 普通导航到 B 后滚到顶部`);
  async function backAndCancel(y) {
    await page.evaluate(() => {
      window.scrollSamples = [];
    });
    await browserBack(page);
    await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
    await position(page, "sentinel");
    assert.equal(
      await page
        .getByRole("dialog")
        .evaluate(
          (dialog) =>
            dialog.closest(".MuiDialog-root").parentElement === document.body,
        ),
      true,
    );
    await cancel(page);
    await keepScroll(page, y);
    const samples = await page.evaluate(() => window.scrollSamples);
    assert.ok(
      samples.every((sample) => Math.abs(sample - y) <= tolerance),
      `内部后退出现滚动跳动：${samples}`,
    );
  }
  async function discardAndCheckSource() {
    await browserBack(page);
    await page.getByRole("button", { name: "放弃修改" }).click();
    await page.waitForURL(sourceUrl);
    await page.getByRole("heading", { name: "离开守卫兼容性验证" }).waitFor();
    await page.waitForLoadState("networkidle");
    await keepScroll(page, sourceScroll, "auto");
    await record(
      `${link}：确认放弃仅回到 A，恢复来源页 scrollY=${sourceScroll}`,
    );
  }
  return {
    page,
    records,
    errors,
    rsc,
    resetRsc,
    baseline,
    record,
    backAndCancel,
    discardAndCheckSource,
  };
}
async function checkAccount(browser) {
  const session = await newSession(browser, "编辑账户", "edit-account-form");
  const {
    page,
    baseline,
    records,
    errors,
    rsc,
    record,
    backAndCancel,
    discardAndCheckSource,
  } = session;
  const name = page.getByLabel(/账户名称/);
  const initial = await name.inputValue();
  await scroll(page, 200);
  await name.fill("未保存账户");
  await name.blur();
  await position(page, "sentinel");
  await record("在 scrollY=200 首次修改并添加哨兵");
  await scroll(page, 2000);
  for (let i = 0; i < 3; i++) await backAndCancel(2000);
  const restored = await record("浏览器后退→继续编辑 3 次，仍停在 2000");
  assert.equal(restored.mounts, baseline.mounts);
  assert.equal(restored.unmounts, baseline.unmounts);
  assert.equal(restored.sameForm, true);
  assert.equal(restored.rscRequests, 0);
  assert.equal(restored.length, baseline.length + 1);

  await dismissReloadPrompt(page);
  await keepScroll(page, 2000);
  await record("刷新原生提示取消，表单与滚动位置保留");

  const rapid = await Promise.allSettled([
    browserBack(page),
    browserBack(page),
  ]);
  for (const result of rapid)
    if (result.status === "rejected")
      assert.match(result.reason.message, /interrupted|ERR_ABORTED/);
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await cancel(page);
  await keepScroll(page, 2000);
  await record("连续两次浏览器后退后继续编辑");

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "首页", exact: true })
    .click();
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await page.screenshot({ path: path.join(output, "account-confirm.png") });
  await cancel(page);
  // 点击固定底部导航不会滚动文档。
  await keepScroll(page, 2000);
  // 动过就算修改：改回原值仍保留哨兵，后退仍需确认。
  await setValueWithoutScrolling(name, initial);
  await position(page, "sentinel");
  await keepScroll(page, 2000);
  await record("长页下方改回原值仍保护，scrollY 保持 2000");
  await backAndCancel(2000);
  assert.equal(await name.inputValue(), initial);
  await record("改回原值后浏览器后退仍确认，继续编辑保持 2000");
  await setValueWithoutScrolling(name, "再次修改");
  await position(page, "sentinel");
  await keepScroll(page, 2000);
  const rewritten = await record("再次修改复用同一哨兵，scrollY 保持 2000");
  assert.equal(rewritten.length, restored.length);
  assert.equal(rsc.length, 0);
  await discardAndCheckSource();

  await page.goForward({ waitUntil: "commit" });
  await name.waitFor();
  await page.waitForLoadState("networkidle");
  assert.equal(await name.inputValue(), initial);
  const forwardY = await page.evaluate(() => scrollY);
  await record("正常前进重入 B，表单为初始数据");
  await forwardPastInactiveSentinel(page);
  await keepScroll(page, forwardY, "auto");
  await record("再次前进到旧哨兵，不复活草稿、不改变滚动位置");
  await browserBack(page);
  await page.waitForURL(sourceUrl);
  await keepScroll(page, 320, "auto");

  for (let i = 0; i < 3; i++) {
    await page.getByRole("link", { name: "编辑账户", exact: true }).click();
    await name.fill("重复进入");
    await name.blur();
    await position(page, "sentinel");
    const row = await record(`重复进入并修改 ${i + 1}`);
    assert.equal(row.length, restored.length);
    await discardAndCheckSource();
  }
  await page.getByRole("link", { name: "编辑账户", exact: true }).click();
  await name.fill("保存失败");
  await name.blur();
  await scroll(page, 2000);
  await browserBack(page);
  await page.getByRole("button", { name: "保存并退出", exact: true }).click();
  await page.getByText("验证用保存失败", { exact: true }).waitFor();
  await position(page, "sentinel");
  await keepScroll(page, 2000);
  await record("真实保存失败后恢复保护，保存前清理不改变滚动位置");
  await setValueWithoutScrolling(name, "保存成功");
  await browserBack(page);
  await page.getByRole("button", { name: "保存并退出", exact: true }).click();
  await page.waitForURL(`${sourceUrl}?saved=1`);
  await keepScroll(page, 0, "auto");
  await record("真实保存成功跳转，AppShell 普通导航回到顶部");
  assert.deepEqual(errors, []);
  await page.close();
  return { records, errors };
}
async function editReceiptNote(page, original, value) {
  await page.getByRole("button", { name: "修改备注：" + original }).click();
  const input = page.getByRole("textbox", { name: "备注", exact: true });
  assert.equal(
    await input.evaluate((node) => node === document.activeElement),
    true,
  );
  await input.fill(value);
  await page.getByRole("button", { name: "完成", exact: true }).click();
}

async function checkReceiptSave(browser, mode) {
  const session = await newSession(
    browser,
    "编辑小票",
    "edit-transaction-receipt-form",
  );
  const { page, record } = session;
  await editReceiptNote(
    page,
    "编辑前备注",
    mode === "failure" ? "验证保存失败" : "修改后的备注",
  );
  const feedback = page.getByText("保存成功", { exact: true });
  if (mode === "direct") {
    await page.getByRole("button", { name: "保存修改", exact: true }).click();
    await page.waitForURL("**/transactions?saved=1");
    await paint(page);
    assert.equal(await feedback.count(), 0);
    await record("编辑小票：直接保存仍由 Server Action 重定向到明细");
    return finishSession(session);
  }

  if (mode === "back") {
    await position(page, "sentinel");
    await browserBack(page);
  } else if (mode === "close") {
    await page.getByRole("link", { name: "关闭", exact: true }).click();
  } else {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "我的" })
      .click();
  }

  // 路由完成前持续观察原表单与成功提示是否曾同时出现在页面上。
  await page.evaluate(() => {
    window.receiptSuccessBeforeLeaving = false;
    new MutationObserver(() => {
      if (!document.getElementById("edit-transaction-receipt-form")) return;
      window.receiptSuccessBeforeLeaving ||= Array.from(
        document.querySelectorAll('[role="alert"], [role="status"]'),
      ).some((node) => node.textContent.trim() === "保存成功");
    }).observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  await page.getByRole("button", { name: "保存并退出" }).click();
  if (mode === "failure") {
    await page.getByText("验证用保存失败", { exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/receipt");
    assert.equal(await feedback.count(), 0);
    await record("编辑小票：保存并退出失败后留在原页，没有成功提示");
  } else {
    const destination =
      mode === "back"
        ? sourceUrl
        : mode === "close"
          ? "**/transactions"
          : "**/settings";
    await page.waitForURL(destination);
    await feedback.waitFor();
    assert.equal(await feedback.count(), 1);
    assert.equal(
      await page.locator("#edit-transaction-receipt-form").count(),
      0,
    );
    await feedback.waitFor({ state: "hidden" });
    await record(`编辑小票：${mode} 保存并退出后仅在目的地显示一次成功提示`);
  }
  assert.equal(
    await page.evaluate(() => window.receiptSuccessBeforeLeaving),
    false,
  );
  return finishSession(session);
}

async function checkOtherPage(browser, kind) {
  const receipt = kind === "receipt";
  const session = await newSession(
    browser,
    receipt ? "编辑小票" : "编辑转账",
    receipt
      ? "edit-transaction-receipt-form"
      : "edit-transfer-transaction-form",
  );
  const {
    page,
    baseline,
    record,
    records,
    errors,
    rsc,
    backAndCancel,
    discardAndCheckSource,
  } = session;
  if (receipt) {
    await editReceiptNote(page, "编辑前备注", "修改后的小票备注");
  } else {
    await page
      .getByRole("textbox", { name: "备注（选填）" })
      .fill("修改后的转账备注");
    await page.getByRole("textbox", { name: "备注（选填）" }).blur();
  }
  await position(page, "sentinel");
  await scroll(page, 2000);
  await backAndCancel(2000);
  const row = await record(`${kind}：真实 AppShell 浏览器后退取消后保持 2000`);
  assert.equal(row.mounts, baseline.mounts);
  assert.equal(row.unmounts, baseline.unmounts);
  assert.equal(row.sameForm, true);
  assert.equal(row.length, baseline.length + 1);
  assert.equal(rsc.length, 0);
  await browserBack(page);
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await page.screenshot({ path: path.join(output, `${kind}-confirm.png`) });
  await cancel(page);
  await discardAndCheckSource();
  assert.deepEqual(errors, []);
  await page.close();
  return { records, errors };
}
async function checkMerchant(browser, edit) {
  const formId = edit ? "merchant-edit-form" : "create-merchant-form";
  const session = await newSession(
    browser,
    edit ? "编辑商家" : "新增商家",
    formId,
  );
  const {
    page,
    baseline,
    record,
    records,
    errors,
    rsc,
    resetRsc,
    backAndCancel,
    discardAndCheckSource,
  } = session;
  const name = page.getByRole("textbox", { name: /商家名称/ });
  await name.fill("商家草稿");
  await name.blur();
  await position(page, "sentinel");
  await scroll(page, 2000);
  for (let index = 0; index < 3; index++) await backAndCancel(2000);
  const row = await record("商家页连续后退取消：保留滚动、表单和路由实例");
  assert.equal(row.mounts, baseline.mounts);
  assert.equal(row.unmounts, baseline.unmounts);
  assert.equal(row.sameForm, true);
  assert.equal(row.length, baseline.length + 1);
  assert.equal(rsc.length, 0);
  if (edit) {
    await setValueWithoutScrolling(
      page.getByRole("textbox", { name: "别名", exact: true }),
      "别名草稿",
    );
    await browserBack(page);
    assert.equal(
      await page
        .getByRole("dialog", { name: "尚未保存" })
        .getByRole("button", { name: "保存并退出", exact: true })
        .count(),
      0,
    );
    await cancel(page);
    // 保存基本资料返回同页成功状态并触发真实 Next revalidation，别名继续保护。
    await page.getByRole("button", { name: "保存修改", exact: true }).click();
    await page
      .getByRole("status")
      .getByText("保存成功", { exact: true })
      .waitFor();
    await page.waitForLoadState("networkidle");
    await position(page, "sentinel");
    await page.getByRole("textbox", { name: "别名", exact: true }).blur();
    await scroll(page, 2000);
    // revalidation 会让可见 Link 重新预取，待滚动后的可见区域稳定再统计内部后退请求。
    await page.evaluate(
      () => new Promise((resolve) => requestIdleCallback(resolve)),
    );
    await page.waitForLoadState("networkidle");
    resetRsc();
    await backAndCancel(2000);
    const afterSave = await record(
      "部分保存并 revalidate 后，别名仍保护且不重挂载",
    );
    assert.equal(afterSave.mounts, baseline.mounts);
    assert.equal(afterSave.sameForm, true);
    assert.equal(afterSave.navigationRscRequests, 0);
    assert.equal(
      await page
        .getByRole("textbox", { name: "别名", exact: true })
        .inputValue(),
      "别名草稿",
    );
  }
  await discardAndCheckSource();
  await page
    .getByRole("link", { name: edit ? "编辑商家" : "新增商家", exact: true })
    .click();
  await page.locator(`#${formId}`).waitFor();
  await name.fill("失败商家");
  await page
    .getByRole("button", { name: edit ? "保存修改" : "保存商家", exact: true })
    .click();
  await page.getByText("验证用保存失败", { exact: true }).waitFor();
  await position(page, "sentinel");
  await record("商家真实 Server Action 失败后继续保护");
  await name.fill("成功商家");
  await page
    .getByRole("button", { name: edit ? "保存修改" : "保存商家", exact: true })
    .click();
  await page.waitForURL(`${sourceUrl}?saved=1`);
  await keepScroll(page, 0, "auto");
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await record("商家真实保存成功直接跳转，不弹离开确认");
  assert.deepEqual(errors, []);
  await page.close();
  return { records, errors };
}
function assertInternalRecord(row, baseline) {
  assert.equal(row.mounts, baseline.mounts);
  assert.equal(row.unmounts, baseline.unmounts);
  assert.equal(row.sameForm, true);
  assert.equal(row.length, baseline.length + 1);
  assert.equal(row.navigationRscRequests, 0);
}
async function finishSession(session) {
  assert.deepEqual(session.errors, []);
  await session.page.close();
  return { records: session.records, errors: session.errors };
}
async function checkStandard(browser, income = false) {
  const type = income ? "income" : "expense";
  const session = await newSession(
    browser,
    income ? "标准收入" : "标准支出",
    `new-${type}-transaction-form`,
  );
  const { page, baseline, record, backAndCancel } = session;
  const note = page.locator(
    `#new-${type}-transaction-form textarea[name="note"]`,
  );
  assert.equal(
    await page.evaluate(
      () => history.state?.kuranoteUnsavedChanges?.position ?? null,
    ),
    null,
  );
  await note.fill("标准页草稿");
  await note.blur();
  await position(page, "sentinel");
  await page.getByRole("button", { name: "转账", exact: true }).click();
  await position(page, "base");
  await page
    .locator('#new-transfer-transaction-form textarea[name="note"]')
    .fill("转账面板草稿");
  await position(page, "sentinel");
  await page.getByRole("button", { name: "收支", exact: true }).click();
  assert.equal(await note.inputValue(), "标准页草稿");
  await scroll(page, 2000);
  for (let index = 0; index < 3; index++) await backAndCancel(2000);
  assertInternalRecord(
    await record("标准页切换面板后三次取消，保持滚动、实例与单哨兵"),
    baseline,
  );
  await page.getByRole("button", { name: "切换方式" }).click();
  await page.getByRole("button", { name: "账户周转", exact: true }).click();
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await page.getByRole("button", { name: "放弃修改" }).click();
  await page.waitForURL(`${baseUrl}/transactions/new?method=transfer`);
  await page.locator("#new-transfer-transaction-form").waitFor();
  await browserBack(page);
  await page.waitForURL(sourceUrl);
  await page.getByRole("heading", { name: "离开守卫兼容性验证" }).waitFor();
  await keepScroll(page, 320, "auto");
  const row = await record("标准页放弃并切换方式后，后退一次回来源");
  assert.equal(row.currentIndex, baseline.currentIndex - 1);
  return finishSession(session);
}
async function closeAmountLayer(page, field) {
  await field.click();
  await page.getByLabel("金额计算器", { exact: true }).waitFor();
  const y = await page.evaluate(() => scrollY);
  await browserBack(page);
  await page
    .getByLabel("金额计算器", { exact: true })
    .waitFor({ state: "hidden" });
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await keepScroll(page, y);
}
async function checkNewForm(browser, account = false) {
  const formId = account
    ? "create-account-form"
    : "new-transfer-transaction-form";
  const session = await newSession(
    browser,
    account ? "新增账户" : "新增转账",
    formId,
  );
  const { page, baseline, record, backAndCancel, discardAndCheckSource } =
    session;
  const input = account
    ? page.getByRole("textbox", { name: /账户名称/ })
    : page.getByRole("textbox", { name: "备注（选填）" });
  await input.fill("新增表单草稿");
  await input.blur();
  await position(page, "sentinel");
  await closeAmountLayer(
    page,
    page.getByRole("textbox", {
      name: account ? "初始金额" : "金额",
      exact: true,
    }),
  );
  await scroll(page, 2000);
  for (let index = 0; index < 3; index++) await backAndCancel(2000);
  assertInternalRecord(
    await record("新增表单关闭键盘后三次取消，父草稿和历史不变"),
    baseline,
  );
  await discardAndCheckSource();
  return finishSession(session);
}
async function checkReceiptLayers(browser) {
  const session = await newSession(
    browser,
    "编辑小票",
    "edit-transaction-receipt-form",
  );
  const { page, baseline, record, discardAndCheckSource } = session;
  await page.getByRole("button", { name: "修改备注：编辑前备注" }).click();
  await page
    .getByRole("textbox", { name: "备注", exact: true })
    .fill("父小票草稿");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.getByRole("button", { name: /^修改商家：/ }).click();
  await page.getByRole("group", { name: "常用商家" }).waitFor();
  const y = await page.evaluate(() => scrollY);
  await browserBack(page);
  await page
    .getByRole("group", { name: "常用商家" })
    .waitFor({ state: "hidden" });
  await page.getByRole("link", { name: "关闭", exact: true }).waitFor();
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await keepScroll(page, y);
  assertInternalRecord(
    await record("编辑小票第一次后退只关闭商家抽屉，保留父草稿"),
    baseline,
  );
  await discardAndCheckSource();
  return finishSession(session);
}
async function checkCategory(browser) {
  const session = await newSession(browser, "分类管理", "category-page");
  const { page, baseline, record, backAndCancel } = session;
  await page.getByRole("button", { name: "编辑餐饮" }).click();
  const name = page.getByRole("textbox", { name: /分类名称/ });
  await name.fill("分类草稿");
  await position(page, "sentinel");
  await backAndCancel(await page.evaluate(() => scrollY));
  assert.equal(await name.inputValue(), "分类草稿");
  assertInternalRecord(
    await record("分类后退取消保留编辑层和父页面"),
    baseline,
  );
  await browserBack(page);
  await page.getByRole("button", { name: "放弃修改" }).click();
  await page
    .getByRole("dialog", { name: "编辑分类" })
    .waitFor({ state: "hidden" });
  await position(page, "base");
  await forwardPastInactiveSentinel(page);
  assert.equal(await page.getByRole("dialog", { name: "编辑分类" }).count(), 0);
  await record("分类放弃只关抽屉，前进不复活编辑层");
  await page.getByRole("button", { name: "编辑餐饮" }).click();
  const original = await name.inputValue();
  await name.fill("保存分类");
  await position(page, "sentinel");
  // 动过就算修改：改回原名后仍保护，后退仍需确认。
  await name.fill(original);
  await position(page, "sentinel");
  await backAndCancel(await page.evaluate(() => scrollY));
  assert.equal(await name.inputValue(), original);
  await record("分类改回原名后仍保护，继续编辑保留编辑层");
  await name.fill("保存分类");
  await page
    .getByRole("dialog", { name: "编辑分类" })
    .getByRole("button", { name: "保存", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "编辑分类" })
    .waitFor({ state: "hidden" });
  await position(page, "base");
  await record("真实分类保存成功关闭抽屉，保持页面");
  // 保存成功后清除「动过」，后退直接回来源，不再弹确认。
  await browserBack(page);
  await page.waitForURL(sourceUrl);
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await keepScroll(page, 320, "auto");
  await record("分类保存后后退一次回来源，不弹确认");
  return finishSession(session);
}
async function checkCategoryCreate(browser) {
  const session = await newSession(browser, "分类管理", "category-page");
  const { page, record } = session;
  const heading = page.getByRole("heading", { name: "新增分类" });
  await page.getByRole("button", { name: "新增分类" }).click();
  await position(page, "sentinel");
  const name = page.getByRole("textbox", { name: "分类名称" });
  await name.fill("创建草稿");
  await page.getByRole("combobox", { name: "上级分类" }).click();
  await browserBack(page);
  await page.getByRole("listbox").waitFor({ state: "hidden" });
  assert.equal(await name.inputValue(), "创建草稿");
  const length = await page.evaluate(() => history.length);
  await browserBack(page);
  await cancel(page);
  assert.equal(await name.inputValue(), "创建草稿");
  await browserBack(page);
  await page.getByRole("button", { name: "放弃修改" }).click();
  // 关闭动画期间旧对话框已 aria-hidden，按角色查找会提前判定为隐藏；须等它真正卸载再重新打开。
  await page
    .getByRole("heading", { name: "新增分类", includeHidden: true })
    .waitFor({ state: "detached" });
  await position(page, "base");
  await forwardPastInactiveSentinel(page);
  assert.equal(await heading.count(), 0);
  assert.equal(await page.evaluate(() => history.length), length);
  await record("新增分类：后退先关菜单，放弃只关闭新增，前进不复活弹层");
  await page.getByRole("button", { name: "新增分类" }).click();
  const returnLink = page.getByRole("link", {
    name: "返回设置",
    includeHidden: true,
  });
  await name.fill("失败的分类");
  await position(page, "sentinel");
  // 对话框遮住了页面链接，直接派发点击以验证守卫捕获的导航意图。
  await returnLink.dispatchEvent("click");
  await page.getByRole("button", { name: "保存并退出", exact: true }).click();
  await page.getByText("分类验证失败", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/category");
  await browserBack(page);
  await cancel(page);
  assert.equal(await name.inputValue(), "失败的分类");
  await record("新增分类：确认保存失败后留在原页并继续保护草稿");
  await name.fill("保存新增分类");
  await returnLink.dispatchEvent("click");
  await page.getByRole("button", { name: "保存并退出", exact: true }).click();
  await page.waitForURL("**/settings");
  await heading.waitFor({ state: "hidden" });
  await record("新增分类：确认保存成功后继续原导航");
  return finishSession(session);
}
async function checkLedgerSettings(browser) {
  const session = await newSession(browser, "账本设置", "ledger-settings-page");
  const { page, record, baseline } = session;
  const name = page.getByRole("textbox", { name: "账本名称" });
  await name.fill("保留账本草稿");
  await position(page, "sentinel");
  await page.getByRole("button", { name: /验证成员/ }).click();
  await page.getByRole("textbox", { name: "当前账本昵称" }).fill("已保存成员");
  const member = page.getByRole("dialog").filter({ hasText: "成员设置" });
  await member.getByRole("button", { name: "保存修改" }).click();
  await member.waitFor({ state: "hidden" });
  await position(page, "sentinel");
  await browserBack(page);
  await cancel(page);
  assert.equal(await name.inputValue(), "保留账本草稿");
  await record("成员保存触发 revalidatePath 后仍保护账本草稿");

  await page.getByRole("link", { name: "返回账本管理" }).click();
  await cancel(page);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "首页", exact: true })
    .click();
  await cancel(page);
  await dismissReloadPrompt(page);
  assert.equal(await name.inputValue(), "保留账本草稿");
  await record("账本设置：页面返回、底部导航和刷新均保护草稿");

  await name.fill("失败的账本名称");
  await page.getByRole("button", { name: "保存修改" }).click();
  await page.getByText("账本设置验证失败", { exact: true }).waitFor();
  await browserBack(page);
  await cancel(page);
  assert.equal(await name.inputValue(), "失败的账本名称");
  await record("账本设置保存失败后继续保护");

  await name.fill("保存账本名称");
  await browserBack(page);
  await page.getByRole("button", { name: "保存并退出", exact: true }).click();
  await page.waitForURL(sourceUrl);
  await page.getByRole("heading", { name: "离开守卫兼容性验证" }).waitFor();
  const returned = await record("账本设置确认保存后只返回来源一次");
  assert.equal(returned.currentIndex, baseline.currentIndex - 1);
  await page.goForward({ waitUntil: "commit" });
  await name.waitFor();
  assert.equal(await name.inputValue(), "验证账本");
  await forwardPastInactiveSentinel(page);
  const forwarded = await record(
    "账本设置确认保存后可正常前进，失效哨兵不恢复草稿",
  );
  assert.equal(forwarded.currentIndex, baseline.currentIndex);
  assert.equal(forwarded.length, returned.length);
  return finishSession(session);
}
async function checkLedgerSetup(browser) {
  const session = await newSession(
    browser,
    "账本创建向导",
    "ledger-setup-page",
  );
  const { page, baseline, record } = session;
  const resume = page.getByRole("button", {
    name: "继续创建家庭账本",
    exact: true,
  });
  await page.getByText("你还没有任何账本").waitFor();
  const wizard = page.getByRole("dialog", { name: "创建账本" });
  const close = wizard.getByRole("button", { name: "关闭创建账本向导" });
  const prompt = page.getByRole("dialog", { name: "尚未保存" });
  const save = prompt.getByRole("button", { name: "保存并退出" });
  const discard = prompt.getByRole("button", { name: "放弃修改" });
  const continueEditing = prompt.getByRole("button", { name: "继续编辑" });
  const bank = wizard.getByRole("checkbox", {
    name: "选择「银行卡」的全部账户",
  });
  const next = wizard.getByRole("button", { name: /^下一步/ });
  const previous = wizard.getByRole("button", { name: "上一步" });

  async function assertWizardClosed(label) {
    await wizard.waitFor({ state: "hidden" });
    await resume.waitFor();
    const result = await record(label);
    assert.equal(result.scrollRestoration, "auto");
    assert.equal(result.currentIndex, baseline.currentIndex);
    assert.equal(result.unmounts, baseline.unmounts);
    assert.equal(await prompt.count(), 0);
    return result;
  }

  await resume.click();
  await bank.waitFor();
  assert.equal(await bank.isChecked(), false);

  // 即使无修改也必须显示三个按钮和不提“尚未保存”的提示。
  await close.click();
  await prompt.waitFor();
  assert.deepEqual(await prompt.getByRole("button").allTextContents(), [
    "继续编辑",
    "放弃修改",
    "保存并退出",
  ]);
  await prompt.getByText("账本还没创建完，要保存当前进度再退出吗？").waitFor();
  await continueEditing.click();
  assert.equal(await bank.isChecked(), false);
  await record("向导：没有修改仍须确认，继续编辑保留当前输入");

  // 只换到商家步骤，不写库；主动退出时记录步骤。
  await next.click();
  await close.click();
  await save.click();
  await assertWizardClosed("向导：不修改内容，保存新步骤并退出");
  const feedback = page.getByText("保存成功", { exact: true });
  await feedback.waitFor();
  assert.equal(await feedback.count(), 1);
  await resume.click();
  await wizard.getByText("商家", { exact: true }).first().waitFor();
  await previous.click();
  await bank.waitFor();
  assert.equal(await bank.isChecked(), false);

  // 本地更改后跨步骤保留，但放弃修改应恢复上次已保存的快照。
  await bank.check();
  await next.click();
  await previous.click();
  assert.equal(await bank.isChecked(), true);
  await browserBack(page);
  await prompt.waitFor();
  await continueEditing.click();
  assert.equal(await bank.isChecked(), true);
  await record("向导：跨步草稿在后退确认后仍保留");

  await close.click();
  await discard.click();
  await assertWizardClosed("向导：放弃修改不改写服务器已保存草稿");
  await resume.click();
  // 上次明确保存的是商家步骤（3），回退查看银行卡仍未勾选。
  await previous.click();
  await bank.waitFor();
  assert.equal(await bank.isChecked(), false);

  // 再次通过后退触发没有修改时的退出确认。
  await position(page, "sentinel");
  await browserBack(page);
  await prompt.waitFor();
  await discard.click();
  await assertWizardClosed("向导：后退无修改也统一三按钮确认");

  const abandon = page.getByRole("button", {
    name: "放弃创建",
    exact: true,
  });
  await abandon.click();
  const danger = page.getByRole("dialog", {
    name: "放弃创建「家庭账本」？",
  });
  await danger.getByRole("button", { name: "取消" }).click();
  await resume.waitFor();
  await abandon.click();
  await danger.getByRole("button", { name: "放弃创建" }).click();
  await resume.waitFor({ state: "detached" });
  await record("账本管理：外层放弃创建仍需确认，实际删除创建中账本");

  await browserBack(page);
  await page.waitForURL(sourceUrl);
  await page
    .getByRole("heading", {
      name: "离开守卫兼容性验证",
    })
    .waitFor();
  const returned = await record("向导关闭后下一次后退正常返回来源页");
  assert.equal(returned.currentIndex, baseline.currentIndex - 1);
  return finishSession(session);
}

async function checkBalance(browser) {
  const session = await newSession(
    browser,
    "余额调整",
    "edit-balance-adjustment-form",
  );
  const { page, baseline, record, backAndCancel, discardAndCheckSource } =
    session;
  await page
    .getByRole("textbox", { name: "备注（选填）" })
    .fill("余额调整草稿");
  await page.getByRole("button", { name: "选择记账时间" }).click();
  await browserBack(page);
  await page.getByRole("textbox", { name: "备注（选填）" }).waitFor();
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await scroll(page, 2000);
  await backAndCancel(2000);
  assertInternalRecord(
    await record("余额调整先关时间层，再确认页面且保留草稿"),
    baseline,
  );
  await discardAndCheckSource();
  return finishSession(session);
}
async function checkAliasSave(browser, viaLink = false) {
  const session = await newSession(browser, "编辑商家", "merchant-alias-form");
  const { page, baseline, record } = session;
  await page
    .getByRole("textbox", { name: "别名", exact: true })
    .fill("单独别名草稿");
  await position(page, "sentinel");
  if (viaLink) await page.getByRole("link", { name: "返回商家管理" }).click();
  else await browserBack(page);
  await page
    .getByRole("dialog", { name: "尚未保存" })
    .getByRole("button", { name: "保存并退出", exact: true })
    .click();
  await page.waitForURL(viaLink ? `${baseUrl}/merchants` : sourceUrl);
  await page.getByRole("heading", { name: "离开守卫兼容性验证" }).waitFor();
  const row = await record("别名保存成功后继续原离开意图");
  assert.equal(
    row.currentIndex,
    viaLink ? baseline.currentIndex + 1 : baseline.currentIndex - 1,
  );
  assert.equal(row.length, baseline.length + 1);
  return finishSession(session);
}
// 不动不弹：进入后只聚焦、失焦而不修改，不压入哨兵，浏览器后退直接回来源。
async function leaveUntouched(session, label) {
  const { page, baseline, record } = session;
  const untouched = await record(`${label}：未修改时不压入哨兵`);
  assert.equal(untouched.marker, null);
  assert.equal(untouched.length, baseline.length);
  await browserBack(page);
  await page.waitForURL(sourceUrl);
  await page.getByRole("heading", { name: "离开守卫兼容性验证" }).waitFor();
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await keepScroll(page, 320, "auto");
  const row = await record(`${label}：未修改直接后退回来源，不弹确认`);
  assert.equal(row.currentIndex, baseline.currentIndex - 1);
  return finishSession(session);
}
async function checkUntouched(browser) {
  const pages = [
    ["编辑账户", "edit-account-form"],
    ["编辑小票", "edit-transaction-receipt-form"],
    ["编辑转账", "edit-transfer-transaction-form"],
    ["新增商家", "create-merchant-form"],
    ["编辑商家", "merchant-edit-form"],
    ["标准支出", "new-expense-transaction-form"],
    ["新增转账", "new-transfer-transaction-form"],
    ["新增账户", "create-account-form"],
    ["余额调整", "edit-balance-adjustment-form"],
    ["账本设置", "ledger-settings-page"],
  ];
  const result = {};
  for (const [link, formId] of pages) {
    const session = await newSession(browser, link, formId);
    const field = session.page
      .locator(`#${formId}`)
      .locator('input:not([type="hidden"]):not([readonly]), textarea')
      .first();
    if (await field.count()) {
      await field.focus();
      await field.blur();
    }
    result[link] = await leaveUntouched(session, link);
  }
  return result;
}
// 新增记账全屏流程不显示底部导航，单独验证：只选择商家进入小票不算修改。
async function checkNewReceiptMerchantOnly(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(sourceUrl);
  await scroll(page, 320);
  await page.getByRole("link", { name: "新增记账", exact: true }).click();
  await page.getByRole("button", { name: "7-Eleven", exact: true }).click();
  await page.getByRole("button", { name: "保存记账", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  assert.equal(
    await page.evaluate(
      () => history.state?.kuranoteUnsavedChanges?.position ?? null,
    ),
    null,
  );
  await browserBack(page);
  await page.waitForURL(sourceUrl);
  await page.getByRole("heading", { name: "离开守卫兼容性验证" }).waitFor();
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);
  await keepScroll(page, 320, "auto");
  assert.deepEqual(errors, []);
  await page.close();
  return { errors };
}
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
try {
  const cases = {
    account: () => checkAccount(browser),
    receipt: () => checkOtherPage(browser, "receipt"),
    receiptSaveAndLeave: () => checkReceiptSave(browser, "link"),
    receiptDirectSave: () => checkReceiptSave(browser, "direct"),
    receiptSaveFailure: () => checkReceiptSave(browser, "failure"),
    receiptSaveBack: () => checkReceiptSave(browser, "back"),
    receiptSaveClose: () => checkReceiptSave(browser, "close"),
    transfer: () => checkOtherPage(browser, "transfer"),
    merchantCreate: () => checkMerchant(browser, false),
    merchantEdit: () => checkMerchant(browser, true),
    standard: () => checkStandard(browser),
    standardIncome: () => checkStandard(browser, true),
    newTransfer: () => checkNewForm(browser),
    newAccount: () => checkNewForm(browser, true),
    receiptLayers: () => checkReceiptLayers(browser),
    category: () => checkCategory(browser),
    categoryCreate: () => checkCategoryCreate(browser),
    ledgerSettings: () => checkLedgerSettings(browser),
    ledgerSetup: () => checkLedgerSetup(browser),
    balance: () => checkBalance(browser),
    aliasBack: () => checkAliasSave(browser),
    aliasLink: () => checkAliasSave(browser, true),
    untouched: () => checkUntouched(browser),
    newReceiptMerchantOnly: () => checkNewReceiptMerchantOnly(browser),
  };
  const result = { baseUrl };
  for (const name of process.env.UNSAVED_GUARD_CASES?.split(",") ??
    Object.keys(cases)) {
    if (!cases[name]) throw new Error(`未知验证组：${name}`);
    result[name] = await cases[name]();
  }
  await fs.writeFile(
    path.join(output, "compatibility.json"),
    JSON.stringify(result, null, 2),
  );
} finally {
  await browser.close();
}
