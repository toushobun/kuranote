export type TurnstileWidgetId = string;

export type TurnstileRenderOptions = {
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback"?: () => void;
  sitekey: string;
  theme?: "light";
};

export type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => TurnstileWidgetId;
  remove: (widgetId: TurnstileWidgetId) => void;
  reset: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const turnstileScriptId = "kuranote-turnstile-script";

const turnstileScriptSrc =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function getTurnstileApi(): TurnstileApi | undefined {
  const api = window.turnstile;

  if (!api) {
    return undefined;
  }

  return {
    render: (container, options) =>
      api.render(container, {
        ...options,
        "expired-callback":
          options["expired-callback"] ?? options["error-callback"],
      }),
    remove: (widgetId) => api.remove(widgetId),
    reset: (widgetId) => api.reset(widgetId),
  };
}

export function ensureTurnstileScript() {
  if (document.getElementById(turnstileScriptId)) {
    return;
  }

  const script = document.createElement("script");
  script.id = turnstileScriptId;
  script.src = turnstileScriptSrc;
  script.async = true;
  document.head.appendChild(script);
}
