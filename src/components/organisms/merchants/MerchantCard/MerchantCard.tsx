"use client";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { alpha, type Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { SoftCard } from "atoms/ui/SoftCard";
import { designTokens } from "theme/theme";
import {
  getStableFallbackThemeColorKey,
  themeColorTokens,
  type ThemeColorKey,
} from "theme/themeColorTokens";
import type { ServerAction } from "types/actions";
import type { Merchant, MerchantTag } from "types/merchants";

import { MerchantNameOptions } from "../MerchantNameOptions/MerchantNameOptions";

import { MerchantAvatar } from "../MerchantAvatar/MerchantAvatar";

type MerchantCardProps = {
  canManageMerchants?: boolean;
  editHref: string;
  ledgerId: string;
  merchant: Merchant;
  pending?: boolean;
  setPreferredAliasAction?: ServerAction;
};

function createChipPattern(patternColor: string) {
  const pattern = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path fill="${patternColor}" d="M6 0L12 6L6 12L0 6Z"/></svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(pattern)}")`;
}

const merchantTagColorByName: Readonly<Record<string, ThemeColorKey>> = {
  生鲜: "lime",
  超市: "lime",
  母婴: "sakura",
  图书文具: "lavender",
  家居: "amber",
  日用: "sky",
  便利店: "sky",
  餐饮: "amber",
  百货店: "sakura",
  电商: "lavender",
  旅行: "aqua",
  通讯: "indigo",
  生活: "jade",
};

function getMerchantTagChipSx(tag: MerchantTag) {
  const colorKey =
    merchantTagColorByName[tag.name] ?? getStableFallbackThemeColorKey(tag.id);
  const color = themeColorTokens[colorKey];

  return {
    "& .MuiChip-icon": {
      color: "inherit",
      fontSize: 16,
      lineHeight: 1,
      ml: 1.25,
      mr: 0.5,
    },
    "& .MuiChip-label": { pl: 0.5, pr: 1.25 },
    bgcolor: color.chipBackground,
    backgroundImage: createChipPattern(alpha(color.chipText, 0.02)),
    borderColor: color.chipBorder,
    borderRadius: `${designTokens.radius.sm}px`,
    color: color.chipText,
    fontSize: (theme: Theme) => theme.typography.body2.fontSize,
    fontWeight: 600,
    height: 28,
  } as const;
}

export function MerchantCard({
  canManageMerchants = true,
  editHref,
  merchant,
  pending,
  setPreferredAliasAction,
}: MerchantCardProps) {
  return (
    <SoftCard
      sx={{
        borderColor: "var(--user-theme-card-border)",
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <MerchantAvatar
          padding={0.75}
          size={{ xs: 64, sm: 72 }}
          src={merchant.icon_url ?? undefined}
          toneKey={merchant.id}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="h2"
            variant="subtitle1"
            sx={{ fontWeight: 900 }}
          >
            {merchant.name}
          </Typography>
          {merchant.website_url ? (
            <Link
              color="text.secondary"
              href={merchant.website_url}
              rel="noreferrer"
              target="_blank"
              sx={{ display: "block", overflowWrap: "anywhere" }}
              underline="none"
              variant="body2"
            >
              {merchant.website_url}
            </Link>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
              网址未设置
            </Typography>
          )}

          {merchant.note ? (
            <Typography
              color="text.secondary"
              sx={{ mt: 0.35 }}
              variant="body2"
            >
              {merchant.note}
            </Typography>
          ) : null}

          <Box sx={{ mt: 1 }}>
            <MerchantNameOptions
              merchant={merchant}
              pending={pending}
              setPreferredAliasAction={
                canManageMerchants ? setPreferredAliasAction : undefined
              }
            />
          </Box>
        </Box>

        {canManageMerchants ? (
          <IconButton
            aria-label={`编辑${merchant.name}`}
            component={NextLink}
            href={editHref}
            size="small"
            sx={{
              "&:hover": { bgcolor: "action.hover" },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: `${designTokens.radius.md}px`,
              flexShrink: 0,
              height: 40,
              width: 40,
            }}
          >
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>
      {merchant.tags.length > 0 ? (
        <>
          <Divider sx={{ borderStyle: "dashed", my: 1 }} />
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, pl: 2 }}>
            {merchant.tags.map((tag) => (
              <Chip
                icon={
                  <Box aria-hidden component="span">
                    {tag.icon}
                  </Box>
                }
                key={tag.id}
                label={tag.name}
                size="small"
                sx={getMerchantTagChipSx(tag)}
                variant="outlined"
              />
            ))}
          </Stack>
        </>
      ) : null}
    </SoftCard>
  );
}
