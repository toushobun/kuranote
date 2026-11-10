import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// findBy* / waitFor 默认只等 1000ms，全并发时渲染变慢会误判「找不到元素」。
// 与 vitest.config 的 testTimeout 一起放宽，只影响等待上限，不拖慢正常通过的测试。
configure({ asyncUtilTimeout: 10_000 });

afterEach(() => {
  cleanup();
});
