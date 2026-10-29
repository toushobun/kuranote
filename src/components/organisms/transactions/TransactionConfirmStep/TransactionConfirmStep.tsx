"use client";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import {
  formatDateOnlyLabel,
  formatDateValue,
} from "molecules/transactions/TransactionDateTimePicker/dateTimePickerUtils";
import { TransactionBottomEditorDrawer } from "molecules/transactions/TransactionBottomEditorDrawer/TransactionBottomEditorDrawer";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { designTokens } from "theme/theme";
import { formatUnsignedCurrencyAmount } from "utils/transactions";
import { TransactionFormHiddenFields } from "../TransactionFormHiddenFields/TransactionFormHiddenFields";
import { TransactionStepAmountEditor } from "../TransactionStepAmountEditor/TransactionStepAmountEditor";
import { TransactionStepItemPicker } from "../TransactionStepItemPicker/TransactionStepItemPicker";
import {
  formatStepItemAmount,
  formatStepItemCategory,
  formatStepNetTotal,
} from "../transactionStepFlowFormat";
import type { TransactionItemsStepProps } from "../TransactionItemsStep/TransactionItemsStep.types";
import { useTransactionConfirmStep } from "./useTransactionConfirmStep";

export type TransactionConfirmStepProps = TransactionItemsStepProps & {
  action: (data: FormData) => void;
  errorMessage?: string;
  successMessage?: string;
  saving: boolean;
  goToStep: (step: number) => void;
};

