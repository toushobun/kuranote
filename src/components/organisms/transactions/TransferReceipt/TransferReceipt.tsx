"use client";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FormEvent } from "react";

import { AccountAvatar } from "atoms/accounts/AccountAvatar/AccountAvatar";
import {
  flowMessages as m,
  transferReceiptMessages as t,
} from "config/transactionStepFlowMessages";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { AccountStep } from "organisms/transactions/AccountStep/AccountStep";
import { useReceiptCreation } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { ReceiptAmountRow } from "organisms/transactions/ReceiptParts/ReceiptAmountRow";
import { ReceiptIssueAlerts } from "organisms/transactions/ReceiptParts/ReceiptIssueAlerts";
import { ReceiptNoteSection } from "organisms/transactions/ReceiptParts/ReceiptNoteSection";
import { ReceiptPaper } from "organisms/transactions/ReceiptParts/ReceiptPaper";
import { ReceiptSubmitButton } from "organisms/transactions/ReceiptParts/ReceiptSubmitButton";
import { ReceiptTimeButton } from "organisms/transactions/ReceiptParts/ReceiptTimeButton";
import { designTokens } from "theme/theme";
import type {
  TransactionAccountOption,
  TransactionRecordType,
  TransferEditInitialValues,
} from "types/transactions";

import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { formatStepCurrencyAmount } from "../transactionStepFlowFormat";
import { useTransferReceipt, type TransferSide } from "./useTransferReceipt";

type TransferReceiptProps = {
  formId: string;
  action: (formData: FormData) => void | Promise<void>;
  accountOptions: readonly TransactionAccountOption[];
  /** 编辑转账时的原记录；不传为新增。 */
  initialValues?: TransferEditInitialValues;
  /** 编辑时提交原记录类型，服务端据此判断是否改了类型。 */
  sourceType?: TransactionRecordType;
  /** 只读详情（#928）：没有铅笔、提示条与保存按钮。 */
  readOnly?: boolean;
  errorMessage?: string | null;
  saving?: boolean;
  /** 客户端校验拦截提交时通知外框（清除未完成的「保存并退出」）。 */
  onValidationFailed?: () => void;
};

/**
 * 账户周转小票（#1050）：抬头是「转出 → 转入」两个账户图标与时间，
 * 下面是转账金额（计算器）与备注，都在小票上点开编辑；点保存后才标红未完成的项目。
 */
export function TransferReceipt(props: TransferReceiptProps) {
  const readOnly = !!props.readOnly;
  const creation = useReceiptCreation();
  const w = useTransferReceipt({
    accountOptions: props.accountOptions,
    initialValues: props.initialValues,
    readOnly,
  });
  const { dateTime } = w;
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readOnly || !w.checkIssues()) return;
    event.preventDefault();
    props.onValidationFailed?.();
  }
  const sideProps = (side: TransferSide) => ({
    side,
    account: side === "source" ? w.source : w.target,
    error: w.isMarked(side) || (side === "target" && w.isMarked("currency")),
    readOnly,
    onClick: () => w.setPicker(side),
  });
  return (
    <>
      <Box
        component="form"
        id={props.formId}
        action={props.action}
        onSubmit={handleSubmit}
      >
        <input name="type" readOnly type="hidden" value="transfer" />
        <input name="targetType" readOnly type="hidden" value="transfer" />
        {props.sourceType && (
          <input
            name="sourceType"
            readOnly
            type="hidden"
            value={props.sourceType}
          />
        )}
        {props.initialValues && (
          <input
            name="transactionRecordId"
            readOnly
            type="hidden"
            value={props.initialValues.transactionRecordId}
          />
        )}
        <input name="accountId" readOnly type="hidden" value={w.sourceId} />
        <input
          name="transferTargetAccountId"
          readOnly
          type="hidden"
          value={w.targetId}
        />
        <input name="transferAmount" readOnly type="hidden" value={w.amount} />
        <input name="note" readOnly type="hidden" value={w.note} />
        <input
          name="transactionAt"
          readOnly
          type="hidden"
          value={dateTime.transactionAtValue}
        />
        <input
          name="timeZoneOffsetMinutes"
          readOnly
          type="hidden"
          value={dateTime.timeZoneOffsetMinutes}
        />
        <Stack spacing={2}>
          {props.errorMessage && (
            <Alert severity="error">{props.errorMessage}</Alert>
          )}
          <ReceiptIssueAlerts
            issues={w.visibleIssues}
            pulseCount={w.pulseCount}
            firstIssueRef={w.firstIssueRef}
          />
          <ReceiptPaper>
            <Stack sx={{ alignItems: "center", pb: 1.5 }}>
              <Stack direction="row" sx={sidesSx}>
                <TransferAccountSide {...sideProps("source")} />
                <ArrowForwardRoundedIcon
                  aria-hidden
                  color="primary"
                  sx={arrowSx}
                />
                <TransferAccountSide {...sideProps("target")} />
              </Stack>
              <ReceiptTimeButton
                date={dateTime.date}
                time={dateTime.time}
                onDateChange={dateTime.setDate}
                onTimeChange={dateTime.setTime}
                open={w.timeOpen}
                onOpenChange={w.setTimeOpen}
                error={w.isMarked("time")}
                readOnly={readOnly}
              />
            </Stack>
            <ReceiptAmountRow
              label={t.amount}
              amount={
                w.amount.trim()
                  ? formatStepCurrencyAmount(w.amount, w.currency)
                  : ""
              }
              error={w.isMarked("amount")}
              onClick={readOnly ? undefined : () => w.setAmountOpen(true)}
            />
            <ReceiptNoteSection
              note={w.note}
              onChange={w.handleNoteChange}
              readOnly={readOnly}
            />
          </ReceiptPaper>
          {!readOnly && (
            <ReceiptSubmitButton
              edit={!!props.initialValues}
              label={props.initialValues ? m.saveEdit : t.save}
              saving={props.saving}
            />
          )}
        </Stack>
      </Box>
      <TransactionBottomEditorDrawer
        open={w.picker !== null}
        suspended={!!creation?.editor}
        title={t.accountTitle(w.picker === "target" ? t.target : t.source)}
        onClose={() => w.setPicker(null)}
      >
        <AccountStep
          accounts={w.pickerAccounts}
          selectedAccount={w.pickerSelectedAccount}
          onSelect={w.selectAccount}
          onAddAccount={
            creation?.addAccount
              ? (onCreated) => creation.addAccount?.(onCreated)
              : undefined
          }
        />
      </TransactionBottomEditorDrawer>
      <TransactionItemAmountDrawer
        open={w.amountOpen}
        title={t.amount}
        currency={w.currency}
        value={w.amount}
        onConfirm={w.confirmAmount}
        onClose={() => w.setAmountOpen(false)}
      />
    </>
  );
}

