"use client";

import type { ReactNode } from "react";

import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { ReadOnlyFieldset } from "atoms/ui/ReadOnlyFieldset";
import { routePaths } from "config/paths";
import { transactionSetupHintMessages } from "config/transactionMessages";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import { TransactionFormHeader } from "organisms/transactions/TransactionFormHeader/TransactionFormHeader";
import { TransactionFormHiddenFields } from "../TransactionFormHiddenFields/TransactionFormHiddenFields";
import { getMerchantInitial } from "utils/merchants";
import { transactionAccountSectionMessages } from "utils/transactionMessages";
import { TransactionSetupHintCard } from "../TransactionSetupHintCard/TransactionSetupHintCard";
import { getNormalTransactionSetupHint } from "../TransactionSetupHintCard/transactionSetupHint";
import { TransactionItemPickerDrawer } from "../TransactionItemPickerDrawer/TransactionItemPickerDrawer";
import { TransactionItemsSection } from "../TransactionItemsSection/TransactionItemsSection";
import { TransactionPaymentFields } from "../TransactionPaymentFields/TransactionPaymentFields";
import { TransactionSummarySection } from "../TransactionSummarySection/TransactionSummarySection";
import {
  TransactionSelectionValue,
  transactionSelectionSelectSx,
} from "../TransactionSelectionValue/TransactionSelectionValue";
import {
  transactionFieldGroupSx,
  transactionFormStackSx,
  transactionNoteFieldSx,
  transactionSectionTitleSx,
  transactionSubmitButtonSx,
} from "./TransactionForm.styles";
import type { TransactionFormProps } from "./TransactionForm.types";
import { useResolvedTransactionIncomeLinks } from "./TransactionIncomeLinksContext";
import { useTransactionForm } from "./useTransactionForm";

export type { TransactionFormInitialValues } from "./TransactionForm.types";

