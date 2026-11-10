import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";

import { AccountAvatar } from "atoms/accounts/AccountAvatar/AccountAvatar";
import { DataItemCard } from "atoms/ui/DataItemCard";
import { placeholderMemberText } from "config/placeholderMemberText";
import { themeColorTokens } from "theme/themeColorTokens";

import type { AccountHolder, AccountType } from "types/accounts";
import {
  formatAmount,
  getAccountHolderLabel,
  getAccountTypeLabel,
} from "utils/accounts";

type AccountCardProps = {
  id: string;
  name: string;
  iconUrl?: string | null;
  type: AccountType;
  currency: string;
  currentBalance: number | string;
  holders?: AccountHolder[];
  actions?: ReactNode;
  footer?: ReactNode;
  /** 有值时整张卡片是链接（例：编辑账户页）。 */
  href?: string;
};

export function AccountCard({
  id,
  iconUrl,
  name,
  type,
  currency,
  currentBalance,
  holders = [],
  actions,
  footer,
  href,
}: AccountCardProps) {
  const card = (
    <DataItemCard>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <AccountAvatar id={id} iconUrl={iconUrl} name={name} size={38} />

          <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography
                component="h2"
                sx={{ fontSize: { xs: 16, sm: 17 }, fontWeight: 800 }}
              >
                {name}
              </Typography>
              <Chip
                label={getAccountTypeLabel(type)}
                size="small"
                sx={accountTypeChipSx}
              />
            </Stack>

            <Stack
              direction="row"
              spacing={0.6}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              {holders.length > 0 ? (
                holders.map((holder) => (
                  <Chip
                    key={holder.id}
                    label={
                      holder.kind === "placeholder"
                        ? placeholderMemberText.accountHolderOptionLabel(
                            holder.display_name,
                          )
                        : getAccountHolderLabel(holder)
                    }
                    size="small"
                    sx={holderChipSx(holder)}
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography color="textSecondary" variant="body2">
                  未设置持有人
                </Typography>
              )}
            </Stack>
          </Stack>

          <Stack spacing={0.6} sx={{ alignItems: "flex-end", flexShrink: 0 }}>
            <Typography sx={{ fontSize: { xs: 16, sm: 17 }, fontWeight: 900 }}>
              {formatAmount(currentBalance, currency)}
            </Typography>
            <Chip
              color="success"
              label="使用中"
              size="small"
              sx={accountStatusChipSx}
            />
          </Stack>
        </Stack>

        {actions}
      </Stack>

      {footer ? (
        <>
          <Divider sx={{ my: 3 }} />
          {footer}
        </>
      ) : null}
    </DataItemCard>
  );

  if (!href) {
    return card;
  }

  return (
    <ButtonBase component={Link} href={href} sx={cardButtonSx}>
      {card}
    </ButtonBase>
  );
}

const accountTypeChipSx = {
  bgcolor: "action.hover",
  height: 24,
};

const accountStatusChipSx = {
  bgcolor: "var(--user-theme-business-completed-bg)",
  color: "var(--user-theme-business-completed-text)",
  height: 24,
  fontWeight: 700,
};

const cardButtonSx = {
  borderRadius: "inherit",
  color: "inherit",
  display: "block",
  textAlign: "left",
  width: "100%",
};

/** 占位持有人没有成员个性色，使用中性虚线样式与真实成员区分。 */
function holderChipSx(holder: AccountHolder) {
  if (holder.kind === "placeholder") {
    return {
      bgcolor: "background.paper",
      borderColor: "divider",
      borderStyle: "dashed",
      color: "text.secondary",
      fontWeight: 600,
      height: 24,
    } as const;
  }

  const colorToken = themeColorTokens[holder.display_color];
  return {
    bgcolor: colorToken.chipBackground,
    borderColor: colorToken.chipBorder,
    color: colorToken.chipText,
    fontWeight: 600,
    height: 24,
  } as const;
}
