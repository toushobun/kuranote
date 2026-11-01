import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

// 先启动本目录的 Next 应用，再执行本脚本；复用环境中的 Playwright，不新增项目依赖。
const baseUrl = process.argv[2] ?? "http://localhost:3097";
const output = path.resolve(
  process.env.UNSAVED_GUARD_OUTPUT ?? ".next/976-evidence",
);

async function check(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  const cdp = await page.context().newCDPSession(page);
  const rsc = [];
  const errors = [];
  page.on("request", (request) => {
    if (request.headers().rsc === "1" || request.url().includes("_rsc="))
      rsc.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const records = [];
  await page.addInitScript(() => {
    window.probePops = [];
    addEventListener(
      "popstate",
      () =>
        window.probePops.push({
          href: location.href,
          marker: history.state?.kuranoteUnsavedChanges,
        }),
      true,
    );
  });
  async function record(step) {
    const navigation = await cdp.send("Page.getNavigationHistory");
    const state = await page.evaluate(() => ({
      mounts: window.probeMounts ?? 0,
      unmounts: window.probeUnmounts ?? 0,
      length: history.length,
      marker: history.state?.kuranoteUnsavedChanges?.position ?? null,
      sameInput:
        window.probeInput === document.querySelector('input[name="name"]'),
      value: document.querySelector('input[name="name"]')?.value,
    }));
    records.push({
      step,
      ...state,
      rscRequests: rsc.length,
      currentIndex: navigation.currentIndex,
    });
    console.log(JSON.stringify(records.at(-1)));
  }
  async function waitForPosition(position) {
    await page.waitForFunction(
      (expected) =>
        history.state?.kuranoteUnsavedChanges?.position === expected,
      position,
    );
  }
  async function backAndCancel() {
    await page.evaluate(() => history.back());
    await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
    await waitForPosition("sentinel");
    await page.getByRole("button", { name: "继续编辑" }).click();
    await page
      .getByRole("dialog", { name: "尚未保存" })
      .waitFor({ state: "hidden" });
  }

  await page.goto(baseUrl);
  await page.getByRole("link", { name: "编辑账户", exact: true }).click();
  const name = page.getByLabel(/账户名称/);
  await name.waitFor();
  await page.evaluate(() => {
    window.probeInput = document.querySelector('input[name="name"]');
  });
  rsc.length = 0;
  await record("进入真实 AccountEdit");
  const initial = await name.inputValue();
  await name.fill("未保存账户");
  await waitForPosition("sentinel");
  await record("修改后添加哨兵");
  for (let i = 0; i < 3; i++) await backAndCancel();
  await record("后退并继续编辑 3 次");
  const baseline = records[0];
  const restored = records.at(-1);
  assert.equal(restored.mounts, baseline.mounts);
  assert.equal(restored.unmounts, baseline.unmounts);
  assert.equal(restored.rscRequests, 0);
  assert.equal(restored.sameInput, true);
  assert.equal(restored.value, "未保存账户");
  assert.equal(restored.length, baseline.length + 1);

  let unloadPrompt = false;
  page.once("dialog", async (dialog) => {
    assert.equal(dialog.type(), "beforeunload");
    unloadPrompt = true;
    await dialog.dismiss();
  });
  await page.reload().catch(() => {});
  assert.equal(unloadPrompt, true);
  assert.equal(await name.inputValue(), "未保存账户");
  await record("刷新原生确认选择留在页面");

  await page.evaluate(() => {
    history.back();
    history.back();
  });
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await page.getByRole("button", { name: "继续编辑" }).click();
  await record("连续后退两次后继续编辑");
  assert.equal(await name.inputValue(), "未保存账户");

  await page.getByRole("link", { name: "验证用底部导航" }).click();
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await page.screenshot({ path: path.join(output, "account-confirm.png") });
  await page.getByRole("button", { name: "继续编辑" }).click();
  await name.fill(initial);
  await waitForPosition("base");
  await record("改回原值清理哨兵");
  const popCount = await page.evaluate(() => window.probePops.length);
  await page.evaluate(() => history.forward());
  await page.waitForFunction(
    (before) => window.probePops.length >= before + 2,
    popCount,
  );
  await waitForPosition("base");
  await record("前进进入失效哨兵后返回基准");
  await page
    .getByRole("dialog", { name: "尚未保存" })
    .waitFor({ state: "hidden" });

  await name.fill("再次修改");
  await waitForPosition("sentinel");
  await record("再次修改复用哨兵");
  assert.equal(records.at(-1).length, restored.length);
  await page.evaluate(() => history.back());
  await page.getByRole("button", { name: "放弃修改" }).click();
  await page.waitForURL(baseUrl + "/");
  await record("放弃后回到来源页");

  await page.evaluate(() => history.forward());
  await name.waitFor();
  assert.equal(await name.inputValue(), initial);
  await record("前进重新进入 B，使用初始数据");
  const forwardPopCount = await page.evaluate(() => window.probePops.length);
  await page.evaluate(() => history.forward());
  await page.waitForFunction(
    (before) => window.probePops.length >= before + 2,
    forwardPopCount,
  );
  await waitForPosition("base");
  await page
    .getByRole("dialog", { name: "尚未保存" })
    .waitFor({ state: "hidden" });
  assert.equal(await name.inputValue(), initial);
  await record("再次前进到旧哨兵，自动回基准且不复活草稿");
  await page.evaluate(() => history.back());
  await page.waitForURL(baseUrl + "/");

  for (let i = 0; i < 3; i++) {
    await page.getByRole("link", { name: "编辑账户", exact: true }).click();
    await name.fill("重复进入");
    await waitForPosition("sentinel");
    await record(`重复进入并修改 ${i + 1}`);
    assert.equal(records.at(-1).length, restored.length);
    await page.evaluate(() => history.back());
    await page.getByRole("button", { name: "放弃修改" }).click();
    await page.waitForURL(baseUrl + "/");
  }

  await page.getByRole("link", { name: "编辑账户", exact: true }).click();
  await name.fill("保存失败");
  await page.getByRole("button", { name: "保存修改" }).click();
  await page.getByText("验证用保存失败", { exact: true }).waitFor();
  await waitForPosition("sentinel");
  await record("真实 Server Action 失败后恢复保护");
  // 失败反馈会自动关闭，等待返回表单后再继续。
  await name.fill("保存成功");
  await page.getByRole("button", { name: "保存修改" }).click();
  await page.waitForURL(baseUrl + "/?saved=1");
  await record("真实 Server Action 成功跳转");
  assert.equal(await page.getByRole("dialog", { name: "尚未保存" }).count(), 0);

  await page.getByRole("link", { name: "编辑账户", exact: true }).click();
  await name.waitFor();
  assert.equal(await name.inputValue(), initial);
  await record("成功保存后再次进入，无修改不回退也不确认");
  await page.getByRole("link", { name: "验证用底部导航" }).click();
  await page.waitForURL(baseUrl + "/");
  await page.getByRole("link", { name: "编辑小票", exact: true }).click();
  await page.getByRole("button", { name: "修改备注：编辑前备注" }).click();
  await page
    .getByRole("textbox", { name: "备注", exact: true })
    .fill("修改后的小票备注");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await waitForPosition("sentinel");
  await page.evaluate(() => history.back());
  await page.getByRole("dialog", { name: "尚未保存" }).waitFor();
  await page.screenshot({ path: path.join(output, "receipt-confirm.png") });
  await page.getByRole("button", { name: "继续编辑" }).click();
  await page
    .getByRole("button", { name: "修改备注：修改后的小票备注" })
    .waitFor();

  await fs.writeFile(
    path.join(output, "compatibility.json"),
    JSON.stringify({ baseUrl, records, errors }, null, 2),
  );
  console.log(JSON.stringify({ records, errors }, null, 2));
  assert.deepEqual(errors, []);
  await page.close();
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    await check(browser);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
