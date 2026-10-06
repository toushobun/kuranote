"use client";

import Button from "@mui/material/Button";
import { useEffect } from "react";

import { merchantPageMessages } from "config/merchantText";
import { routePaths } from "config/paths";
import { ErrorState } from "molecules/ui/ErrorState";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function MerchantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <SettingsPageLayout
      back={{
        href: routePaths.settings,
        label: merchantPageMessages.backToSettings,
      }}
      subtitle="商家信息读取时发生错误。"
      title={merchantPageMessages.title}
    >
      <ErrorState
        action={
          <Button onClick={reset} variant="outlined">
            重新读取
          </Button>
        }
        description="商家信息暂时无法读取，请稍后再试。"
        title="商家信息读取失败"
      />
    </SettingsPageLayout>
  );
}
