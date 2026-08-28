import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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

export function MerchantCard({
  canManageMerchants = true,
  editHref,
  ledgerId,
  merchant,
}: MerchantCardProps) {
  const hasPreferredAlias = merchant.aliases.some(
    (alias) => alias.is_preferred,
  );

  return (
    <SoftCard sx={{ borderColor: "var(--user-theme-card-border)", p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar
          alt=""
          src={merchantIconSrc(ledgerId, merchant.website_url)}
          sx={{
            bgcolor: "var(--user-theme-icon-badge-bg)",
            color: "var(--user-theme-icon-badge-color)",
            height: 52,
            width: 52,
          }}
        >
          {getMerchantInitial(merchant.display_name)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {merchant.display_name}
          </Typography>
          {hasPreferredAlias ? (
            <Typography color="text.secondary" variant="caption">
              {merchantText.formalName}：{merchant.name}
            </Typography>
          ) : null}

          {merchant.website_url ? (
            <Link
              href={merchant.website_url}
              rel="noreferrer"
              target="_blank"
              sx={{ display: "block", mt: 0.5, overflowWrap: "anywhere" }}
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
              sx={{ mt: 0.75 }}
              variant="body2"
            >
              {merchant.note}
            </Typography>
          ) : null}

          {merchant.aliases.length > 0 ? (
            <Stack
              direction="row"
              sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}
            >
              {merchant.aliases.map((alias) => (
                <Chip
                  color={alias.is_preferred ? "primary" : "default"}
                  icon={alias.is_preferred ? <StarRoundedIcon /> : undefined}
                  key={alias.id}
                  label={alias.alias}
                  size="small"
                  variant={alias.is_preferred ? "filled" : "outlined"}
                />
              ))}
            </Stack>
          ) : null}
        </Box>

        {canManageMerchants ? (
          <Button
            aria-label={`编辑${merchant.name}`}
            component={NextLink}
            href={editHref}
            size="small"
            startIcon={<EditRoundedIcon />}
            variant="outlined"
          >
            编辑
          </Button>
        ) : null}
      </Stack>
    </SoftCard>
  );
}
