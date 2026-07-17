"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";

import { SoftCard } from "atoms/ui/SoftCard";
import { routePaths } from "config/paths";
import { LedgerInviteRoleRow } from "molecules/ledgers/LedgerInviteRoleRow";
import type { LedgerInvitePreview } from "server/services/ledgerInvite";
import { PageShell } from "templates/layout/PageShell";
import type { ServerAction } from "types/actions";
import type { LedgerInviteRole } from "types/ledgers";

const inviteRoleDescriptions: Record<LedgerInviteRole, string> = {
  admin: "加入后可管理账本、成员与基础设置，并共同记录数据。",
  member: "加入后可共同查看和记录该账本的数据。",
  viewer: "加入后可查看该账本的数据，但不能新增或修改记录。",
};

type LedgerInviteTemplateProps = {
  acceptAction: ServerAction;
  errorMessage?: string | null;
  exitHref?: string;
  preview: LedgerInvitePreview;
  token: string;
};

export function LedgerInviteTemplate({
  acceptAction,
  errorMessage = null,
  exitHref = routePaths.dashboard,
  preview,
  token,
}: LedgerInviteTemplateProps) {
  const isAlreadyMember = preview.status === "already_member";
  const isInvalid =
    preview.status === "invalid" ||
    preview.status === "revoked" ||
    preview.status === "accepted";
  const illustration = isInvalid
    ? {
        alt: "邀请已失效插图",
        src: "/assets/ledger-invite/invite-invalid.png",
      }
    : isAlreadyMember
      ? {
          alt: "已经加入账本插图",
          src: "/assets/ledger-invite/invite-joined.png",
        }
      : {
          alt: "邀请加入账本插图",
          src: "/assets/kura-invite/invite_illustration.png",
        };

  return (
    <>
      <Box aria-hidden="true" sx={pageBackgroundSx} />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack spacing={2.5} sx={{ minHeight: "100dvh", py: 2 }}>
          <Box
            data-testid="ledger-invite-page-illustration-slot"
            sx={illustrationSlotSx}
          >
            <Image
              alt={illustration.alt}
              fill
              priority
              sizes="(max-width: 600px) 100vw, 420px"
              src={illustration.src}
              style={{ objectFit: "cover", objectPosition: "top right" }}
            />
            <IconButton
              aria-label="返回"
              component={Link}
              href={exitHref}
              sx={backButtonSx}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          </Box>

          <Stack spacing={1} sx={{ textAlign: "center" }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
              {isInvalid
                ? "邀请已失效"
                : isAlreadyMember
                  ? "你已经加入该账本"
                  : "邀请你加入账本"}
            </Typography>
            <Typography color="text.secondary">
              {isInvalid
                ? "该邀请链接已经失效，请联系管理员重新发送邀请。"
                : isAlreadyMember
                  ? "当前账号已经是该账本成员，无需再次加入。"
                  : `${preview.inviterName ?? "账本管理员"} 邀请你共同记录生活。`}
            </Typography>
          </Stack>

          {!isInvalid && preview.ledgerName ? (
            <SoftCard sx={{ p: 2.25 }}>
              <Stack spacing={1.75}>
                <Stack
                  direction="row"
                  spacing={1.2}
                  sx={{ alignItems: "center" }}
                >
                  <Box sx={ledgerIconSx}>
                    <HomeRoundedIcon />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {preview.ledgerName}
                  </Typography>
                </Stack>
                <LedgerInviteRoleRow role={preview.inviteRole ?? "member"} />
                <Typography color="text.secondary" variant="body2">
                  {inviteRoleDescriptions[preview.inviteRole ?? "member"]}
                </Typography>
              </Stack>
            </SoftCard>
          ) : null}

          {errorMessage ? (
            <Typography color="error" role="alert" sx={{ textAlign: "center" }}>
              {errorMessage}
            </Typography>
          ) : null}

          <Stack spacing={1.25} sx={{ mt: "auto" }}>
            {isInvalid ? (
              <Button component={Link} href={exitHref} variant="contained">
                返回首页
              </Button>
            ) : isAlreadyMember ? (
              <Button
                component={Link}
                href={routePaths.dashboard}
                variant="contained"
              >
                进入账本
              </Button>
            ) : (
              <Stack direction="row" spacing={1.25}>
                <Button
                  component={Link}
                  href={exitHref}
                  sx={{ flex: 1 }}
                  variant="outlined"
                >
                  取消
                </Button>
                <Box action={acceptAction} component="form" sx={{ flex: 1 }}>
                  <input name="token" type="hidden" value={token} />
                  <Button fullWidth type="submit" variant="contained">
                    加入账本
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        </Stack>
      </PageShell>
    </>
  );
}

const pageBackgroundSx = {
  bgcolor: "background.paper",
  inset: 0,
  position: "fixed",
  zIndex: -1,
};

const pageShellSx = {
  px: { xs: 1.5, sm: 2 },
};

const illustrationSlotSx = {
  borderRadius: "0 0 28px 28px",
  minHeight: 280,
  mt: { xs: -2, sm: -3 },
  mx: { xs: -1.5, sm: -2 },
  overflow: "hidden",
  position: "relative",
};

const backButtonSx = {
  bgcolor: "rgba(255, 255, 255, 0.85)",
  boxShadow: 2,
  color: "text.primary",
  left: 12,
  position: "absolute",
  top: 12,
  "&:hover": {
    bgcolor: "rgba(255, 255, 255, 0.95)",
  },
};

const ledgerIconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 44,
  justifyContent: "center",
  width: 44,
  "& .MuiSvgIcon-root": {
    fontSize: 24,
  },
} as const;
