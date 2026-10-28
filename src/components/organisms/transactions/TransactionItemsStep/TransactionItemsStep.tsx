"use client";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { EmptyState } from "molecules/ui/EmptyState";
import { TransactionStepItemsCard } from "organisms/transactions/TransactionStepItemsCard/TransactionStepItemsCard";
import { TransactionItemAmountDrawer } from "organisms/transactions/TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { TransactionItemPickerDrawer } from "organisms/transactions/TransactionItemPickerDrawer/TransactionItemPickerDrawer";
import { TransactionPaymentFields } from "organisms/transactions/TransactionPaymentFields/TransactionPaymentFields";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher/TransactionAmountKeypadLauncher";
import { publicAssetUrl } from "utils/publicAssetUrl";
import { useTransactionItemsStep } from "./useTransactionItemsStep";
import type { TransactionItemsStepProps } from "./TransactionItemsStep.types";

export function TransactionItemsStep(props: TransactionItemsStepProps) {
  const w = useTransactionItemsStep(props);
  const f = w.form;
  return (
    <Stack spacing={2} useFlexGap sx={{ flex: 1 }}>
      <Typography variant="h6">{m.itemsTitle}</Typography>
      {w.automaticItemIds.length > 0 && (
        <Alert severity="info">
          {m.automaticNotice(w.automaticItemIds.length)}
        </Alert>
      )}
      {props.merchantHasHistory === false && f.itemSummaries.length === 0 ? (
        <EmptyState
          title={m.noUsualItems}
          description={m.noUsualItemsHint}
          illustration={
            <Box
              component="img"
              alt=""
              src={publicAssetUrl(
                "/assets/kura-dashboard-recent/recent_illustration_amber_warmth.png",
              )}
              sx={{ width: 180, maxWidth: "100%" }}
            />
          }
          action={
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={f.openSheet}
            >
              {m.addItem}
            </Button>
          }
        />
      ) : (
        <TransactionStepItemsCard
          items={f.itemSummaries}
          automaticItemIds={w.automaticItemIds}
          currency={w.currency ?? ""}
          expenseTotal={f.expenseTotal}
          incomeTotal={f.incomeTotal}
          hasCategoryOptions={props.categoryOptions.length > 0}
          onAdd={f.openSheet}
          onEdit={f.openItemSheet}
          onAmount={w.setAmountItemId}
          onRemove={f.removeItem}
        />
      )}
      {f.linkNotice && <Alert severity="info">{f.linkNotice}</Alert>}
      {!f.isMultiAccount && w.canAddPayment && (
        <Button
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={() => void f.handleAddPayment()}
        >
          {m.addSharedPayment}
        </Button>
      )}
      {f.isMultiAccount && (
        <>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {m.paymentTitle}
            </Typography>
            <TransactionPaymentFields
              stepFlow
              accountOptions={props.accountOptions}
              payments={f.payments}
              reconciliation={f.paymentReconciliation}
              fieldError={f.accountFieldError ?? undefined}
              multiAccountPaymentEnabled={w.canAddPayment}
              onAddPayment={() => void f.handleAddPayment()}
              onAccountChange={f.handlePaymentAccountChange}
              onAmountChange={f.handlePaymentAmountChange}
              onAmountCommit={f.handlePaymentAmountCommit}
              onRemovePayment={f.handleRemovePayment}
              showEmptyAccountHelper={false}
            />
          </Paper>
          <TransactionAmountKeypadLauncher />
        </>
      )}
      <Box
        sx={{
          mt: "auto",
          position: "sticky",
          bottom: 0,
          py: 1,
          bgcolor: "background.paper",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          disabled={!w.ready}
          onClick={props.onConfirm}
        >
          {props.returning ? m.returnToConfirm : m.toConfirm}
        </Button>
      </Box>
      <TransactionItemPickerDrawer
        {...props}
        inWizard
        showFrequentCategories={false}
        showAmountInput={false}
        frequentCategoryIds={[]}
        categoryGroups={f.categoryGroups}
        filteredCategoryOptions={f.allNormalCategoryOptions}
        editingItemId={f.editingItemId}
        linkNotice={f.linkNotice}
        open={f.isSheetOpen}
        onClose={f.closeSheet}
        pickerAmount={f.pickerAmount}
        pickerCategoryId={f.pickerCategoryId}
        pickerErrors={f.pickerErrors}
        pickerSpecialStatus={f.pickerSpecialStatus}
        specialStatusLocked={f.pickerSpecialStatusLocked}
        pickerRefundCandidate={f.pickerRefundCandidate}
        pickerReimbursementCandidate={f.pickerReimbursementCandidate}
        selectedAccountCurrency={w.currency}
        selectedCategoryGroup={f.selectedCategoryGroup}
        specialStatusEnabled={props.transactionItemSpecialStatusEnabled}
        incomeCategoriesDisabled={f.isMultiAccount}
        onAmountChange={f.handlePickerAmountChange}
        onCategoryToggle={f.handlePickerCategoryToggle}
        onGroupSelect={f.handlePickerGroupSelect}
        onPickerAdd={f.handlePickerAdd}
        onRemoveItem={f.removeItem}
        onSpecialStatusChange={f.setPickerSpecialStatus}
        onRefundItemChange={f.setPickerRefundCandidate}
        onReimbursementItemChange={f.setPickerReimbursementCandidate}
      />
      <TransactionItemAmountDrawer
        open={!!w.amountItem}
        title={
          w.amountItem?.category
            ? [w.amountItem.category.parentName, w.amountItem.category.name]
                .filter(Boolean)
                .join(" · ")
            : m.missingCategory
        }
        categoryId={w.amountItem?.categoryId}
        currency={w.currency ?? ""}
        value={w.amountItem?.amount ?? ""}
        quickAmounts={props.suggestions?.quickAmounts}
        onChange={w.updateAmount}
        onConfirm={w.confirmAmount}
        onClose={() => w.setAmountItemId(null)}
      />
    </Stack>
  );
}
