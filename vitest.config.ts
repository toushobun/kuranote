import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      atoms: new URL("./src/components/atoms", import.meta.url).pathname,
      config: new URL("./src/config", import.meta.url).pathname,
      lib: new URL("./src/lib", import.meta.url).pathname,
      molecules: new URL("./src/components/molecules", import.meta.url)
        .pathname,
      organisms: new URL("./src/components/organisms", import.meta.url)
        .pathname,
      providers: new URL("./src/components/providers", import.meta.url)
        .pathname,
      server: new URL("./src/server", import.meta.url).pathname,
      templates: new URL("./src/components/templates", import.meta.url)
        .pathname,
      test: new URL("./src/test", import.meta.url).pathname,
      theme: new URL("./src/theme", import.meta.url).pathname,
      types: new URL("./src/types", import.meta.url).pathname,
      utils: new URL("./src/utils", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    deps: {
      optimizer: {
        web: {
          // MUI 文件数量较多，转换成本较高，因此提前预打包。
          include: ["@mui/material", "@mui/icons-material", "@mui/system"],
        },
      },
    },
    server: {
      deps: {
        // react-transition-group 在 Node 侧的 ESM 目录导入不受支持，强制内联以 CJS 形式变换。
        inline: [/react-transition-group/, /@mui\/material/],
      },
    },
  },
});
