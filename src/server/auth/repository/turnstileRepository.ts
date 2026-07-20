import { getTurnstileSecretKey } from "server/auth/turnstileKeys";
import type { Logger } from "server/shared/logging/logger";

export interface TurnstileRepository {
  verify(input: { remoteIp: string | null; token: string }): Promise<boolean>;
}

type TurnstileResponse = { success?: boolean };

function isTurnstileResponse(value: unknown): value is TurnstileResponse {
  return typeof value === "object" && value !== null;
}

function toSafeUnexpectedErrorContext(error: unknown): { errorName: string } {
  return { errorName: error instanceof Error ? error.name : "unknown" };
}

export function createCloudflareTurnstileRepository(
  logger: Logger,
  fetcher: typeof fetch = fetch,
): TurnstileRepository {
  return {
    async verify(input) {
      const secret = getTurnstileSecretKey();

      if (!secret || !input.token) return false;

      const body = new URLSearchParams({
        response: input.token,
        secret,
      });

      if (input.remoteIp) body.set("remoteip", input.remoteIp);

      try {
        const response = await fetcher(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          { body, method: "POST" },
        );

        if (!response.ok) return false;

        const data: unknown = await response.json();
        return isTurnstileResponse(data) && data.success === true;
      } catch (error) {
        logger.warn(
          "[auth] Turnstile verification request failed",
          toSafeUnexpectedErrorContext(error),
        );
        return false;
      }
    },
  };
}
