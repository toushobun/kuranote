"use client";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { EmptyState } from "molecules/ui/EmptyState";
import { publicAssetUrl } from "utils/publicAssetUrl";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  DialogContent,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { StepProgress } from "molecules/ui/StepProgress/StepProgress";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { designTokens } from "theme/theme";
import type { TransactionAccountOption } from "types/transactions";
import type {
  EntryMethod,
  TransactionStepFlowProps,
} from "./TransactionStepFlow.types";
import { flowMessages as m } from "./transactionStepFlowMessages";
import { useTransactionStepFlow } from "./useTransactionStepFlow";

export function TransactionStepFlow(props: TransactionStepFlowProps) {
  return props.open ? <TransactionStepFlowSession {...props} /> : null;
}

function TransactionStepFlowSession(props: TransactionStepFlowProps) {
  const w = useTransactionStepFlow(props);
  const accountList = (accounts: TransactionAccountOption[]) => (
    <List disablePadding>
      {accounts.map((account) => (
        <ListItemButton
          key={account.id}
          disabled={w.busy}
          onClick={() => void w.selectAccount(account)}
          sx={[
            rowSx,
            w.account?.id === account.id
              ? { bgcolor: "action.selected", borderColor: "primary.main" }
              : {},
          ]}
          role="radio"
          aria-checked={w.account?.id === account.id}
          aria-label={`${account.name} ${account.currency}`}
        >
          <AccountBalanceWalletRoundedIcon color="primary" />
          <ListItemText primary={account.name} secondary={account.currency} />
          {w.account?.id === account.id ? (
            <RadioButtonCheckedRoundedIcon color="primary" />
          ) : (
            <RadioButtonUncheckedRoundedIcon color="disabled" />
          )}
        </ListItemButton>
      ))}
    </List>
  );
  return (
    <>
      <WizardDialog
        open={props.open}
        onClose={() => void w.requestClose()}
        closeLabel={m.close}
        title={m.title}
        titleAction={
          <Button size="small" onClick={() => w.setMethodOpen(true)}>
            {m.switchMethod}
          </Button>
        }
        headerContent={
          <>
            <StepProgress
              currentStep={w.step}
              steps={m.steps}
              label={m.progress}
              completedSteps={w.completed}
              clickableSteps={[...w.completed, 4]}
              onStepClick={w.goToStep}
            />
            {w.step >= 2 && w.merchant && (
              <Paper variant="outlined" sx={{ mt: 2, overflow: "hidden" }}>
                {[
                  {
                    step: 1,
                    name: w.merchant.name,
                    icon: (
                      <MerchantAvatar
                        size={28}
                        toneKey={w.merchant.id}
                        src={w.merchant.icon_url ?? undefined}
                      />
                    ),
                  },
                  ...(w.account
                    ? [
                        {
                          step: 2,
                          name: w.account.name,
                          currency: w.account.currency,
                          icon: (
                            <AccountBalanceWalletRoundedIcon
                              fontSize="small"
                              color="primary"
                            />
                          ),
                        },
                      ]
                    : []),
                ].map((row) => (
                  <ListItemButton
                    key={row.step}
                    onClick={() => w.goToStep(row.step)}
                    sx={{
                      ...compactSx,
                      ...(row.step === 2
                        ? { borderTop: "1px solid", borderColor: "divider" }
                        : {}),
                    }}
                  >
                    {row.icon}
                    <Typography noWrap sx={{ flex: 1 }}>
                      {row.name}
                    </Typography>
                    {"currency" in row && (
                      <Typography variant="body2" color="textSecondary">
                        {row.currency}
                      </Typography>
                    )}
                    <Typography color="primary" variant="body2">
                      {m.change}
                    </Typography>
                    <ChevronRightRoundedIcon fontSize="small" />
                  </ListItemButton>
                ))}
              </Paper>
            )}
          </>
        }
      >
        <DialogContent sx={{ p: 2.5 }}>
          {w.step === 1 &&
            (props.merchants.length === 0 ? (
              <EmptyState
                title={m.noMerchants}
                description={m.merchantHint}
                illustration={
                  <Box
                    component="img"
                    alt=""
                    src={publicAssetUrl(
                      "/assets/kura-merchant-empty/merchant_empty_amber_warmth.png",
                    )}
                    sx={{ width: 180, maxWidth: "100%" }}
                  />
                }
                action={
                  <Stack spacing={2}>
                    <Button variant="contained" onClick={props.onAddPresets}>
                      {m.presets}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => props.onAddMerchant()}
                    >
                      {m.addMerchant}
                    </Button>
                  </Stack>
                }
              />
            ) : (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label={m.search}
                  value={w.search}
                  onChange={(event) => w.setSearch(event.target.value)}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ overflowX: "auto", pb: 1 }}
                >
                  <Chip
                    label={m.all}
                    color={w.tagId === null ? "primary" : "default"}
                    onClick={() => w.setTagId(null)}
                    sx={chipSx}
                  />
                  {props.merchantTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={`${tag.icon} ${tag.name}`}
                      color={w.tagId === tag.id ? "primary" : "default"}
                      onClick={() => w.setTagId(tag.id)}
                      sx={chipSx}
                    />
                  ))}
                </Stack>
                {!w.keyword && !w.tagId && w.frequent.length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {m.frequent}
                    </Typography>
                    <Box
                      role="group"
                      aria-label={m.frequent}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: 2,
                      }}
                    >
                      {w.frequent.map((merchant) => (
                        <ButtonBase
                          key={merchant.id}
                          onClick={() => w.selectMerchant(merchant)}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            minWidth: 0,
                          }}
                        >
                          <MerchantAvatar
                            size={56}
                            toneKey={merchant.id}
                            src={merchant.icon_url ?? undefined}
                          />
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: "100%" }}
                          >
                            {merchant.name}
                          </Typography>
                        </ButtonBase>
                      ))}
                    </Box>
                  </>
                )}
                {w.filtered.length > 0 ? (
                  <>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {w.keyword || w.tagId ? m.results : m.merchants}
                    </Typography>
                    <List disablePadding>
                      {w.filtered.map((merchant) => (
                        <ListItemButton
                          key={merchant.id}
                          onClick={() => w.selectMerchant(merchant)}
                          sx={rowSx}
                        >
                          <MerchantAvatar
                            size={36}
                            toneKey={merchant.id}
                            src={merchant.icon_url ?? undefined}
                          />
                          <ListItemText primary={merchant.name} />
                          {merchant.tags.map((tag) => (
                            <Chip key={tag.id} label={tag.name} size="small" />
                          ))}
                          <ChevronRightRoundedIcon />
                        </ListItemButton>
                      ))}
                    </List>
                  </>
                ) : (
                  <Stack spacing={2} sx={emptySx}>
                    <Typography>{m.notFound(w.keyword)}</Typography>
                    <Button
                      startIcon={<AddRoundedIcon />}
                      variant="outlined"
                      onClick={() => props.onAddMerchant(w.keyword)}
                    >
                      {m.addSearch(w.keyword)}
                    </Button>
                  </Stack>
                )}
              </Stack>
            ))}
          {w.step === 2 &&
            (props.accounts.length === 0 ? (
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
                  <Button variant="contained" onClick={props.onAddAccount}>
                    {m.addAccount}
                  </Button>
                }
              />
            ) : (
              <Stack spacing={2} role="radiogroup" aria-label={m.accounts}>
                <Typography variant="h6">{m.accounts}</Typography>
                {w.recommended.length > 0 ? (
                  <>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "baseline", flexWrap: "wrap" }}
                    >
                      <Typography sx={{ fontWeight: "bold" }}>
                        {m.recommended}
                      </Typography>
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
                    <Typography sx={{ fontWeight: "bold" }}>
                      {m.allAccounts}
                    </Typography>
                    {accountList(props.accounts)}
                  </>
                )}
              </Stack>
            ))}
          {w.step === 3 && <Typography>{m.detailsPlaceholder}</Typography>}
          {w.step === 4 && <Typography>{m.confirmPlaceholder}</Typography>}
        </DialogContent>
        {(w.returning || w.step === 3) && (
          <Box sx={{ p: 2, pb: "max(16px, env(safe-area-inset-bottom))" }}>
            <Button
              fullWidth
              variant="contained"
              disabled={
                w.busy ||
                (w.step === 1 && !w.merchant) ||
                (w.step === 2 && !w.account)
              }
              onClick={() => w.advance(w.step)}
            >
              {w.returning ? m.returnToConfirm : m.toConfirm}
            </Button>
          </Box>
        )}
      </WizardDialog>
      <Drawer
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
        anchor="bottom"
        open={w.methodOpen}
        onClose={() => w.setMethodOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${designTokens.radius.lg}px ${designTokens.radius.lg}px 0 0`,
              maxWidth: 560,
              mx: "auto",
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography variant="h6">{m.methodTitle}</Typography>
            <IconButton
              aria-label={m.closeDrawer}
              onClick={() => w.setMethodOpen(false)}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <List>
            {m.methods.map((method) => (
              <ListItemButton
                key={method.id}
                disabled={"disabled" in method && method.disabled}
                onClick={() => {
                  w.setMethodOpen(false);
                  props.onMethodChange(method.id as EntryMethod);
                }}
                sx={rowSx}
              >
                <ListItemText primary={method.label} />
                {"badge" in method && (
                  <Chip size="small" label={method.badge} />
                )}
                {"disabled" in method && <Chip size="small" label={m.soon} />}
                {method.id === "merchant" && (
                  <CheckRoundedIcon color="primary" />
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
const compactSx = { minHeight: 44, gap: 1, py: 0.5, px: 1.5 };
const rowSx = {
  gap: 1.5,
  mb: 1,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  minHeight: 56,
};
const chipSx = { borderRadius: `${designTokens.radius.full}px`, flexShrink: 0 };
const emptySx = { textAlign: "center", py: 6 } as const;