/** 抬头的一边：「转出 / 转入」、账户图标（未选时是虚线框）、账户名与币种。 */
function TransferAccountSide({
  side,
  account,
  error,
  readOnly,
  onClick,
}: {
  side: TransferSide;
  account?: TransactionAccountOption;
  error: boolean;
  readOnly: boolean;
  onClick: () => void;
}) {
  const label = side === "source" ? t.source : t.target;
  const content = (
    <>
      {account ? (
        <AccountAvatar id={account.id} name={account.name} size={48} />
      ) : (
        <Box sx={[emptyAvatarSx, error && { borderColor: "error.main" }]}>
          <AddRoundedIcon aria-hidden />
        </Box>
      )}
      <Typography
        variant="body2"
        sx={[
          nameSx,
          !account && { color: "text.disabled", fontWeight: 600 },
          error && { color: "error.main" },
        ]}
      >
        {account?.name ?? t.selectAccount}
      </Typography>
      {account && (
        <Typography variant="caption" sx={currencySx}>
          {account.currency}
        </Typography>
      )}
    </>
  );
  return (
    <Stack sx={sideSx}>
      <Typography variant="caption" sx={sideLabelSx}>
        {label}
      </Typography>
      {readOnly ? (
        <Stack sx={sideButtonSx}>{content}</Stack>
      ) : (
        <ButtonBase
          aria-label={t.changeAccount(label, account?.name ?? t.selectAccount)}
          data-invalid={error || undefined}
          onClick={onClick}
          sx={[sideButtonSx, { flexDirection: "column" }]}
        >
          {content}
        </ButtonBase>
      )}
    </Stack>
  );
}

const sidesSx = {
  alignItems: "flex-start",
  justifyContent: "center",
  gap: 1,
  pb: 1,
  width: "100%",
};
const sideSx = { alignItems: "center", flex: "0 1 136px", minWidth: 0 };
const sideLabelSx = { color: "text.secondary", fontWeight: 700, pb: 0.5 };
const sideButtonSx = {
  alignItems: "center",
  borderRadius: `${designTokens.radius.sm}px`,
  gap: 0.5,
  maxWidth: "100%",
  px: 0.5,
  py: 0.5,
};
const emptyAvatarSx = {
  alignItems: "center",
  border: "1.5px dashed",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  color: "text.disabled",
  display: "flex",
  height: 48,
  justifyContent: "center",
  width: 48,
};
const nameSx = {
  display: "-webkit-box",
  fontWeight: 800,
  overflow: "hidden",
  overflowWrap: "anywhere",
  textAlign: "center",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
};
const currencySx = { color: "text.secondary", fontWeight: 700 };
// 箭头与账户图标垂直居中：标签高度 + 图标一半。
const arrowSx = { flexShrink: 0, mt: 4.5 };
