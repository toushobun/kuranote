"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { routePaths } from "config/paths";
import { ErrorState } from "molecules/ui/ErrorState";
import { PageShell } from "templates/layout/PageShell";

type LedgerInviteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LedgerInviteError({ reset }: LedgerInviteErrorProps) {
  return (
    <PageShell maxWidth="xs">
      <Stack
        sx={{
          justifyContent: "center",
          minHeight: "100dvh",
          py: 3,
        }}
      >
        <ErrorState
          action={
            <Stack direction="row" spacing={1.25} sx={{ width: "100%" }}>
              <Button
                component={Link}
                fullWidth
                href={routePaths.home}
                variant="outlined"
              >
                返回首页
              </Button>
              <Button fullWidth onClick={reset} variant="contained">
                重新加载
              </Button>
            </Stack>
          }
          description="请稍后重试，或联系账本管理员重新发送邀请。"
          title="邀请页面暂时无法加载"
        />
      </Stack>
    </PageShell>
  );
}
