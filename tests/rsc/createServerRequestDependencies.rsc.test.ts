// @vitest-environment node

import { spawn, type ChildProcess } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const nextCliPath = join(repositoryRoot, "node_modules/next/dist/bin/next");
const productionModulePath = join(
  repositoryRoot,
  "src/server/shared/context/createServerRequestDependencies.ts",
);
const fixtureTsconfig = {
  compilerOptions: {
    target: "ES2017",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
  },
  include: [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
  ],
  exclude: ["node_modules"],
};

let baseUrl = "";
let firstRenderMarkup = "";
let fixtureDirectory = "";
let nextProcess: ChildProcess | undefined;
let processLogs = "";

function appendProcessLog(chunk: Buffer): void {
  processLogs = `${processLogs}${chunk.toString("utf8")}`.slice(-20_000);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function findAvailablePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (address === null || typeof address === "string") {
        server.close();
        reject(new Error("无法取得 RSC 测试服务器端口。"));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

async function createFixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "kuranote-rsc-cache-"));
  const appDirectory = join(directory, "app");
  const productionModuleSource = await readFile(productionModulePath, "utf8");
  const requestDependenciesImport =
    '"server/shared/context/requestDependencies"';

  if (!productionModuleSource.includes(requestDependenciesImport)) {
    throw new Error(
      "生产模块的 Request Dependencies import 与测试夹具不一致。",
    );
  }

  const fixtureModuleSource = productionModuleSource.replace(
    requestDependenciesImport,
    '"./requestDependenciesMock"',
  );

  await mkdir(appDirectory, { recursive: true });
  await symlink(
    join(repositoryRoot, "node_modules"),
    join(directory, "node_modules"),
    "junction",
  );

  await Promise.all([
    writeFile(
      join(directory, "package.json"),
      `${JSON.stringify({ private: true }, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      join(directory, "tsconfig.json"),
      `${JSON.stringify(fixtureTsconfig, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      join(directory, "createServerRequestDependencies.ts"),
      fixtureModuleSource,
      "utf8",
    ),
    writeFile(
      join(directory, "requestDependenciesMock.ts"),
      `export type RequestDependencies = { requestId: string };\n\nlet creationCount = 0;\n\nexport async function createRequestDependencies(): Promise<RequestDependencies> {\n  creationCount += 1;\n  return { requestId: \`fixture-request-\${creationCount}\` };\n}\n`,
      "utf8",
    ),
    writeFile(
      join(appDirectory, "layout.tsx"),
      `import type { ReactNode } from "react";\n\nimport { createServerRequestDependencies } from "../createServerRequestDependencies";\n\nexport default async function RootLayout({ children }: { children: ReactNode }) {\n  const dependencies = await createServerRequestDependencies();\n\n  return (\n    <html lang="zh-CN">\n      <body data-layout-request-id={dependencies.requestId}>{children}</body>\n    </html>\n  );\n}\n`,
      "utf8",
    ),
    writeFile(
      join(appDirectory, "page.tsx"),
      `import { createServerRequestDependencies } from "../createServerRequestDependencies";\n\nexport const dynamic = "force-dynamic";\n\nasync function NestedServerComponent() {\n  const dependencies = await createServerRequestDependencies();\n\n  return (\n    <span data-nested-request-id={dependencies.requestId}>\n      Nested RSC cache render fixture\n    </span>\n  );\n}\n\nexport default async function Page() {\n  const first = await createServerRequestDependencies();\n  const second = await createServerRequestDependencies();\n\n  return (\n    <main\n      data-page-first-request-id={first.requestId}\n      data-page-same-instance={first === second}\n      data-page-second-request-id={second.requestId}\n    >\n      RSC cache render fixture\n      <NestedServerComponent />\n    </main>\n  );\n}\n`,
      "utf8",
    ),
  ]);

  return directory;
}

async function waitForFirstRender(): Promise<string> {
  const deadline = Date.now() + 90_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (nextProcess?.exitCode !== null && nextProcess?.exitCode !== undefined) {
      throw new Error(
        `RSC 测试服务器提前退出。\n${processLogs || "没有进程日志。"}`,
      );
    }

    try {
      const response = await fetch(baseUrl, {
        cache: "no-store",
        headers: { Accept: "text/html" },
      });

      if (response.ok) {
        return await response.text();
      }

      lastError = new Error(
        `RSC 测试页面返回 ${response.status}: ${await response.text()}`,
      );
    } catch (error) {
      lastError = error;
    }

    await sleep(250);
  }

  throw new Error(
    `等待 RSC 测试页面超时：${String(lastError)}\n${processLogs}`,
  );
}

async function stopNextProcess(): Promise<void> {
  const child = nextProcess;

  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  await new Promise<void>((resolve) => {
    const forceKillTimer = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
      resolve();
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(forceKillTimer);
      resolve();
    });
  });
}

function readDataAttribute(markup: string, attribute: string): string {
  const match = markup.match(new RegExp(`${attribute}="([^"]+)"`));

  expect(match, `未找到 ${attribute} 属性。`).not.toBeNull();
  return match?.[1] ?? "";
}

function expectSingleRequestDependencies(markup: string): string {
  const pageRequestId = readDataAttribute(markup, "data-page-first-request-id");

  expect(readDataAttribute(markup, "data-page-same-instance")).toBe("true");
  expect(readDataAttribute(markup, "data-page-second-request-id")).toBe(
    pageRequestId,
  );
  expect(readDataAttribute(markup, "data-layout-request-id")).toBe(
    pageRequestId,
  );
  expect(readDataAttribute(markup, "data-nested-request-id")).toBe(
    pageRequestId,
  );

  return pageRequestId;
}

beforeAll(async () => {
  fixtureDirectory = await createFixture();
  const port = await findAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;

  nextProcess = spawn(
    process.execPath,
    [
      nextCliPath,
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: fixtureDirectory,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  nextProcess.stdout?.on("data", appendProcessLog);
  nextProcess.stderr?.on("data", appendProcessLog);
  nextProcess.on("error", (error) => {
    appendProcessLog(Buffer.from(error.stack ?? error.message));
  });

  firstRenderMarkup = await waitForFirstRender();
}, 120_000);

afterAll(async () => {
  await stopNextProcess();

  if (fixtureDirectory) {
    // node_modules 是指向仓库依赖目录的符号链接；fs.rm 只删除链接本身，不会进入真实目录。
    await rm(fixtureDirectory, { force: true, recursive: true });
  }
}, 15_000);

describe("createServerRequestDependencies RSC render", () => {
  it("同一 SSR 请求内跨组件去重，并在下一次请求重新创建依赖", async () => {
    const firstRequestId = expectSingleRequestDependencies(firstRenderMarkup);

    const secondResponse = await fetch(`${baseUrl}/?request=second`, {
      cache: "no-store",
      headers: { Accept: "text/html" },
    });
    const secondRenderMarkup = await secondResponse.text();

    expect(secondResponse.status).toBe(200);
    expect(expectSingleRequestDependencies(secondRenderMarkup)).not.toBe(
      firstRequestId,
    );
  }, 30_000);
});
