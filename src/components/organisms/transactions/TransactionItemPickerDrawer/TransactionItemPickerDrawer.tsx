import { useMemo, useState } from "react";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { alpha, type Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import {
  PrimaryActionButton,
  primaryActionButtonNoHoverBrightenSx,
} from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import type { TransactionSpecialStatus } from "internal/transaction";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { designTokens } from "theme/theme";
import { appZIndex } from "theme/zIndex";
import type {
  TransactionCategoryOption,
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import { TransactionPendingReimbursementCheckbox } from "../TransactionPendingReimbursementCheckbox/TransactionPendingReimbursementCheckbox";
import { TransactionRefundLinkPicker } from "../TransactionRefundLinkPicker/TransactionRefundLinkPicker";
import { TransactionReimbursementLinkPicker } from "../TransactionReimbursementLinkPicker/TransactionReimbursementLinkPicker";

import type {
  CategoryPickerGroup,
  TransactionPickerErrors,
} from "../TransactionForm/TransactionForm.types";
import { matchesCategorySearch } from "./TransactionCategorySearch";
import { getCurrencySymbol } from "../TransactionForm/TransactionForm.utils";

type TransactionItemPickerDrawerProps = {
  categoryGroups: CategoryPickerGroup[];
  editingItemId?: number | null;
  filteredCategoryOptions: TransactionCategoryOption[];
  frequentCategoryIds: string[];
  onAmountChange: (amount: string) => void;
  onCategoryToggle: (categoryId: string) => void;
  onClose: () => void;
  onGroupSelect: (groupId: string) => void;
  onPickerAdd: () => boolean;
  onRemoveItem: (itemId: number) => void;
  onRefundItemChange?: (item: TransactionRefundCandidate | null) => void;
  onReimbursementItemChange?: (item: TransactionRefundCandidate | null) => void;
  onSpecialStatusChange?: (value: TransactionSpecialStatus | null) => void;
  open: boolean;
  pickerAmount: string;
  pickerCategoryId: string;
  pickerErrors: TransactionPickerErrors;
  pickerRefundCandidate?: TransactionRefundCandidate | null;
  pickerReimbursementCandidate?: TransactionRefundCandidate | null;
  pickerSpecialStatus?: TransactionSpecialStatus | null;
  selectedAccountCurrency?: string;
  selectedCategoryGroup?: CategoryPickerGroup;
  refundPickerView?: TransactionTimeGroupViewData;
  reimbursementPickerView?: TransactionTimeGroupViewData;
  loadRefundGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadRefundMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadRefundSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  loadReimbursementGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadReimbursementMoreGroupsAction?: (
    offset: number,
  ) => Promise<TransactionGroupPage>;
  loadReimbursementSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  specialStatusEnabled?: boolean;
  specialStatusLocked?: boolean;
  incomeLinksEnabled?: boolean;
};

export function TransactionItemPickerDrawer({
  categoryGroups,
  editingItemId = null,
  filteredCategoryOptions,
  frequentCategoryIds,
  onAmountChange,
  onCategoryToggle,
  onClose,
  onGroupSelect,
  onPickerAdd,
  onRemoveItem,
  onRefundItemChange = () => undefined,
  onReimbursementItemChange = () => undefined,
  onSpecialStatusChange = () => undefined,
  open,
  pickerAmount,
  pickerCategoryId,
  pickerErrors,
  pickerRefundCandidate = null,
  pickerReimbursementCandidate = null,
  pickerSpecialStatus = null,
  selectedAccountCurrency,
  selectedCategoryGroup,
  refundPickerView,
  reimbursementPickerView,
  loadRefundGroupItemsAction,
  loadRefundMoreGroupsAction,
  loadRefundSearchPageAction,
  loadReimbursementGroupItemsAction,
  loadReimbursementMoreGroupsAction,
  loadReimbursementSearchPageAction,
  specialStatusEnabled = false,
  specialStatusLocked = false,
  incomeLinksEnabled = true,
}: TransactionItemPickerDrawerProps) {
  const selectedCategoryType = filteredCategoryOptions.find(
    (category) => category.id === pickerCategoryId,
  )?.type;
  const [searchText, setSearchText] = useState("");
  const [isCategoryListExpanded, setIsCategoryListExpanded] = useState(
    editingItemId !== null,
  );
  // Drawer 的内容不会在 open 切换时卸载重挂，所以用渲染期间对比上一次 open 的方式
  // 在每次真正打开时重新决定展开态，而不是用 useEffect 里 setState（会触发级联渲染）。
  const [previousOpen, setPreviousOpen] = useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) setIsCategoryListExpanded(editingItemId !== null);
  }
  const amountCurrencySymbol = getCurrencySymbol(selectedAccountCurrency);
  const displayedGroups = useMemo(() => {
    if (!searchText.trim()) return categoryGroups;

    return categoryGroups
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
  }, [categoryGroups, searchText]);
  const activeCategoryGroup =
    displayedGroups.find((group) => group.id === selectedCategoryGroup?.id) ??
    displayedGroups[0];
  const displayedGroupSections = [
    {
      groups: displayedGroups.filter(
        (group) => group.categories[0]?.type === "expense",
      ),
      label: "支出分类",
    },
    {
      groups: displayedGroups.filter(
        (group) => group.categories[0]?.type === "income",
      ),
      label: "收入分类",
    },
  ].filter((section) => section.groups.length > 0);
  const categoryWithGroupById = new Map(
    categoryGroups.flatMap((group) =>
      group.categories.map((category) => [category.id, { category, group }]),
    ),
  );
  const quickCategories = frequentCategoryIds.flatMap((categoryId) => {
    const categoryWithGroup = categoryWithGroupById.get(categoryId);
    return categoryWithGroup ? [categoryWithGroup] : [];
  });

  function selectCategory(groupId: string, categoryId: string) {
    if (selectedCategoryGroup?.id !== groupId) onGroupSelect(groupId);
    onCategoryToggle(categoryId);
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
    setSearchText("");
    setIsCategoryListExpanded(false);
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
          {editingItemId === null ? "添加明细" : "编辑明细"}
        </Typography>
        <IconButton aria-label="关闭" onClick={closeDrawer} sx={closeButtonSx}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box sx={drawerBodySx}>
        <TextField
          error={!!pickerErrors.amount}
          fullWidth
          helperText={pickerErrors.amount}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="0.00"
          slotProps={{
            htmlInput: {
              "aria-label": "金额",
              "data-amount-currency": selectedAccountCurrency ?? "",
              "data-amount-input": "true",
              inputMode: "decimal" as const,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {amountCurrencySymbol}
                </InputAdornment>
              ),
            },
          }}
          sx={amountFieldSx}
          type="text"
          value={pickerAmount}
        />

        <TextField
          fullWidth
          onChange={(event) => {
            setSearchText(event.target.value);
            if (event.target.value.trim()) setIsCategoryListExpanded(true);
          }}
          placeholder="搜索小分类"
          size="small"
          slotProps={{
            htmlInput: { "aria-label": "搜索小分类" },
            input: {
              endAdornment: searchText ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="清空搜索"
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
          <Typography color="text.secondary">请先新增分类。</Typography>
        ) : (
          <>
            <SectionLabel>常用快捷</SectionLabel>
            <Stack direction="row" sx={quickCategoryListSx}>
              {quickCategories.map(({ category, group }) => (
                <Chip
                  key={category.id}
                  label={`${group.name} · ${category.name}`}
                  onClick={() => selectCategory(group.id, category.id)}
                  size="small"
                  sx={quickCategoryChipSx}
                  variant="outlined"
                />
              ))}
            </Stack>

            <Button
              aria-expanded={isCategoryListExpanded}
              endIcon={
                isCategoryListExpanded ? (
                  <KeyboardArrowUpRoundedIcon />
                ) : (
                  <KeyboardArrowRightRoundedIcon />
                )
              }
              fullWidth
              onClick={() => setIsCategoryListExpanded((current) => !current)}
              type="button"
              sx={categoryListToggleSx}
            >
              {isCategoryListExpanded ? "收起分类列表" : "选择更多分类"}
            </Button>

            {isCategoryListExpanded ? (
              displayedGroups.length === 0 ? (
                <Box sx={emptySearchSx}>
                  <Typography color="text.secondary" variant="body2">
                    没有匹配的小分类
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
              )
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

        {specialStatusEnabled &&
        incomeLinksEnabled &&
        selectedCategoryType === "income" ? (
          <>
            <TransactionRefundLinkPicker
              loadGroupItemsAction={loadRefundGroupItemsAction}
              loadMoreGroupsAction={loadRefundMoreGroupsAction}
              loadSearchPageAction={loadRefundSearchPageAction}
              onChange={onRefundItemChange}
              timeGroupView={refundPickerView}
              refundAmount={pickerAmount}
              value={pickerRefundCandidate}
            />
            <TransactionReimbursementLinkPicker
              incomeAmount={pickerAmount}
              loadGroupItemsAction={loadReimbursementGroupItemsAction}
              loadMoreGroupsAction={loadReimbursementMoreGroupsAction}
              loadSearchPageAction={loadReimbursementSearchPageAction}
              onChange={onReimbursementItemChange}
              timeGroupView={reimbursementPickerView}
              value={pickerReimbursementCandidate}
            />
          </>
        ) : null}
      </Box>

      <Box sx={drawerFooterSx}>
        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            onClick={editingItemId === null ? closeDrawer : handleDelete}
            type="button"
            variant="outlined"
            sx={editingItemId === null ? drawerCancelButtonSx : deleteButtonSx}
          >
            {editingItemId === null ? "取消" : "删除明细"}
          </Button>
          <PrimaryActionButton
            fullWidth
            onClick={handleConfirm}
            type="button"
            sx={drawerDoneButtonSx}
          >
            {editingItemId === null ? "确定" : "保存修改"}
          </PrimaryActionButton>
        </Stack>
      </Box>
    </Drawer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={sectionLabelSx} variant="subtitle2">
      {children}
    </Typography>
  );
}

export const itemPickerDrawerSx = { zIndex: appZIndex.bottomSheet };

export const itemPickerDrawerPaperSx = {
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
  "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
};

const sectionLabelSx = { fontWeight: 800, mt: 1, mb: 0.5 };

const quickCategoryListSx = { flexWrap: "wrap", gap: 0.75 };

const quickCategoryChipSx = {
  bgcolor: "background.paper",
  borderColor: "divider",
  fontWeight: 600,
};

const categoryListToggleSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  justifyContent: "space-between",
  mt: 1.5,
  px: 1.5,
  py: 1,
  textTransform: "none",
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
  borderRadius: 2,
  display: "flex",
  justifyContent: "center",
  minHeight: 184,
};

const amountFieldSx = {
  "& .MuiInputAdornment-root": {
    color: "text.primary",
    fontSize: "2rem",
    fontWeight: 700,
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "2rem",
    fontWeight: 700,
    py: 1.75,
  },
  "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
};

export const drawerFooterSx = {
  bgcolor: "background.paper",
  borderTop: 1,
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
