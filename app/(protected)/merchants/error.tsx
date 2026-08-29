"use client";

import Button from "@mui/material/Button";
import { useEffect } from "react";

import { ErrorState } from "molecules/ui/ErrorState";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

export default function MerchantsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <PageShell>
      <PageHeader subtitle="商家信息读取时发生错误。" title="商家管理" />
      <ErrorState
        action={
          <Button onClick={reset} variant="outlined">
            重新读取
          </Button>
        }
        description="商家信息暂时无法读取，请稍后再试。"
        title="商家信息读取失败"
      />
    </PageShell>
  );
}
