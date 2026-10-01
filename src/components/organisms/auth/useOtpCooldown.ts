"use client";

import { useEffect, useState } from "react";

/** 验证码重新发送的倒计时（秒），每秒减 1，到 0 停止。 */
export function useOtpCooldown() {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldownSeconds]);

  return [cooldownSeconds, setCooldownSeconds] as const;
}
