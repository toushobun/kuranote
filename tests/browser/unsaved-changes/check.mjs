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
async function browserBack(page) {
  await page.goBack({ waitUntil: "commit" });
}
async function newSession(browser, link, formId) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  const cdp = await page.context().newCDPSession(page);
  const rsc = [];
  const errors = [];
  const records = [];
  page.on("request", (request) => {
    if (request.headers().rsc === "1" || request.url().includes("_rsc="))
      rsc.push(request.url());
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
  await page.waitForLoadState("networkidle");
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
  rsc.length = 0;
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

  let nativePrompt = false;
  page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "beforeunload");
    nativePrompt = true;
    await dialog.dismiss();
  });
  await page.reload().catch(() => {});
  assert.equal(nativePrompt, true);
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
  await setValueWithoutScrolling(name, initial);
  await position(page, "base");
  await keepScroll(page, 2000, "auto");
  await record("长页下方改回原值，scrollY 保持 2000");
  let pops = await page.evaluate(() => window.probePops.length);
  await page.goForward({ waitUntil: "commit" });
  await page.waitForFunction(
    (before) => window.probePops.length >= before + 2,
    pops,
  );
  await position(page, "base");
  await keepScroll(page, 2000, "auto");
  await record("前进到失效哨兵后回基准，scrollY 保持 2000");
  await setValueWithoutScrolling(name, "再次修改");
  await position(page, "sentinel");
  await keepScroll(page, 2000);
  await record("重新修改复用哨兵，scrollY 保持 2000");
  assert.equal(rsc.length, 0);
  await discardAndCheckSource();

  await page.goForward({ waitUntil: "commit" });
  await name.waitFor();
  await page.waitForLoadState("networkidle");
  assert.equal(await name.inputValue(), initial);
  const forwardY = await page.evaluate(() => scrollY);
  await record("正常前进重入 B，表单为初始数据");
  pops = await page.evaluate(() => window.probePops.length);
  await page.goForward({ waitUntil: "commit" });
  await page.waitForFunction(
    (before) => window.probePops.length >= before + 2,
    pops,
  );
  await position(page, "base");
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
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByText("验证用保存失败", { exact: true }).waitFor();
  await position(page, "sentinel");
  await keepScroll(page, 2000);
  await record("真实保存失败后恢复保护，保存前清理不改变滚动位置");
  await setValueWithoutScrolling(name, "保存成功");
  await browserBack(page);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.waitForURL(`${sourceUrl}?saved=1`);
  await keepScroll(page, 0, "auto");
  await record("真实保存成功跳转，AppShell 普通导航回到顶部");
  assert.deepEqual(errors, []);
  await page.close();
  return { records, errors };
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
    await page.getByRole("button", { name: "修改备注：编辑前备注" }).click();
    await page
      .getByRole("textbox", { name: "备注", exact: true })
      .fill("修改后的小票备注");
    await page.getByRole("button", { name: "完成", exact: true }).click();
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
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
try {
  const account = await checkAccount(browser);
  const receipt = await checkOtherPage(browser, "receipt");
  const transfer = await checkOtherPage(browser, "transfer");
  await fs.writeFile(
    path.join(output, "compatibility.json"),
    JSON.stringify({ baseUrl, account, receipt, transfer }, null, 2),
  );
} finally {
  await browser.close();
}
