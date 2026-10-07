import type { NextConfig } from "next";

import { routePaths } from "./src/config/paths";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 旧的单页创建账本页已由创建账本向导取代（#395）。PWA 用户可能保存过旧链接，
      // 跳转到账本管理页（没有账本时该页会再跳转到首页），在那里打开向导。
      // 路径之后可能复用，因此不使用永久跳转，避免浏览器长期缓存。
      {
        destination: routePaths.ledgers,
        permanent: false,
        source: "/ledgers/new",
      },
    ];
  },
  turbopack: {
    // 本地开发时显式指定 root，减少自动探测带来的卡顿。
    root: process.cwd(),
  },
};

export default nextConfig;
