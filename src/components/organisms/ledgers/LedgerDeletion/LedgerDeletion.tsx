"use client";

import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { alpha, type Theme } from "@mui/material/styles";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useId } from "react";
import { ledgerDeletionMessages as messages } from "config/ledgerDeletionMessages";
import { routePaths } from "config/paths";
import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type { LoadLedgerDeletionImpactAction } from "types/ledgers";
import {
  useLedgerDeletion,
  type DeleteLedgerAction,
} from "./useLedgerDeletion";

export function LedgerDeletion({
  ledger,
  action,
  loadImpact,
}: {
  ledger: { id: string; name: string; isCurrent: boolean };
  action: DeleteLedgerAction;
  loadImpact: LoadLedgerDeletionImpactAction;
}) {
  const flow = useLedgerDeletion({
    action,
    ledgerId: ledger.id,
    ledgerName: ledger.name,
    loadImpact,
  });
  const titleId = useId();
  const impact = flow.impact;
  const counts = impact
    ? [
        impact.itemCount > 0 ? messages.items(impact.itemCount) : null,
        impact.accountCount > 0 ? messages.accounts(impact.accountCount) : null,
        impact.merchantCount > 0
          ? messages.merchants(impact.merchantCount)
          : null,
      ].filter((part) => part !== null)
    : [];
  const impactRows = [
    ...(counts.length
      ? [{ icon: ReceiptLongRoundedIcon, text: messages.counts(counts) }]
      : []),
    ...(impact?.memberNames.length
      ? [
          {
            icon: GroupOutlinedIcon,
            text: messages.members(impact.memberNames),
          },
        ]
      : []),
    ...(impact?.placeholderNames.length
      ? [
          {
            icon: PersonOutlineRoundedIcon,
            text: messages.placeholders(impact.placeholderNames),
          },
        ]
      : []),
    ...(impact?.pendingInviteCount
      ? [{ icon: LinkOffRoundedIcon, text: messages.invitations }]
      : []),
    { icon: WarningRoundedIcon, text: messages.irreversible },
  ];
  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <DeleteOutlineRoundedIcon color="error" />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{messages.title}</Typography>
          <Typography variant="body2" sx={secondaryTextSx}>
            {messages.description}
          </Typography>
        </Box>
        <Button
          color="error"
          variant="outlined"
          type="button"
          onClick={flow.show}
        >
          {messages.delete}
        </Button>
      </Stack>
      <Dialog
        open={flow.open}
        onClose={flow.close}
        aria-labelledby={titleId}
        fullWidth
        maxWidth="xs"
        sx={{
          "& .MuiDialog-container": {
            alignItems: { xs: "flex-end", sm: "center" },
          },
        }}
        slotProps={{
          paper: {
            sx: {
              m: { xs: 0, sm: 4 },
              width: { xs: "100%", sm: "calc(100% - 64px)" },
              borderRadius: {
                xs: `${designTokens.radius.lg}px ${designTokens.radius.lg}px 0 0`,
                sm: `${designTokens.radius.lg}px`,
              },
            },
          },
        }}
      >
        <DialogContent>
          <Box
            aria-hidden
            sx={{
              display: { xs: "block", sm: "none" },
              width: 40,
              height: 4,
              bgcolor: "divider",
              mx: "auto",
              mb: 2,
              borderRadius: `${designTokens.radius.full}px`,
            }}
          />
          {flow.step === 1 ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  alignSelf: "center",
                  display: "flex",
                  p: 2,
                  borderRadius: "50%",
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                }}
              >
                <WarningRoundedIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
              <Typography
                id={titleId}
                component="h2"
                variant="h6"
                sx={dialogTitleSx}
              >
                {messages.impactTitle(ledger.name)}
              </Typography>
              {flow.impactLoading ? (
                <Stack
                  role="status"
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", justifyContent: "center" }}
                >
                  <CircularProgress aria-hidden size={20} />
                  <Typography variant="body2" sx={secondaryTextSx}>
                    {messages.impactLoading}
                  </Typography>
                </Stack>
              ) : flow.impactError ? (
                <Alert severity="error">{flow.impactError}</Alert>
              ) : (
                <Stack
                  component="ul"
                  spacing={1.5}
                  sx={{ p: 0, m: 0, listStyle: "none" }}
                >
                  {impactRows.map(({ icon: Icon, text }) => (
                    <Stack
                      component="li"
                      direction="row"
                      spacing={1.5}
                      key={text}
                      sx={{ alignItems: "flex-start" }}
                    >
                      <Icon sx={{ color: "text.secondary", flexShrink: 0 }} />
                      <Typography variant="body2">{text}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
              <Alert
                severity="warning"
                icon={<LightbulbOutlinedIcon />}
                action={
                  <Button
                    component={Link}
                    href={
                      ledger.isCurrent
                        ? routePaths.settingsDataExport
                        : routePaths.ledgers
                    }
                    color="inherit"
                    size="small"
                  >
                    {messages.export}
                  </Button>
                }
              >
                {messages.backup}
                {!ledger.isCurrent && (
                  <Typography variant="body2">
                    {messages.switchBeforeExport}
                  </Typography>
                )}
              </Alert>
              <Button
                color="error"
                variant="contained"
                sx={{ minHeight: 48 }}
                onClick={flow.next}
                disabled={!impact}
                fullWidth
              >
                {messages.continue}
              </Button>
              <Button color="inherit" onClick={flow.close}>
                {messages.cancel}
              </Button>
            </Stack>
          ) : (
            <Stack
              component="form"
              action={flow.formAction}
              spacing={2}
              aria-busy={flow.pending}
            >
              <input type="hidden" name="ledgerId" value={ledger.id} />
              <Typography
                id={titleId}
                component="h2"
                variant="h6"
                sx={dialogTitleSx}
              >
                {messages.confirmationTitle}
              </Typography>
              <Typography sx={{ textAlign: "center" }}>
                {messages.confirmationDescription.before}
                <Box
                  component="strong"
                  sx={{ fontWeight: typographyStyles.cardTitle.fontWeight }}
                >
                  {messages.confirmationDescription.ledgerName(ledger.name)}
                </Box>
                {messages.confirmationDescription.after}
              </Typography>
              <TextField
                autoFocus
                autoComplete="off"
                fullWidth
                name="confirmationName"
                label={messages.nameLabel}
                value={flow.name}
                onChange={(event) => flow.setName(event.target.value)}
                disabled={flow.pending}
                slotProps={{
                  input: {
                    endAdornment: flow.matched ? (
                      <CheckCircleRoundedIcon
                        color="success"
                        titleAccess={messages.matched}
                      />
                    ) : null,
                  },
                }}
              />
              <Button
                type="submit"
                disabled={!flow.matched || flow.pending}
                color="error"
                variant="contained"
                sx={flow.pending ? pendingDeleteButtonSx : { minHeight: 48 }}
                fullWidth
                startIcon={
                  flow.pending ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : undefined
                }
              >
                {flow.pending ? messages.pending : messages.permanentDelete}
              </Button>
              {flow.pending ? (
                <Typography
                  role="status"
                  variant="body2"
                  sx={{ ...secondaryTextSx, textAlign: "center" }}
                >
                  {messages.pendingHint}
                </Typography>
              ) : (
                <Button color="inherit" onClick={flow.back}>
                  {messages.back}
                </Button>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
      <FailureFeedbackDialog
        aboveModal
        open={Boolean(flow.error)}
        title={messages.failure}
        description={flow.error ?? null}
        onClose={flow.dismissError}
      />
    </>
  );
}

// 当前 MUI 版本下 Typography 的 color prop 不生效，统一用 sx 指定。
const secondaryTextSx = { color: "text.secondary" } as const;

const dialogTitleSx = {
  ...typographyStyles.cardTitle,
  textAlign: "center",
} as const;

// 提交中仍禁用，但保持淡红而不是 MUI 默认的灰色禁用样式。
const pendingDeleteButtonSx = {
  minHeight: 48,
  "&.Mui-disabled": {
    bgcolor: (theme: Theme) => alpha(theme.palette.error.main, 0.5),
    color: "error.contrastText",
  },
} as const;
