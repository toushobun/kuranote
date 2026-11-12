import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useMemo, useState } from "react";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CloseIcon from "@mui/icons-material/Close";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import { TransactionItemAmountDrawer } from "../TransactionItemAmountDrawer/TransactionItemAmountDrawer";
import { formatUnsignedCurrencyAmount } from "utils/transactions";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { alpha, type Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { primaryActionButtonNoHoverBrightenSx } from "atoms/ui/PrimaryActionButton/primaryActionButtonSx";
import { transactionItemPickerMessages } from "config/transactionStepFlowMessages";
import type { TransactionSpecialStatus } from "internal/transaction";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { designTokens } from "theme/theme";
import { transactionPaymentFieldsMessages } from "utils/transactionMessages";
import type {
  TransactionCategoryOption,
  TransactionRefundCandidate,
} from "types/transactions";
import { TransactionPendingReimbursementCheckbox } from "../TransactionPendingReimbursementCheckbox/TransactionPendingReimbursementCheckbox";
import { TransactionLinkCandidatePanel } from "../TransactionLinkCandidatePanel/TransactionLinkCandidatePanel";

import type {
  CategoryPickerGroup,
  TransactionItemPickerMode,
  TransactionPickerErrors,
} from "../TransactionForm/TransactionForm.types";
import { matchesCategorySearch } from "./TransactionCategorySearch";

import type { TransactionIncomeLinksContextValue } from "../TransactionForm/TransactionIncomeLinksContext";

type TransactionItemPickerDrawerProps = TransactionIncomeLinksContextValue & {
  categoryGroups: CategoryPickerGroup[];
  editingItemId?: number | null;
  filteredCategoryOptions: TransactionCategoryOption[];
  // 退款 / 报销关联提示；抽屉打开时表单顶部的提示会被遮罩挡住，因此在抽屉内同步显示。
  linkNotice?: string | null;
  onCategoryToggle: (categoryId: string) => void;
  onClose: () => void;
  /** 切换大分类；带 categoryId 时同时选中它，否则选中该组第一个可用小分类。 */
  onGroupSelect: (groupId: string, categoryId?: string) => void;
  onPickerAdd: () => boolean;
  onPickerModeChange?: (mode: TransactionItemPickerMode) => void;
  onPickerAmountChange?: (amount: string) => void;
  onRemoveItem: (itemId: number) => void;
  onRefundItemChange?: (item: TransactionRefundCandidate | null) => void;
  onReimbursementItemChange?: (item: TransactionRefundCandidate | null) => void;
  onSpecialStatusChange?: (value: TransactionSpecialStatus | null) => void;
  open: boolean;
  pickerAmount: string;
  pickerMode?: TransactionItemPickerMode;
  pickerModeLocked?: boolean;
  pickerCategoryId: string;
  pickerErrors: TransactionPickerErrors;
  pickerRefundCandidate?: TransactionRefundCandidate | null;
  pickerReimbursementCandidate?: TransactionRefundCandidate | null;
  pickerSpecialStatus?: TransactionSpecialStatus | null;
  resolveLinkCandidate?: (candidate: TransactionRefundCandidate) => TransactionRefundCandidate;
  selectedAccountCurrency?: string;
  selectedCategoryGroup?: CategoryPickerGroup;
  specialStatusEnabled?: boolean;
  specialStatusLocked?: boolean;
  /** 多账户时禁用与现有明细相反的一类分类（#1044）。 */
  disabledCategoryType?: "income" | "expense";
  multiAccount?: boolean;
  merchantId?: string;
  merchantName?: string;
};

export function TransactionItemPickerDrawer({
  categoryGroups,
  editingItemId = null,
  filteredCategoryOptions,
  linkNotice = null,
  onCategoryToggle,
  onClose,
  onGroupSelect,
  onPickerAdd,
  onPickerModeChange = () => undefined,
  onPickerAmountChange = () => undefined,
  onRemoveItem,
  onRefundItemChange = () => undefined,
  onReimbursementItemChange = () => undefined,
  onSpecialStatusChange = () => undefined,
  open,
  pickerAmount,
  pickerMode = "expense",
  pickerModeLocked = false,
  pickerCategoryId,
  pickerErrors,
  pickerRefundCandidate = null,
  pickerReimbursementCandidate = null,
  pickerSpecialStatus = null,
  resolveLinkCandidate,
  selectedAccountCurrency,
  selectedCategoryGroup,
  loadRefundPageAction,
  loadReimbursementPageAction,
  specialStatusEnabled = false,
  specialStatusLocked = false,
  disabledCategoryType,
  multiAccount = false,
  merchantId,
  merchantName,
}: TransactionItemPickerDrawerProps) {
  useBackLayer(open, closeDrawer);
  const selectedCategoryType = filteredCategoryOptions.find(
    (category) => category.id === pickerCategoryId,
  )?.type;
  const [amountOpen, setAmountOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const isLinkedMode =
    pickerMode === "refund" || pickerMode === "reimbursement";
  const selectedCandidate =
    pickerMode === "refund"
      ? pickerRefundCandidate
      : pickerReimbursementCandidate;
  const adjustedSelectedCandidate = selectedCandidate
    ? (resolveLinkCandidate?.(selectedCandidate) ?? selectedCandidate)
    : null;
  const selectedIsSettled =
    adjustedSelectedCandidate !== null &&
    Number(adjustedSelectedCandidate.remainingRefundableAmount) <= 0;
  const displayedGroups = useMemo(() => {
    const typeGroups = categoryGroups.filter(
      (group) => group.categories[0]?.type === pickerMode,
    );
    if (!searchText.trim()) return typeGroups;

    return typeGroups
      .map((group) => ({
        ...group,
        categories: group.categories.filter(
          (category) =>
            matchesCategorySearch(group.name, searchText) ||
            matchesCategorySearch(category.name, searchText) ||
            matchesCategorySearch(`${group.name}/${category.name}`, searchText),
        ),
      }))
      .filter((group) => group.categories.length > 0);
  }, [categoryGroups, searchText, pickerMode]);
  const activeCategoryGroup =
    displayedGroups.find((group) => group.id === selectedCategoryGroup?.id) ??
    displayedGroups[0];
  const displayedGroupSections = [
    {
      groups: displayedGroups.filter(
        (group) => group.categories[0]?.type === "expense",
      ),
      label: transactionItemPickerMessages.categorySection.expense,
    },
    {
      groups: displayedGroups.filter(
        (group) => group.categories[0]?.type === "income",
      ),
      label: transactionItemPickerMessages.categorySection.income,
    },
  ].filter((section) => section.groups.length > 0);
  const isCategoryDisabled = (category: TransactionCategoryOption) =>
    category.type === disabledCategoryType;

  function selectCategory(groupId: string, categoryId: string) {
    // 切到别的大分类时直接选中点的小分类；用 toggle 会把自动选中的第一个小分类取消掉。
    if (selectedCategoryGroup?.id !== groupId)
      onGroupSelect(groupId, categoryId);
    else onCategoryToggle(categoryId);
  }

  function handleConfirm() {
    if (onPickerAdd()) closeDrawer();
  }

  function handleDelete() {
    if (editingItemId === null) return;
    onRemoveItem(editingItemId);
    closeDrawer();
  }

  function closeDrawer() {
    setAmountOpen(false);
    setSearchText("");
    onClose();
  }

  return (
    <Drawer
      anchor="bottom"
      onClose={closeDrawer}
      open={open}
      sx={itemPickerDrawerSx}
      slotProps={{ paper: { sx: itemPickerDrawerPaperSx } }}
    >
      <Box sx={drawerHandleSx}>
        <Box sx={drawerHandleBarSx} />
      </Box>

      <Stack direction="row" sx={drawerHeaderSx}>
        <Typography component="h2" variant="h6" sx={drawerTitleSx}>
          {editingItemId === null
            ? transactionItemPickerMessages.addTitle
            : transactionItemPickerMessages.editTitle}
        </Typography>
        <IconButton
          aria-label={transactionItemPickerMessages.close}
          onClick={closeDrawer}
          sx={closeButtonSx}
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box sx={drawerBodySx}>
        <ToggleButtonGroup
          aria-label={transactionItemPickerMessages.typeTitle}
          exclusive
          fullWidth
          onChange={(_, value: TransactionItemPickerMode | null) => {
            if (value) onPickerModeChange(value);
          }}
          size="small"
          sx={typeToggleGroupSx}
          value={pickerMode}
        >
          {transactionItemPickerMessages.typeOptions
            .filter(
              ({ id }) =>
                specialStatusEnabled ||
                (id !== "refund" && id !== "reimbursement"),
            )
            .map(({ id: mode, label }) => (
              <ToggleButton
                aria-label={transactionItemPickerMessages.typeLabel(label)}
                disabled={
                  (pickerModeLocked && mode !== pickerMode) ||
                  (multiAccount && mode !== "expense")
                }
                key={mode}
                value={mode}
              >
                {label}
              </ToggleButton>
            ))}
        </ToggleButtonGroup>
        {isLinkedMode ? (
          <Typography
            color="textSecondary"
            variant="caption"
            sx={{
              display: "block",
              mt: 0.75,
              textAlign: "right",
              color: "text.disabled",
              fontWeight: 400,
            }}
          >
            {transactionItemPickerMessages.linkedHint}
          </Typography>
        ) : null}
        {isLinkedMode ? (
          <TransactionLinkCandidatePanel
            key={pickerMode}
            accountCurrency={selectedAccountCurrency}
            merchantName={merchantName}
            kind={pickerMode}
            merchantId={pickerMode === "refund" ? merchantId : undefined}
            loadPageAction={
              pickerMode === "refund"
                ? loadRefundPageAction
                : loadReimbursementPageAction
            }
            onChange={
              pickerMode === "refund"
                ? onRefundItemChange
                : onReimbursementItemChange
            }
            value={selectedCandidate}
            resolveLinkCandidate={resolveLinkCandidate}
          />
        ) : (
          <>
            <TextField
              fullWidth
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={transactionItemPickerMessages.searchCategory}
              size="small"
              slotProps={{
                htmlInput: {
                  "aria-label": transactionItemPickerMessages.searchCategory,
                },
                input: {
                  endAdornment: searchText ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={transactionItemPickerMessages.clearSearch}
                        edge="end"
                        onClick={() => setSearchText("")}
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={searchFieldSx}
              value={searchText}
            />

            {filteredCategoryOptions.length === 0 ? (
              <Typography color="textSecondary">
                {transactionItemPickerMessages.missingCategories}
              </Typography>
            ) : (
              <>
                {displayedGroups.length === 0 ? (
                  <Box sx={emptySearchSx}>
                    <Typography color="textSecondary" variant="body2">
                      {transactionItemPickerMessages.noMatchingCategory}
                    </Typography>
                  </Box>
                ) : (
                  <Stack direction="row" spacing={1} sx={categoryColumnsSx}>
                    <Stack sx={categoryColumnSx}>
                      <Box sx={categoryOptionsSx}>
                        {displayedGroupSections.map((section) => (
                          <Box key={section.label}>
                            <Typography
                              sx={categoryTypeLabelSx}
                              variant="caption"
                            >
                              {section.label}
                            </Typography>
                            {section.groups.map((group) => {
                              const isSelected =
                                activeCategoryGroup?.id === group.id;

                              return (
                                <Button
                                  aria-pressed={isSelected}
                                  disabled={group.categories.every(
                                    isCategoryDisabled,
                                  )}
                                  key={group.id}
                                  onClick={() => onGroupSelect(group.id)}
                                  type="button"
                                  sx={categoryGroupOptionSx(isSelected)}
                                >
                                  {group.name}
                                </Button>
                              );
                            })}
                          </Box>
                        ))}
                      </Box>
                    </Stack>

                    <Stack sx={categoryColumnSx}>
                      <Box sx={categoryOptionsSx}>
                        {activeCategoryGroup?.categories.map((category) => {
                          const isSelected = pickerCategoryId === category.id;

                          return (
                            <Button
                              aria-pressed={isSelected}
                              disabled={isCategoryDisabled(category)}
                              endIcon={
                                isSelected ? (
                                  <CheckRoundedIcon fontSize="small" />
                                ) : null
                              }
                              key={category.id}
                              onClick={() =>
                                activeCategoryGroup
                                  ? selectCategory(
                                      activeCategoryGroup.id,
                                      category.id,
                                    )
                                  : onCategoryToggle(category.id)
                              }
                              type="button"
                              sx={categoryOptionSx(isSelected)}
                            >
                              {category.name}
                            </Button>
                          );
                        })}
                      </Box>
                    </Stack>
                  </Stack>
                )}

                {disabledCategoryType ? (
                  <Typography color="textSecondary" variant="caption">
                    {transactionPaymentFieldsMessages.categoryTypeRestricted}
                  </Typography>
                ) : null}

                {pickerErrors.category ? (
                  <Typography color="error" variant="caption">
                    {pickerErrors.category}
                  </Typography>
                ) : null}
              </>
            )}

            {specialStatusEnabled &&
            selectedCategoryType === "expense" &&
            (pickerSpecialStatus === null ||
              pickerSpecialStatus === "pendingReimbursement") ? (
              <TransactionPendingReimbursementCheckbox
                checked={
                  specialStatusLocked ||
                  pickerSpecialStatus === "pendingReimbursement"
                }
                disabled={specialStatusLocked}
                onChange={(checked) =>
                  onSpecialStatusChange(checked ? "pendingReimbursement" : null)
                }
              />
            ) : null}
          </>
        )}
        {linkNotice ? (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            {linkNotice}
          </Alert>
        ) : null}
      </Box>

      <Box sx={drawerFooterSx}>
        {isLinkedMode ? (
          <ButtonBase
            disabled={!selectedCandidate}
            onClick={() => setAmountOpen(true)}
            sx={{
              width: "100%",
              justifyContent: "space-between",
              textAlign: "left",
              pb: 2,
              gap: 1,
            }}
          >
            <Stack>
              <Typography sx={{ fontWeight: 800 }}>
                {pickerMode === "refund"
                  ? m.refundAmount
                  : m.reimbursementAmount}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {adjustedSelectedCandidate
                  ? selectedIsSettled
                    ? m.settledHint(pickerMode)
                    : m.remaining(
                        pickerMode,
                        formatUnsignedCurrencyAmount(
                          adjustedSelectedCandidate.remainingRefundableAmount,
                          selectedAccountCurrency ??
                            adjustedSelectedCandidate.accountCurrency,
                        ),
                      )
                  : m.selectFirst(pickerMode)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <Typography
                sx={{
                  color: selectedCandidate ? "primary.main" : "text.disabled",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                }}
              >
                {selectedCandidate && (pickerAmount.trim() || selectedIsSettled)
                  ? formatUnsignedCurrencyAmount(
                      pickerAmount.trim() ? pickerAmount : "0",
                      selectedAccountCurrency ??
                        selectedCandidate.accountCurrency,
                    )
                  : m.unselectedAmount}
              </Typography>
              {selectedCandidate ? (
                <EditRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
              ) : null}
            </Stack>
          </ButtonBase>
        ) : null}
        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            onClick={editingItemId === null ? closeDrawer : handleDelete}
            type="button"
            variant="outlined"
            sx={editingItemId === null ? drawerCancelButtonSx : deleteButtonSx}
          >
            {editingItemId === null
              ? transactionItemPickerMessages.cancel
              : transactionItemPickerMessages.remove}
          </Button>
          <PrimaryActionButton
            disabled={isLinkedMode && !selectedCandidate}
            fullWidth
            onClick={handleConfirm}
            type="button"
            sx={drawerDoneButtonSx}
          >
            {editingItemId === null
              ? transactionItemPickerMessages.confirm
              : transactionItemPickerMessages.saveEdit}
          </PrimaryActionButton>
        </Stack>
      </Box>
      <TransactionItemAmountDrawer
        open={amountOpen && open && isLinkedMode && Boolean(selectedCandidate)}
        title={pickerMode === "refund" ? m.refundAmount : m.reimbursementAmount}
        currency={
          selectedAccountCurrency ?? selectedCandidate?.accountCurrency ?? "JPY"
        }
        value={pickerAmount}
        onClose={() => setAmountOpen(false)}
        onConfirm={(amount) => {
          onPickerAmountChange(amount);
          setAmountOpen(false);
        }}
      />
    </Drawer>
  );
}

// 显示在记一笔 WizardDialog 之上。
const itemPickerDrawerSx = {
  zIndex: (theme: Theme) => theme.zIndex.modal,
};

const itemPickerDrawerPaperSx = {
  bgcolor: "background.paper",
  borderRadius: "24px 24px 0 0",
  display: "flex",
  flexDirection: "column",
  maxHeight: "92vh",
  overflow: "hidden",
};

const drawerHandleSx = {
  display: "flex",
  flexShrink: 0,
  justifyContent: "center",
  pt: 1.25,
};

const drawerHandleBarSx = {
  bgcolor: "divider",
  borderRadius: `${designTokens.radius.full}px`,
  height: 4,
  width: 48,
};

const drawerHeaderSx = {
  alignItems: "center",
  flexShrink: 0,
  justifyContent: "space-between",
  px: 2.5,
  py: 0.75,
};

const drawerTitleSx = { fontWeight: 800 };
const closeButtonSx = { color: "text.secondary", mr: -1 };

const drawerBodySx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overscrollBehaviorY: "none",
  px: 2.5,
  pb: 1.5,
};

const searchFieldSx = {
  mb: 1,
  mt: 1.5,
  "& .MuiOutlinedInput-root": { borderRadius: `${designTokens.radius.md}px` },
};

const categoryColumnsSx = { mt: 1, minHeight: 184 };

const categoryColumnSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
};

const categoryOptionsSx = { flex: 1, overflowY: "auto", py: 0.25 };

const categoryTypeLabelSx = {
  color: "text.secondary",
  display: "block",
  fontWeight: 700,
  px: 1.5,
  pb: 0.25,
  pt: 0.75,
};

const categoryGroupOptionSx = (selected: boolean) => (theme: Theme) => ({
  bgcolor: selected
    ? `var(--user-theme-field-card-selected-bg, ${alpha(theme.palette.primary.main, 0.12)})`
    : "transparent",
  borderRadius: `${designTokens.radius.item}px`,
  color: selected
    ? `var(--user-theme-action-text, ${theme.palette.primary.main})`
    : theme.palette.text.primary,
  fontWeight: selected ? 800 : 500,
  justifyContent: "flex-start",
  minHeight: 30,
  mx: 0.25,
  px: 1.5,
  py: 0.25,
  textTransform: "none",
  width: "calc(100% - 4px)",
});

const categoryOptionSx = (selected: boolean) => (theme: Theme) => ({
  bgcolor: selected
    ? `var(--user-theme-field-card-selected-bg, ${alpha(theme.palette.primary.main, 0.12)})`
    : "transparent",
  border: selected ? 1 : 0,
  borderColor: selected
    ? `var(--user-theme-field-card-selected-border, ${theme.palette.primary.main})`
    : "transparent",
  borderRadius: `${designTokens.radius.item}px`,
  color: selected
    ? `var(--user-theme-action-text, ${theme.palette.primary.main})`
    : theme.palette.text.primary,
  fontWeight: selected ? 800 : 500,
  justifyContent: "flex-start",
  minHeight: 30,
  mx: 0.25,
  px: 1.5,
  py: 0.25,
  textTransform: "none",
  width: "calc(100% - 4px)",
  "& .MuiButton-endIcon": { ml: "auto" },
});

const emptySearchSx = {
  alignItems: "center",
  border: 1,
  borderColor: "divider",
  borderRadius: `${designTokens.radius.xl}px`,
  display: "flex",
  justifyContent: "center",
  minHeight: 184,
};

const drawerFooterSx = {
  bgcolor: "background.paper",
  borderTop: "1px dashed",
  borderColor: "divider",
  flexShrink: 0,
  px: 2.5,
  pt: 1.25,
  pb: (theme: Theme) =>
    `calc(${theme.spacing(2)} + ${bottomNavigationLayout.safeAreaPaddingBottom})`,
};

const drawerCancelButtonSx = {
  borderColor: "divider",
  color: "text.primary",
  minHeight: 48,
};

const deleteButtonSx = {
  borderColor: "error.light",
  color: "error.main",
  minHeight: 48,
};

const drawerDoneButtonSx = {
  borderRadius: `${designTokens.radius.md}px`,
  fontWeight: 700,
  minHeight: 48,
  ...primaryActionButtonNoHoverBrightenSx,
};

const typeToggleGroupSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: `${designTokens.radius.md}px`,
  p: "3px",
  display: "flex",
  mt: 1.5,
  "& .MuiToggleButtonGroup-grouped": {
    border: 0,
    borderRadius: `${designTokens.radius.item}px`,
    m: 0,
  },
  "& .MuiToggleButton-root": {
    color: "text.secondary",
    flex: 1,
    fontWeight: 700,
    minWidth: 0,
    px: 0.5,
    textTransform: "none",
    "&.Mui-selected": {
      bgcolor: "primary.main",
      color: "primary.contrastText",
      "@media (hover: none)": {
        "&:hover": {
          bgcolor: "primary.main",
          color: "primary.contrastText",
        },
      },
      "@media (hover: hover)": {
        "&:hover": { bgcolor: "primary.dark" },
      },
    },
    "&.Mui-disabled": {
      bgcolor: "action.disabledBackground",
      color: "text.disabled",
      opacity: 0.5,
    },
  },
};