/** 确认步骤（#943 走查修订，设计图 7）：小票风格展示，点击各行回到对应编辑入口。 */
export function TransactionConfirmStep(props: TransactionConfirmStepProps) {
  const f = props.form;
  const w = useTransactionConfirmStep(
    f,
    props.goToStep,
    props.onAmountItemChange,
  );
  const currency = f.selectedAccount?.currency ?? "";
  const total = formatStepNetTotal(f.expenseTotal, f.incomeTotal, currency);
  const dateTime = `${formatDateOnlyLabel(
    f.transactionDate,
    formatDateValue(new Date()),
  )} ${f.transactionTime.slice(0, 5)}`;
  const paymentStep = f.isMultiAccount ? 3 : 2;
  return (
    <>
      <Box component="form" action={props.action} onSubmit={f.handleSubmit}>
        <TransactionFormHiddenFields form={f} includeVisibleFields />
        <Stack spacing={2}>
          {props.errorMessage && (
            <Alert severity="error">{props.errorMessage}</Alert>
          )}
          {props.successMessage && (
            <Alert severity="success">{props.successMessage}</Alert>
          )}
          {w.issues.map((issue) => (
            <Alert key={issue.message} severity="error">
              <ButtonBase onClick={issue.onClick} sx={{ textAlign: "left" }}>
                {issue.message}
              </ButtonBase>
            </Alert>
          ))}
          <Box sx={receiptShadowSx}>
            <Box sx={receiptPaperSx}>
              <Stack sx={{ alignItems: "center", pb: 1.5 }}>
                {f.selectedMerchant && (
                  <MerchantAvatar
                    size={56}
                    toneKey={f.selectedMerchant.id}
                    src={f.selectedMerchant.icon_url ?? undefined}
                  />
                )}
                <ReceiptRow
                  centered
                  label={m.merchant}
                  value={f.selectedMerchant?.name ?? m.selectMerchant}
                  error={!f.selectedMerchant}
                  onClick={() => props.goToStep(1)}
                >
                  <Typography sx={merchantNameSx}>
                    {f.selectedMerchant?.name ?? m.selectMerchant}
                  </Typography>
                </ReceiptRow>
                <ReceiptRow
                  centered
                  label={m.time}
                  value={dateTime}
                  error={!f.transactionAtValue}
                  onClick={() => w.setEditor("time")}
                >
                  <Typography variant="body2" sx={mutedTextSx}>
                    {dateTime}
                  </Typography>
                </ReceiptRow>
              </Stack>
              <Box sx={sectionSx}>
                {f.itemSummaries.length === 0 && (
                  <Typography
                    data-invalid="true"
                    sx={{ color: "error.main", py: 0.75 }}
                  >
                    {m.missingItems}
                  </Typography>
                )}
                {f.itemSummaries.map((item, index) => {
                  const name = formatStepItemCategory(item.category);
                  const amount = formatStepItemAmount(item, currency);
                  return (
                    <ReceiptRow
                      key={item.id}
                      label={m.itemLabel(index + 1)}
                      value={`${name} ${amount}`}
                      error={w.invalidItems.includes(item)}
                      onClick={() => f.openItemSheet(item.id)}
                    >
                      <AmountLine label={name} amount={amount} />
                    </ReceiptRow>
                  );
                })}
                <Button
                  fullWidth
                  startIcon={<AddRoundedIcon />}
                  onClick={f.openSheet}
                  disabled={props.categoryOptions.length === 0}
                >
                  {m.addItem}
                </Button>
              </Box>
              <Stack
                direction="row"
                sx={[sectionSx, { alignItems: "center", py: 1.5 }]}
              >
                <Typography sx={{ flex: 1, fontSize: 18, fontWeight: 800 }}>
                  {m.total}
                </Typography>
                <Typography color="primary" sx={totalAmountSx}>
                  {total}
                </Typography>
              </Stack>
              <Box sx={sectionSx}>
                <Typography variant="caption" sx={sectionTitleSx}>
                  {m.payment}
                </Typography>
                {f.selectedAccount ? (
                  f.payments.map((payment, index) => {
                    const account = f.isMultiAccount
                      ? props.accountOptions.find(
                          (option) => option.id === payment.accountId,
                        )
                      : f.selectedAccount;
                    const amount = f.isMultiAccount
                      ? payment.amount.trim()
                        ? formatUnsignedCurrencyAmount(payment.amount, currency)
                        : m.pendingAmount
                      : total;
                    const name = account?.name ?? m.selectAccount;
                    return (
                      <ReceiptRow
                        key={payment.key}
                        label={m.paymentAccountLabel(index + 1)}
                        value={`${name} ${account?.currency ?? ""} ${amount}`}
                        error={w.accountError}
                        onClick={() => props.goToStep(paymentStep)}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center", minWidth: 0 }}
                        >
                          <AccountBalanceWalletRoundedIcon
                            fontSize="small"
                            color="primary"
                          />
                          <Typography noWrap sx={{ flex: 1 }}>
                            {name}
                          </Typography>
                          <Typography variant="body2" sx={mutedTextSx}>
                            {account?.currency}
                          </Typography>
                          <Typography sx={amountSx}>{amount}</Typography>
                        </Stack>
                      </ReceiptRow>
                    );
                  })
                ) : (
                  <ReceiptRow
                    label={m.paymentAccountLabel(1)}
                    value={m.selectAccount}
                    error
                    onClick={() => props.goToStep(paymentStep)}
                  >
                    <Typography>{m.selectAccount}</Typography>
                  </ReceiptRow>
                )}
              </Box>
              <Box sx={sectionSx}>
                <Typography variant="caption" sx={sectionTitleSx}>
                  {m.note}
                </Typography>
                <ReceiptRow
                  label={m.note}
                  value={f.note || m.addNote}
                  onClick={() => w.setEditor("note")}
                >
                  <Typography
                    sx={[
                      { overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
                      !f.note && { color: "text.disabled" },
                    ]}
                  >
                    {f.note || m.addNote}
                  </Typography>
                </ReceiptRow>
              </Box>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            loading={props.saving}
            disabled={w.issues.length > 0 || f.isSubmitDisabled || props.saving}
          >
            {props.saving ? m.saving : m.save}
          </Button>
        </Stack>
      </Box>
      <TransactionBottomEditorDrawer
        open={w.editor === "note"}
        title={m.note}
        onClose={() => w.setEditor(null)}
      >
        <TextField
          label={m.note}
          multiline
          minRows={4}
          fullWidth
          value={f.note}
          onChange={f.handleNoteChange}
          helperText={m.noteCount(f.note.length)}
          slotProps={{ htmlInput: { maxLength: m.noteLimit } }}
        />
      </TransactionBottomEditorDrawer>
      {w.editor === "time" && (
        <TransactionDateTimePicker
          date={f.transactionDate}
          time={f.transactionTime}
          onDateChange={f.handleDateChange}
          onTimeChange={f.handleTimeChange}
          editor={{
            open: true,
            onClose: () => w.setEditor(null),
            title: m.time,
          }}
        />
      )}
      <TransactionStepItemPicker {...props} />
      <TransactionStepAmountEditor {...props} />
    </>
  );
}

/** 小票中可点击的一行：整行可点，右侧浅色铅笔对齐在小票最右侧同一条竖线上。 */
function ReceiptRow({
  label,
  value,
  children,
  onClick,
  error = false,
  centered = false,
}: {
  label: string;
  value: string;
  children: ReactNode;
  onClick: () => void;
  error?: boolean;
  centered?: boolean;
}) {
  return (
    <ButtonBase
      aria-label={m.editReceiptRow(label, value)}
      onClick={onClick}
      data-invalid={error || undefined}
      sx={[
        receiptRowSx,
        centered && centeredRowSx,
        error && { color: "error.main", "& .MuiTypography-root": errorTextSx },
      ]}
    >
      {centered && <Box component="span" />}
      <Box sx={{ minWidth: 0, textAlign: centered ? "center" : "left" }}>
        {children}
      </Box>
      <EditOutlinedIcon aria-hidden sx={pencilSx} />
    </ButtonBase>
  );
}

function AmountLine({ label, amount }: { label: string; amount: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
      <Typography noWrap sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography sx={amountSx}>{amount}</Typography>
    </Stack>
  );
}

const pencilSize = 18;
// 锯齿高度为齿宽的一半；上下各一排，用 mask 裁出纸片边缘，不使用图片资源。
const toothWidth = 16;
const tornEdgeMask = [
  `conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${toothWidth}px 51% repeat-x`,
  `conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) top / ${toothWidth}px 51% repeat-x`,
].join(", ");

// mask 会裁掉 box-shadow，阴影改由外层 drop-shadow 沿纸片轮廓绘制。
const receiptShadowSx = {
  filter: `drop-shadow(${designTokens.shadow.card})`,
};
const receiptPaperSx = {
  bgcolor: "background.paper",
  mask: tornEdgeMask,
  WebkitMask: tornEdgeMask,
  px: 2.5,
  pt: 3.5,
  pb: 3,
};
const receiptRowSx = {
  display: "grid",
  gridTemplateColumns: `minmax(0, 1fr) ${pencilSize}px`,
  alignItems: "center",
  columnGap: 1,
  width: "100%",
  minHeight: 36,
  py: 0.5,
  borderRadius: `${designTokens.radius.sm}px`,
  color: "text.primary",
  textAlign: "left",
};
// 居中的抬头行左侧放一个与铅笔同宽的占位，使文字在整张小票中居中。
const centeredRowSx = {
  gridTemplateColumns: `${pencilSize}px minmax(0, 1fr) ${pencilSize}px`,
};
const errorTextSx = { color: "error.main" };
const pencilSx = { color: "text.disabled", fontSize: pencilSize };
const sectionSx = {
  borderTop: "1px dashed",
  borderColor: "divider",
  py: 1,
};
const sectionTitleSx = {
  color: "text.secondary",
  display: "block",
  fontWeight: 700,
  pt: 0.5,
};
const mutedTextSx = { color: "text.secondary" };
const merchantNameSx = { fontSize: 20, fontWeight: 800 };
const amountSx = {
  ...designTokens.typography.style.amount,
  fontWeight: 700,
  flexShrink: 0,
};
const totalAmountSx = {
  ...designTokens.typography.style.amount,
  fontSize: 32,
};
