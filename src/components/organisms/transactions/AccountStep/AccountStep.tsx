"use client";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AccountTypeIcon } from "atoms/accounts/AccountTypeIcon/AccountTypeIcon";
import { EmptyState } from "molecules/ui/EmptyState";
import { publicAssetUrl } from "utils/publicAssetUrl";
import { entrySelectionRowSx as rowSx } from "organisms/transactions/transactionStepFlowStyles";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type { TransactionAccountOption } from "types/transactions";
import type { AccountStepProps } from "./AccountStep.types";
import { useAccountStep } from "./useAccountStep";

/** 收支账户列表（#943）：任务 9 起在小票的账户选择抽屉里使用，标题由抽屉显示。 */
export function AccountStep(props: AccountStepProps) {
  const w = useAccountStep(props);
  const accountList = (accounts: TransactionAccountOption[]) => (
    <List disablePadding>
      {accounts.map((account) => (
        <ListItemButton
          key={account.id}
          disabled={w.busy}
          onClick={() => void w.selectAccount(account)}
          sx={[
            rowSx,
            props.selectedAccount?.id === account.id
              ? { bgcolor: "action.selected", borderColor: "primary.main" }
              : {},
          ]}
          role="radio"
          aria-checked={props.selectedAccount?.id === account.id}
          aria-label={`${account.name} ${account.currency}`}
        >
          <Box sx={{ color: "primary.main", display: "inline-flex" }}>
            <AccountTypeIcon type={account.type ?? "other"} />
          </Box>
          <ListItemText
            primary={account.name}
            secondary={m.holder(
              account.holders?.map((holder) => holder.display_name) ?? [],
            )}
          />
          <Typography variant="body2" color="textSecondary">
            {account.currency}
          </Typography>
          {props.selectedAccount?.id === account.id ? (
            <RadioButtonCheckedRoundedIcon color="primary" />
          ) : (
            <RadioButtonUncheckedRoundedIcon color="disabled" />
          )}
        </ListItemButton>
      ))}
    </List>
  );
  return props.accounts.length === 0 ? (
    <EmptyState
      title={m.noAccounts}
      description={m.accountHint}
      illustration={
        <Box
          component="img"
          alt=""
          src={publicAssetUrl(
            "/assets/kura-account-form/account_illustration_amber_warmth.png",
          )}
          sx={{ width: 180, maxWidth: "100%" }}
        />
      }
      action={
        props.onAddAccount && (
          <Button variant="contained" onClick={props.onAddAccount}>
            {m.addAccount}
          </Button>
        )
      }
    />
  ) : (
    <Stack spacing={2} role="radiogroup" aria-label={m.accounts}>
      {w.recommended.length > 0 ? (
        <>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "baseline", flexWrap: "wrap" }}
          >
            <Typography sx={{ fontWeight: "bold" }}>{m.recommended}</Typography>
            <Typography variant="caption" color="textSecondary">
              {m.recommendationHint}
            </Typography>
          </Stack>
          {accountList(w.recommended)}
          {w.others.length > 0 && (
            <>
              <Typography sx={{ fontWeight: "bold" }}>
                {m.otherAccounts}
              </Typography>
              {accountList(w.others)}
            </>
          )}
        </>
      ) : (
        <>
          <Alert severity="info">{m.noHistory}</Alert>
          <Typography sx={{ fontWeight: "bold" }}>{m.allAccounts}</Typography>
          {accountList(props.accounts)}
        </>
      )}
    </Stack>
  );
}
