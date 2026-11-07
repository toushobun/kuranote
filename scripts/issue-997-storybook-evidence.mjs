import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const origin = "http://127.0.0.1:6006";
const folder = "/tmp/997-shots";
const cases = [
  {
    id: "organisms-ledgers-ledgersetupwizard--close-confirm",
    label: "无修改 · 保存当前进度",
    file: "997-clean.png",
  },
  {
    id: "organisms-ledgers-ledgersetupwizard--close-confirm-with-changes",
    label: "有修改 · 三按钮确认",
    file: "997-dirty.png",
  },
  {
    id: "organisms-ledgers-ledgersetupwizard--save-failure",
    label: "保存失败 · 草稿保留",
    file: "997-error.png",
  },
];

await mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chromium",
  headless: true,
});

try {
  for (const story of cases) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    page.on("pageerror", (error) => console.log("Story page error:", error.message));
    await page.goto(
      `${origin}/iframe.html?id=${story.id}&viewMode=story`,
      { waitUntil: "domcontentloaded" },
    );
    if (story.file === "997-error.png") {
      await page.getByText("保存失败，请稍后再试。当前草稿仍留在此页面。")
        .waitFor({ timeout: 45000 });
    } else {
      await page.getByRole("dialog", { name: "尚未保存" })
        .waitFor({ timeout: 45000 });
    }
    await page.screenshot({
      path: `${folder}/${story.file}`,
      animations: "disabled",
    });
    console.log("Captured", story.file);
    await page.close();
  }
} finally {
  await browser.close();
}

const panelWidth = 390;
const panelHeight = 844;
const top = 56;
const margin = 20;
const gap = 18;
const montageWidth = margin * 2 + cases.length * panelWidth + (cases.length - 1) * gap;
const montageHeight = top + panelHeight + margin;
const overlays = [];
for (let i = 0; i < cases.length; i++) {
  const x = margin + i * (panelWidth + gap);
  const image = await sharp(`${folder}/${cases[i].file}`).png().toBuffer();
  overlays.push({ input: image, left: x, top });
  const titleSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="50">
      <text x="8" y="34" font-family="sans-serif" font-size="18" font-weight="600"
        fill="#513923">${cases[i].label}</text>
    </svg>`,
  );
  overlays.push({ input: titleSvg, left: x, top: 0 });
}
await sharp({
  create: {
    width: montageWidth,
    height: montageHeight,
    channels: 4,
    background: "#FDF8F0",
  },
})
  .composite(overlays)
  .png()
  .toFile(`${folder}/997-exit-confirmations.png`);
console.log("Montage ready");
