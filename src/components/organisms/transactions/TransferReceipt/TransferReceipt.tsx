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
import { getAmountDecimalPlaces } from "utils/transactionAmountInput";
import type {
  TransactionAccountOption,
  TransactionRecordType,
  TransferEditInitialValues,
} from "types/transactions";

import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { formatStepCurrencyAmount } from "../transactionStepFlowFormat";
import {
  useTransferReceipt,
  type LoadDailyTransferRate,
  type TransferSide,
} from "./useTransferReceipt";

type TransferReceiptProps = {
  formId: string;
  action: (formData: FormData) => void | Promise<void>;
  accountOptions: readonly TransactionAccountOption[];
  /** Storybook / 测试注入确定性汇率，实际页面默认读取同源 API。 */
  loadDailyRate?: LoadDailyTransferRate;
  /** 编辑转账时的原记录；不传为新增。 */
  initialValues?: TransferEditInitialValues;
  /** 编辑时提交原记录类型，服务端据此判断是否改了类型。 */
  sourceType?: TransactionRecordType;
  /** 只读详情（#928）：没有铅笔、提示条与保存按钮。 */
  readOnly?: boolean;
  errorMessage?: string | null;
  saving?: boolean;
  saveDisabled?: boolean;
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
    loadDailyRate: props.loadDailyRate,
  });
  const { dateTime } = w;
  const hasFee = !!w.feeAmount.trim();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readOnly || !w.checkIssues()) return;
    event.preventDefault();
    props.onValidationFailed?.();
  }
  const sideProps = (side: TransferSide) => ({
    side,
    account: side === "source" ? w.source : w.target,
    error: w.isMarked(side),
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
        <input
          name="transferFeeAmount"
          readOnly
          type="hidden"
          value={w.feeAmount}
        />
        <input
          name="transferTargetAmount"
          readOnly
          type="hidden"
          value={w.crossCurrency ? w.transferTargetAmount : ""}
        />
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
              label={w.crossCurrency ? t.sourceAmount : t.amount}
              labelCaption={w.crossCurrency ? w.currency : undefined}
              amount={
                w.amount.trim()
                  ? formatStepCurrencyAmount(w.amount, w.currency)
                  : ""
              }
              error={w.isMarked("amount")}
              onClick={readOnly ? undefined : () => w.setAmountSide("source")}
            />
            {w.crossCurrency && (
              <>
                <ReceiptAmountRow
                  label={t.targetAmount}
                  labelCaption={w.targetCurrency}
                  amount={
                    w.transferTargetAmount.trim()
                      ? formatStepCurrencyAmount(
                          w.transferTargetAmount,
                          w.targetCurrency,
                        )
                      : ""
                  }
                  error={w.isMarked("targetAmount")}
                  onClick={
                    readOnly ? undefined : () => w.setAmountSide("target")
                  }
                />
                <TransferRateDetails receipt={w} readOnly={readOnly} />
              </>
            )}
            {hasFee ? (
              <>
                <ReceiptAmountRow
                  label={t.fee}
                  amount={formatStepCurrencyAmount(w.feeAmount, w.currency)}
                  caption={t.feeDetails(w.source?.name ?? t.selectAccount)}
                  error={w.isMarked("fee")}
                  onClick={readOnly ? undefined : () => w.setFeeOpen(true)}
                />
                {w.amount.trim() && (
                  <Stack sx={{ alignItems: "flex-end", px: 2, pb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {t.feeTotalDebit(
                        w.source?.name ?? t.selectAccount,
                        formatStepCurrencyAmount(
                          String(Number(w.amount) + Number(w.feeAmount)),
                          w.currency,
                        ),
                      )}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t.feeTotalCredit(
                        w.target?.name ?? t.selectAccount,
                        formatStepCurrencyAmount(
                          w.crossCurrency ? w.transferTargetAmount : w.amount,
                          w.crossCurrency ? w.targetCurrency : w.currency,
                        ),
                      )}
                    </Typography>
                  </Stack>
                )}
              </>
            ) : !readOnly ? (
              <ButtonBase
                onClick={() => w.setFeeOpen(true)}
                sx={{
                  alignSelf: "flex-start",
                  color: "primary.main",
                  fontWeight: 700,
                  mx: 2,
                  my: 1,
                  p: 0.5,
                }}
              >
                {t.addFee}
              </ButtonBase>
            ) : null}
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
              disabled={props.saveDisabled}
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
        open={w.feeOpen}
        title={t.feeTitle(w.currency)}
        titleIsComplete
        currency={w.currency}
        value={w.feeAmount}
        description={t.feeDetails(w.source?.name ?? t.selectAccount)}
        onConfirm={w.confirmFeeAmount}
        onClose={() => w.setFeeOpen(false)}
        deleteLabel={hasFee ? t.removeFee : undefined}
        onDelete={hasFee ? w.removeFeeAmount : undefined}
      />
      <TransactionItemAmountDrawer
        open={w.amountSide !== null}
        titleIsComplete
        title={
          w.amountSide === "target"
            ? t.targetAmountTitle(w.targetCurrency)
            : w.crossCurrency
              ? t.sourceAmountTitle(w.currency)
              : t.amount
        }
        currency={w.amountSide === "target" ? w.targetCurrency : w.currency}
        value={w.amountSide === "target" ? w.transferTargetAmount : w.amount}
        onConfirm={w.confirmAmount}
        onClose={() => w.setAmountSide(null)}
      />
    </>
  );
}

/** 参考汇率只作展示：不会影响保存结构，也不会算成转账手续费。 */
function TransferRateDetails({
  receipt,
  readOnly,
}: {
  receipt: ReturnType<typeof useTransferReceipt>;
  readOnly: boolean;
}) {
  const actual = receipt.rate;
  if (receipt.rateLoading) return null;

  const daily = receipt.dailyRate;
  const rateDate = receipt.dailyRateDate;
  if (!daily || !rateDate) {
    if (!actual) return null;
    return (
      <Typography variant="caption" color="textSecondary" sx={rateTextSx}>
        {t.exchangeRate(actual.base, actual.quote, actual.value)}
      </Typography>
    );
  }

  if (!actual && !receipt.targetAmountEdited) return null;
  const difference = receipt.difference;
  const differenceAmount =
    difference && difference.diff !== 0
      ? t.arrivalDifference(
          difference.diff > 0,
          formatStepCurrencyAmount(
            Math.abs(difference.diff).toFixed(
              getAmountDecimalPlaces(receipt.targetCurrency),
            ),
            receipt.targetCurrency,
          ),
          receipt.targetCurrency,
          formatStepCurrencyAmount(
            difference.sourceEquivalent.toFixed(
              getAmountDecimalPlaces(receipt.currency),
            ),
            receipt.currency,
          ),
          receipt.currency,
          difference.percent.toFixed(1),
        )
      : null;

  return (
    <Stack spacing={0.5} sx={{ alignItems: "flex-end", px: 2, pb: 1.5 }}>
      {receipt.targetAmountEdited && actual && (
        <Typography variant="caption" color="textSecondary">
          {t.actualExchangeRate(actual.base, actual.quote, actual.value)}
        </Typography>
      )}
      <Typography variant="caption" color="textSecondary">
        {receipt.targetAmountEdited
          ? t.dailyExchangeRate(daily.base, daily.quote, daily.value, rateDate)
          : t.prefilledExchangeRate(
              daily.base,
              daily.quote,
              daily.value,
              rateDate,
            )}
      </Typography>
      {differenceAmount && (
        <Alert severity="info" sx={{ alignSelf: "stretch", width: "100%" }}>
          {differenceAmount}
        </Alert>
      )}
      {receipt.targetAmountEdited && !readOnly && (
        <ButtonBase
          onClick={receipt.restoreDailyRate}
          sx={{
            borderRadius: `${designTokens.radius.sm}px`,
            color: "primary.main",
            fontWeight: 700,
            p: 0.5,
            typography: "caption",
          }}
        >
          {t.restoreDailyRate}
        </ButtonBase>
      )}
    </Stack>
  );
}

const rateTextSx = {
  display: "block",
  px: 2,
  pb: 1.5,
  textAlign: "right",
} as const;

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
        <AccountAvatar
          iconUrl={account.icon_url}
          id={account.id}
          name={account.name}
          size={48}
        />
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
