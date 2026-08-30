import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { deepOrange, lightGreen, pink } from "@mui/material/colors";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { SoftCard } from "atoms/ui/SoftCard";
import { merchantText } from "config/merchantText";
import type { Merchant } from "types/merchants";
import { getMerchantInitial, merchantIconSrc } from "utils/merchants";

type MerchantCardProps = {
  canManageMerchants?: boolean;
  editHref: string;
  ledgerId: string;
  merchant: Merchant;
};

const avatarTones = [
  {
    backgroundColor: deepOrange[50],
    borderColor: deepOrange[100],
    color: deepOrange[800],
  },
  {
    backgroundColor: pink[50],
    borderColor: pink[100],
    color: pink[800],
  },
  {
    backgroundColor: lightGreen[50],
    borderColor: lightGreen[200],
    color: lightGreen[800],
  },
] as const;

function avatarToneFor(merchantId: string) {
  const toneIndex = Array.from(merchantId).reduce(
    (hash, character) => (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  return avatarTones[toneIndex % avatarTones.length];
}

export function MerchantCard({
  canManageMerchants = true,
  editHref,
  ledgerId,
  merchant,
}: MerchantCardProps) {
  const hasPreferredAlias = merchant.aliases.some(
    (alias) => alias.is_preferred,
  );
  const avatarTone = avatarToneFor(merchant.id);

  return (
    <SoftCard
      sx={{
        borderColor: "var(--user-theme-card-border)",
        borderRadius: 5,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar
          alt=""
          src={merchantIconSrc(ledgerId, merchant.website_url)}
          sx={{
            "& .MuiAvatar-img": { objectFit: "contain" },
            bgcolor: avatarTone.backgroundColor,
            border: "1px solid",
            borderColor: avatarTone.borderColor,
            color: avatarTone.color,
            fontSize: (theme) => theme.typography.h4.fontSize,
            fontWeight: (theme) => theme.typography.fontWeightBold,
            height: { xs: 64, sm: 72 },
            p: 0.75,
            width: { xs: 64, sm: 72 },
          }}
        >
          {getMerchantInitial(merchant.display_name)}
        </Avatar>

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

          {merchant.aliases.length > 0 ? (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
              {merchant.aliases.map((alias) => (
                <Chip
                  color={alias.is_preferred ? "primary" : "default"}
                  icon={alias.is_preferred ? <StarRoundedIcon /> : undefined}
                  key={alias.id}
                  label={alias.alias}
                  size="small"
                  sx={{
                    borderRadius: 999,
                    fontSize: (theme) => theme.typography.body2.fontSize,
                    fontWeight: alias.is_preferred ? 800 : 600,
                    height: 28,
                  }}
                  variant={alias.is_preferred ? "filled" : "outlined"}
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
              bgcolor: "transparent",
              borderRadius: "50%",
              flexShrink: 0,
              height: 34,
              width: 34,
            }}
          >
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>
    </SoftCard>
  );
}
