import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// 按 hunk 顺序配对删除的中文字面量与新增引用，读取真实定义逐字核对。
const base = process.argv[2] ?? "origin/main";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const cache = new Map();
function loadConstants(name) {
  assert.match(
    name,
    /^internal\/(shared|account|statistics|user|merchant|transaction)(\/errors.*)?$/,
  );
  if (cache.has(name)) return cache.get(name);
  const file = `src/${name}${name === "internal/shared" ? "/index" : ""}.ts`;
  const source = readFileSync(file, "utf8");
  const exports = {};
  cache.set(name, exports);
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      require: (dependency) =>
        loadConstants(
          dependency === "./errors/sharedErrorMessages"
            ? "internal/shared/errors/sharedErrorMessages"
            : dependency,
        ),
    },
    { filename: file },
  );
  return exports;
}
const constants = Object.assign(
  {},
  ...[
    "shared/errors/sharedErrorMessages",
    "account/errors",
    "statistics/errors",
    "user/errors",
    "merchant/errors",
    "transaction/errors",
  ].map((name) => loadConstants(`internal/${name}`)),
);
const diff = git("diff", "--unified=3", base, "--", "src");
let file;
let hunk;
let removed = [];
let added = [];
let pairs = 0;
let hunks = 0;
const counts = new Map();
function checkHunk() {
  if (!hunk) return;
  const literals = [...removed.join("\n").matchAll(/"(?:[^"\\]|\\.)*"/g)]
    .map(([text]) => JSON.parse(text))
    .filter((text) => /[\u3400-\u9fff]/u.test(text));
  if (!literals.length) return;
  const refs = [
    ...added.join("\n").matchAll(/\b\w+ErrorMessages(?:\.\w+|\[[^\]]+\])/g),
  ].map(([ref]) => ref);
  assert.equal(refs.length, literals.length, `${file} ${hunk} 配对数量不一致`);
  literals.forEach((literal, index) => {
    const value = vm.runInNewContext(refs[index], constants);
    assert.equal(value, literal, `${file} ${hunk} ${refs[index]} 文字改变`);
    pairs++;
  });
  hunks++;
  counts.set(file, (counts.get(file) ?? 0) + literals.length);
}
for (const line of diff.split("\n")) {
  if (line.startsWith("diff --git ") || line.startsWith("@@")) {
    checkHunk();
    removed = [];
    added = [];
    hunk = line.startsWith("@@") ? line : undefined;
    if (!hunk) file = line.split(" b/")[1];
  } else if (hunk && line.startsWith("-")) removed.push(line.slice(1));
  else if (hunk && line.startsWith("+")) added.push(line.slice(1));
}
checkHunk();
for (const [path, count] of counts) console.log(`通过 ${count} 对：${path}`);
console.log(
  `逐 hunk 核对：${hunks} 个 hunk，${pairs} 对，文字差异 0，未配对 0。`,
);

// AST 扫描全部中文字面量；排除项逐项白名单，不靠句末标点猜测错误文字。
const exclusions = new Map(
  Object.entries({
    "account/entity/accountType.ts": [
      "现金",
      "银行卡",
      "信用卡",
      "电子钱包",
      "其他",
    ],
    "account/util/accountView.ts": ["待邀请成员"],
    "account/router.ts": ["读取成功", "创建成功", "更新成功", "删除成功"],
    "statistics/router.ts": ["Dashboard 数据", "月度统计数据"],
    "statistics/service/read/statisticsView.ts": ["未指定商家"],
    "user/router.ts": ["读取成功", "更新成功"],
    "user/adapter/next/actions.ts": [
      "收支配色方案已保存。",
      "昵称已保存。",
      "头像已更换。",
    ],
    "shared/http/openApiErrorResponses.ts": [
      "请求无效",
      "未登录",
      "无权限",
      "资源不存在",
      "资源冲突",
      "请求过于频繁",
      "服务异常",
    ],
  }),
);
const files = [
  ...new Set(
    git("ls-files", "--cached", "--others", "--exclude-standard")
      .trim()
      .split("\n"),
  ),
];
const authLocations = [];
let excluded = 0;
let remaining = 0;
for (const path of files) {
  if (
    !/\.[cm]?[jt]sx?$/.test(path) ||
    /\.(test|spec)\./.test(path) ||
    /(^|\/)(tests|test|__tests__)\//.test(path)
  )
    continue;
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const scoped =
    path.match(/^src\/internal\/(account|statistics|user|shared)\//) &&
    !/\/errors(?:\/|\.ts$)/.test(path);
  function visit(node) {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      const line =
        source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      if (node.text === constants.sharedErrorMessages.authRequired)
        authLocations.push(`${path}:${line}`);
      if (scoped && /[\u3400-\u9fff]/u.test(node.text)) {
        const relative = path.replace("src/internal/", "");
        const allowed = exclusions.get(relative)?.includes(node.text);
        console.log(
          `${allowed ? "排除" : "残留"} ${path}:${line} ${node.text}`,
        );
        if (allowed) excluded++;
        else remaining++;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
assert.equal(remaining, 0, "发现未归类的中文字面量");
assert.equal(authLocations.length, 1, "登录提示必须仅有一个非测试定义");
assert.ok(
  authLocations[0].startsWith(
    "src/internal/shared/errors/sharedErrorMessages.ts:",
  ),
);
console.log(
  `四模块非测试、非 errors：剩余错误文字 ${remaining} 处；排除展示/成功提示/OpenAPI 说明 ${excluded} 处；注释由 AST 自动排除。`,
);
console.log(
  `全仓库非测试代码登录提示：${authLocations.length} 处（${authLocations[0]}）。`,
);
