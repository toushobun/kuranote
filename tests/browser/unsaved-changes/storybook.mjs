import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:6006";
const output = process.env.UNSAVED_GUARD_OUTPUT ?? ".next/976-evidence";
const cases = [
  {
    id: "templates-accounts-accountedittemplate--default",
    name: "账户",
    change: async (page) => page.getByLabel(/账户名称/).fill("修改后的账户"),
  },
  {
    id: "templates-transactions-edittransactionreceipt--default",
    name: "小票",
    change: async (page) => {
      await page.getByRole("button", { name: /^修改备注：/ }).click();
      await page
        .getByRole("textbox", { name: "备注", exact: true })
        .fill("修改后的备注");
      await page.getByRole("button", { name: "完成", exact: true }).click();
    },
  },
  {
    id: "templates-transactions-transactionformpage--edit-transfer",
    name: "转账",
    change: async (page) =>
      page.getByRole("textbox", { name: "备注（选填）" }).fill("修改后的转账"),
  },
];

await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const story of cases) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    page.setDefaultTimeout(15000);
    await page.goto(`${baseUrl}/iframe.html?id=${story.id}&viewMode=story`);
    await story.change(page);
    await page.waitForFunction(
      () => history.state?.kuranoteUnsavedChanges?.position === "sentinel",
    );
    const historyLength = await page.evaluate(() => history.length);
    await page.goBack({ waitUntil: "commit" });
    const dialog = page.getByRole("dialog", { name: "尚未保存" });
    await dialog.waitFor();
    assert.equal(
      await dialog.evaluate((node) =>
        Boolean(
          node.closest(".MuiDialog-root")?.parentElement === document.body,
        ),
      ),
      true,
    );
    await page.screenshot({
      path: path.join(output, `storybook-${story.name}.png`),
      animations: "disabled",
    });
    await page.getByRole("button", { name: "继续编辑" }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => history.length), historyLength);
    await page
      .getByRole("link", {
        name: story.name === "账户" ? "取消" : "关闭",
        exact: true,
      })
      .click();
    await dialog.waitFor();
    await page.getByRole("button", { name: "继续编辑" }).click();
    console.log(
      `${story.name}：浏览器后退、继续编辑、页内链接、body Portal 通过；history.length=${historyLength}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
