export type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

export type TurnstileAdapter = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileAdapter;
  }
}

const turnstileScriptId = "cloudflare-turnstile-script";
let turnstileScriptPromise: Promise<TurnstileAdapter> | null = null;

export function loadTurnstileAdapter() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile can only run in browser."));
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise<TurnstileAdapter>((resolve, reject) => {
    const existingScript = document.getElementById(turnstileScriptId);

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.turnstile) {
          resolve(window.turnstile);
          return;
        }

        reject(new Error("Turnstile failed to load."));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Turnstile failed to load."));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = turnstileScriptId;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;

    script.addEventListener("load", () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }

      reject(new Error("Turnstile failed to load."));
    });
    script.addEventListener("error", () => {
      reject(new Error("Turnstile failed to load."));
    });

    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}
