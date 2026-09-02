import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { SoftCard } from "atoms/ui/SoftCard";
import { merchantText } from "config/merchantText";
import {
  getStableFallbackThemeColorKey,
  themeColorTokens,
  type ThemeColorKey,
} from "theme/themeColorTokens";
import type { Merchant, MerchantTag } from "types/merchants";

import { MerchantAvatar } from "../MerchantAvatar/MerchantAvatar";

type MerchantCardProps = {
  canManageMerchants?: boolean;
  editHref: string;
  ledgerId: string;
  merchant: Merchant;
};

const merchantChipSx = {
  borderRadius: 999,
  fontSize: (theme: Theme) => theme.typography.body2.fontSize,
  height: 28,
} as const;

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
      ml: 0.75,
      mr: -0.25,
    },
    "& .MuiChip-label": { px: 0.75 },
    bgcolor: color.chipBackground,
    borderColor: color.chipBorder,
    borderRadius: 2,
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
}: MerchantCardProps) {
  const hasPreferredAlias = merchant.aliases.some(
    (alias) => alias.is_preferred,
  );
  const secondaryAliases = merchant.aliases.filter(
    (alias) => alias.alias !== merchant.display_name,
  );

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
            {merchant.display_name}
          </Typography>
          {hasPreferredAlias ? (
            <Typography color="text.secondary" variant="caption">
              {merchantText.formalName}：{merchant.name}
            </Typography>
          ) : null}

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

          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
            <Chip
              color={hasPreferredAlias ? "primary" : "default"}
              icon={hasPreferredAlias ? <StarRoundedIcon /> : undefined}
              label={merchant.display_name}
              size="small"
              sx={[
                merchantChipSx,
                {
                  color: hasPreferredAlias ? "primary.contrastText" : undefined,
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "inherit" },
                },
              ]}
              variant={hasPreferredAlias ? "filled" : "outlined"}
            />
            {secondaryAliases.map((alias) => (
              <Chip
                key={alias.id}
                label={alias.alias}
                size="small"
                sx={[merchantChipSx, { fontWeight: 600 }]}
                variant="outlined"
              />
            ))}
          </Stack>
          {merchant.tags.length > 0 ? (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
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
          ) : null}
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
              borderRadius: 1,
              flexShrink: 0,
              height: 40,
              width: 40,
            }}
          >
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>
    </SoftCard>
  );
}
