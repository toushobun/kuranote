import { turnstileScriptId } from "organisms/auth/RegisterForm/turnstile";

import { installMockTurnstile } from "./mockTurnstile";

// Storybook 在真实浏览器中运行：预先放置同 id 的空 script，
// 阻止组件加载 Cloudflare 脚本，使 Story 不依赖外部网络。
// 否则无外网时脚本加载失败会先触发错误处理，真实脚本加载成功时又会覆盖 mock。
function blockTurnstileScript() {
  if (document.getElementById(turnstileScriptId)) {
    return;
  }

  const script = document.createElement("script");
  script.id = turnstileScriptId;
  document.head.appendChild(script);
}

export function installTurnstileTestDouble() {
  blockTurnstileScript();
  return installMockTurnstile();
}