export function TransactionForm({
  action,
  accountOptions,
  categoryOptions,
  closeHref = routePaths.transactions,
  errorMessage,
  formId = "new-transaction-form",
  frequentCategoryIds = [],
  hideHeader = false,
  hideSubmitButton = false,
  initialType,
  initialValues,
  ledgerName,
  merchantOptions,
  multiAccountPaymentEnabled = false,
  loadRefundGroupItemsAction,
  loadRefundMoreGroupsAction,
  loadRefundSearchPageAction,
  loadReimbursementGroupItemsAction,
  loadReimbursementMoreGroupsAction,
  loadReimbursementSearchPageAction,
  refundPickerView,
  reimbursementPickerView,
  onSubmitDisabledChange,
  readOnly = false,
  setupHrefs,
  submitLabel = "保存记账",
  title = "新增记账",
  transactionItemSpecialStatusEnabled = false,
  typeNavigation,
}: TransactionFormProps) {
  const incomeLinks = useResolvedTransactionIncomeLinks({
    loadRefundGroupItemsAction,
    loadRefundMoreGroupsAction,
    loadRefundSearchPageAction,
    loadReimbursementGroupItemsAction,
    loadReimbursementMoreGroupsAction,
    loadReimbursementSearchPageAction,
    refundPickerView,
    reimbursementPickerView,
  });
  const form = useTransactionForm({
    accountOptions,
    categoryOptions,
    initialType,
    initialValues,
    merchantOptions,
    onSubmitDisabledChange,
  });
  const {
    accountFieldRef,
    allNormalCategoryOptions,
    categoryGroups,
    closeSheet,
    editingItemId,
    fieldErrors,
    handleAddPayment,
    handleDateChange,
    handleMerchantChange,
    handleNoteChange,
    handlePickerAdd,
    handlePickerAmountChange,
    handlePickerCategoryToggle,
    handlePickerGroupSelect,
    handlePaymentAccountChange,
    handlePaymentAmountChange,
    handlePaymentAmountCommit,
    handleRemovePayment,
    handleSubmit,
    handleTimeChange,
    isMultiAccount,
    isSheetOpen,
    isSubmitDisabled,
    linkNotice,
    itemSummaries,
    itemsFieldRef,
    merchantFieldRef,
    openItemSheet,
    openSheet,
    paymentReconciliation,
    payments,
    pickerAmount,
    pickerCategoryId,
    pickerErrors,
    pickerRefundCandidate,
    pickerReimbursementCandidate,
    pickerSpecialStatus,
    pickerSpecialStatusLocked,
    removeItem,
    businessTotalAmount,
    selectedAccount,
    selectedCategoryGroup,
    selectedMerchant,
    selectedMerchantId,
    selectedType,
    setPickerSpecialStatus,
    setPickerRefundCandidate,
    setPickerReimbursementCandidate,
    signedTotalAmount,
    transactionDate,
    transactionTime,
    updateItem,
  } = form;

  // 只有传入添加入口（新建记账）时才显示缺少账户 / 商家的提示卡片。
  const setupHint = setupHrefs
    ? getNormalTransactionSetupHint({
        accountCount: accountOptions.length,
        merchantCount: merchantOptions.length,
      })
    : null;
  const hasNoMerchant = merchantOptions.length === 0;
  const hasNoAccount = accountOptions.length === 0;

  return (
    <form id={formId} action={action} onSubmit={handleSubmit}>
      <ReadOnlyFieldset readOnly={readOnly}>
        <Stack spacing={0} sx={transactionFormStackSx}>
          {hideHeader ? null : (
            <TransactionFormHeader
              closeHref={closeHref}
              isSubmitDisabled={isSubmitDisabled}
              ledgerName={ledgerName}
              title={title}
            />
          )}

          {typeNavigation}

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          {linkNotice ? <Alert severity="info">{linkNotice}</Alert> : null}
          {setupHint && setupHrefs ? (
            <TransactionSetupHintCard
              addAccountHref={setupHrefs.account}
              addMerchantHref={setupHrefs.merchant}
              hint={setupHint}
            />
          ) : null}

          <TransactionFormHiddenFields
            form={form}
            initialValues={initialValues}
          />

          <Box ref={merchantFieldRef} sx={selectionFieldGroupSx}>
            <SectionTitle>商家</SectionTitle>
            <TextField
              disabled={hasNoMerchant}
              error={!!fieldErrors.merchant}
              fullWidth
              helperText={
                fieldErrors.merchant ??
                (hasNoMerchant && !setupHint ? "请先新增商家。" : undefined)
              }
              label="商家"
              name="merchantId"
              onChange={(event) => handleMerchantChange(event.target.value)}
              select
              slotProps={{
                input: { readOnly },
                select: {
                  displayEmpty: true,
                  IconComponent: KeyboardArrowRightRoundedIcon,
                  renderValue: () => (
                    <TransactionSelectionValue
                      icon={<StorefrontRoundedIcon fontSize="small" />}
                      muted={hasNoMerchant}
                      text={
                        selectedMerchant?.name ??
                        (hasNoMerchant
                          ? transactionSetupHintMessages.emptyMerchant
                          : "选择商家")
                      }
                      tone="merchant"
                    />
                  ),
                },
              }}
              value={selectedMerchantId}
              sx={transactionSelectionSelectSx}
            >
              <MenuItem disabled value="">
                请选择商家
              </MenuItem>
              {merchantOptions.map((merchant) => (
                <MenuItem key={merchant.id} value={merchant.id}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Avatar
                      alt={merchant.name}
                      src={merchant.icon_url ?? undefined}
                      sx={{ height: 24, width: 24 }}
                    >
                      {getMerchantInitial(merchant.name)}
                    </Avatar>
                    <span>{merchant.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box ref={accountFieldRef} sx={selectionFieldGroupSx}>
            <SectionTitle>
              {transactionAccountSectionMessages.title}
            </SectionTitle>
            <TransactionPaymentFields
              accountOptions={accountOptions}
              fieldError={fieldErrors.account}
              multiAccountPaymentEnabled={multiAccountPaymentEnabled}
              onAccountChange={handlePaymentAccountChange}
              onAddPayment={handleAddPayment}
              onAmountChange={handlePaymentAmountChange}
              onAmountCommit={handlePaymentAmountCommit}
              onRemovePayment={handleRemovePayment}
              payments={payments}
              readOnly={readOnly}
              reconciliation={paymentReconciliation}
              showEmptyAccountHelper={hasNoAccount && !setupHint}
            />
          </Box>

          <TransactionItemsSection
            fieldError={fieldErrors.items}
            hasCategoryOptions={allNormalCategoryOptions.length > 0}
            itemsFieldRef={itemsFieldRef}
            itemSummaries={itemSummaries}
            onOpenItem={openItemSheet}
            onOpenSheet={openSheet}
            onUpdateItem={updateItem}
            readOnly={readOnly}
            selectedAccountCurrency={selectedAccount?.currency}
            selectedType={selectedType}
            businessTotalAmount={businessTotalAmount}
            signedTotalAmount={signedTotalAmount}
          />

          <Box sx={transactionFieldGroupSx}>
            <SectionTitle>备注</SectionTitle>
            <TextField
              defaultValue={initialValues?.note ?? ""}
              fullWidth
              hiddenLabel
              multiline
              name="note"
              onChange={handleNoteChange}
              placeholder="记录这次生活的小片段…"
              rows={1}
              size="small"
              sx={transactionNoteFieldSx}
            />
          </Box>

          <TransactionDateTimePicker
            date={transactionDate}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
            time={transactionTime}
          />

          <TransactionSummarySection
            itemSummaries={itemSummaries}
            paymentAccountCount={payments.length}
            selectedAccount={selectedAccount}
            selectedMerchant={selectedMerchant}
            businessTotalAmount={businessTotalAmount}
            signedTotalAmount={signedTotalAmount}
            transactionDate={transactionDate}
            transactionTime={transactionTime}
          />

          {hideSubmitButton ? null : (
            <PrimaryActionButton
              disabled={isSubmitDisabled}
              size="large"
              type="submit"
              sx={transactionSubmitButtonSx}
            >
              {submitLabel}
            </PrimaryActionButton>
          )}
        </Stack>
      </ReadOnlyFieldset>

      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        frequentCategoryIds={frequentCategoryIds}
        linkNotice={linkNotice}
        filteredCategoryOptions={allNormalCategoryOptions}
        incomeCategoriesDisabled={isMultiAccount}
        editingItemId={editingItemId}
        onAmountChange={handlePickerAmountChange}
        onCategoryToggle={handlePickerCategoryToggle}
        onClose={closeSheet}
        onGroupSelect={handlePickerGroupSelect}
        onPickerAdd={handlePickerAdd}
        onRemoveItem={removeItem}
        onRefundItemChange={setPickerRefundCandidate}
        onReimbursementItemChange={setPickerReimbursementCandidate}
        open={isSheetOpen}
        pickerAmount={pickerAmount}
        pickerCategoryId={pickerCategoryId}
        pickerErrors={pickerErrors}
        pickerRefundCandidate={pickerRefundCandidate}
        pickerReimbursementCandidate={pickerReimbursementCandidate}
        pickerSpecialStatus={pickerSpecialStatus ?? null}
        specialStatusLocked={pickerSpecialStatusLocked}
        selectedAccountCurrency={selectedAccount?.currency}
        selectedCategoryGroup={selectedCategoryGroup}
        {...incomeLinks}
        specialStatusEnabled={transactionItemSpecialStatusEnabled}
        incomeLinksEnabled
        onSpecialStatusChange={setPickerSpecialStatus}
      />
    </form>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subtitle1" sx={sectionTitleSx}>
      {children}
    </Typography>
  );
}

const selectionFieldGroupSx = transactionFieldGroupSx;

const sectionTitleSx = transactionSectionTitleSx;
