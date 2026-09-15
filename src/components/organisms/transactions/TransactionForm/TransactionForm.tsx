"use client";

import type { ReactNode } from "react";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
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
import { routePaths } from "config/paths";
import { TransactionDateTimePicker } from "molecules/transactions/TransactionDateTimePicker";
import { TransactionFormHeader } from "organisms/transactions/TransactionFormHeader/TransactionFormHeader";
import { getMerchantInitial } from "utils/merchants";
import { TransactionItemPickerDrawer } from "../TransactionItemPickerDrawer/TransactionItemPickerDrawer";
import { TransactionItemsSection } from "../TransactionItemsSection/TransactionItemsSection";
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
import { useTransactionIncomeLinks } from "./TransactionIncomeLinksContext";
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
  loadRefundGroupItemsAction,
  loadRefundMoreGroupsAction,
  loadRefundSearchPageAction,
  loadReimbursementGroupItemsAction,
  loadReimbursementMoreGroupsAction,
  loadReimbursementSearchPageAction,
  refundPickerView,
  reimbursementPickerView,
  onSubmitDisabledChange,
  submitLabel = "保存记账",
  title = "新增记账",
  transactionItemSpecialStatusEnabled = false,
  typeNavigation,
}: TransactionFormProps) {
  const incomeLinksContext = useTransactionIncomeLinks();
  const activeRefundPickerView =
    incomeLinksContext?.refundPickerView ?? refundPickerView;
  const activeLoadRefundGroupItemsAction =
    incomeLinksContext?.loadRefundGroupItemsAction ??
    loadRefundGroupItemsAction;
  const activeLoadRefundMoreGroupsAction =
    incomeLinksContext?.loadRefundMoreGroupsAction ??
    loadRefundMoreGroupsAction;
  const activeLoadRefundSearchPageAction =
    incomeLinksContext?.loadRefundSearchPageAction ??
    loadRefundSearchPageAction;
  const activeReimbursementPickerView =
    incomeLinksContext?.reimbursementPickerView ?? reimbursementPickerView;
  const activeLoadReimbursementGroupItemsAction =
    incomeLinksContext?.loadReimbursementGroupItemsAction ??
    loadReimbursementGroupItemsAction;
  const activeLoadReimbursementMoreGroupsAction =
    incomeLinksContext?.loadReimbursementMoreGroupsAction ??
    loadReimbursementMoreGroupsAction;
  const activeLoadReimbursementSearchPageAction =
    incomeLinksContext?.loadReimbursementSearchPageAction ??
    loadReimbursementSearchPageAction;
  const {
    accountFieldRef,
    allNormalCategoryOptions,
    categoryGroups,
    closeSheet,
    editingItemId,
    fieldErrors,
    handleAccountChange,
    handleDateChange,
    handleMerchantChange,
    handleNoteChange,
    handlePickerAdd,
    handlePickerAmountChange,
    handlePickerCategoryToggle,
    handlePickerGroupSelect,
    handleSubmit,
    handleTimeChange,
    isSheetOpen,
    isSubmitDisabled,
    linkNotice,
    itemSummaries,
    itemsFieldRef,
    merchantFieldRef,
    openItemSheet,
    openSheet,
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
    selectedAccountId,
    selectedCategoryGroup,
    selectedMerchant,
    selectedMerchantId,
    selectedType,
    setPickerSpecialStatus,
    setPickerRefundCandidate,
    setPickerReimbursementCandidate,
    signedTotalAmount,
    timeZoneOffsetMinutes,
    transactionAtValue,
    transactionDate,
    transactionTime,
    updateItem,
  } = useTransactionForm({
    accountOptions,
    categoryOptions,
    initialType,
    initialValues,
    merchantOptions,
    onSubmitDisabledChange,
  });

  return (
    <form id={formId} action={action} onSubmit={handleSubmit}>
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

        <input
          name="timeZoneOffsetMinutes"
          readOnly
          type="hidden"
          value={timeZoneOffsetMinutes}
        />
        <input
          name="transactionAt"
          readOnly
          type="hidden"
          value={transactionAtValue}
        />
        {initialValues?.transactionRecordId ? (
          <input
            name="transactionRecordId"
            type="hidden"
            value={initialValues.transactionRecordId}
          />
        ) : null}
        <input name="type" type="hidden" value={selectedType} />

        <Box ref={merchantFieldRef} sx={selectionFieldGroupSx}>
          <SectionTitle>商家</SectionTitle>
          <TextField
            disabled={merchantOptions.length === 0}
            error={!!fieldErrors.merchant}
            fullWidth
            helperText={
              fieldErrors.merchant ??
              (merchantOptions.length === 0 ? "请先新增商家。" : undefined)
            }
            label="商家"
            name="merchantId"
            onChange={(event) => handleMerchantChange(event.target.value)}
            select
            slotProps={{
              select: {
                displayEmpty: true,
                IconComponent: KeyboardArrowRightRoundedIcon,
                renderValue: () => (
                  <TransactionSelectionValue
                    icon={<StorefrontRoundedIcon fontSize="small" />}
                    text={selectedMerchant?.name ?? "选择商家"}
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
          <SectionTitle>付款账户</SectionTitle>
          <TextField
            disabled={accountOptions.length === 0}
            error={!!fieldErrors.account}
            fullWidth
            helperText={
              fieldErrors.account ??
              (accountOptions.length === 0 ? "请先新增账户。" : undefined)
            }
            label="账户"
            name="accountId"
            onChange={(event) => handleAccountChange(event.target.value)}
            select
            slotProps={{
              select: {
                displayEmpty: true,
                IconComponent: KeyboardArrowRightRoundedIcon,
                renderValue: () => (
                  <TransactionSelectionValue
                    icon={<AccountBalanceWalletRoundedIcon fontSize="small" />}
                    text={
                      selectedAccount
                        ? `${selectedAccount.name}（${selectedAccount.currency}）`
                        : "选择账户"
                    }
                    tone="account"
                  />
                ),
              },
            }}
            value={selectedAccountId}
            sx={transactionSelectionSelectSx}
          >
            <MenuItem disabled value="">
              请选择账户
            </MenuItem>
            {accountOptions.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}（{account.currency}）
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <TransactionItemsSection
          fieldError={fieldErrors.items}
          hasCategoryOptions={allNormalCategoryOptions.length > 0}
          itemsFieldRef={itemsFieldRef}
          itemSummaries={itemSummaries}
          onOpenItem={openItemSheet}
          onOpenSheet={openSheet}
          onUpdateItem={updateItem}
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

      <TransactionItemPickerDrawer
        categoryGroups={categoryGroups}
        frequentCategoryIds={frequentCategoryIds}
        filteredCategoryOptions={allNormalCategoryOptions}
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
        refundPickerView={activeRefundPickerView}
        loadRefundGroupItemsAction={activeLoadRefundGroupItemsAction}
        loadRefundMoreGroupsAction={activeLoadRefundMoreGroupsAction}
        loadRefundSearchPageAction={activeLoadRefundSearchPageAction}
        reimbursementPickerView={activeReimbursementPickerView}
        loadReimbursementGroupItemsAction={
          activeLoadReimbursementGroupItemsAction
        }
        loadReimbursementMoreGroupsAction={
          activeLoadReimbursementMoreGroupsAction
        }
        loadReimbursementSearchPageAction={
          activeLoadReimbursementSearchPageAction
        }
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
