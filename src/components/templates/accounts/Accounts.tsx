"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useMemo, useState } from "react";

import { CreateButton } from "atoms/ui/CreateButton";
import { accountPageMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { AccountList } from "organisms/accounts/AccountList/AccountList";
import { AccountSummaryCard } from "organisms/accounts/AccountSummaryCard/AccountSummaryCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import {
  SettingsPageLayout,
  settingsPageActionButtonSx,
} from "templates/layout/SettingsPageLayout";
import { useClearQueryParam } from "templates/useClearQueryParam";
import {
  accountTypeOptions,
  type Account,
  type AccountType,
} from "types/accounts";

export type AccountSaveResult = "archived" | "created" | "updated";

type AccountsTemplateProps = {
  accounts: Account[];
  baseCurrency: string;
  canManageAccounts?: boolean;
  saveResult?: AccountSaveResult | null;
};

type AccountTypeFilter = AccountType | "all";

export function AccountsTemplate({
  accounts,
  baseCurrency,
  canManageAccounts = true,
  saveResult = null,
}: AccountsTemplateProps) {
  const [selectedType, setSelectedType] = useState<AccountTypeFilter>("all");
  const [activeSaveResult, setActiveSaveResult] = useState(saveResult);
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(
    saveResult !== null,
  );
  const [previousSaveResult, setPreviousSaveResult] = useState(saveResult);
  const clearResultParam = useClearQueryParam("result");

  if (saveResult !== previousSaveResult) {
    setPreviousSaveResult(saveResult);

    if (saveResult !== null) {
      setActiveSaveResult(saveResult);
      setIsSaveSuccessOpen(true);
    }
  }

  const filteredAccounts = useMemo(() => {
    if (selectedType === "all") {
      return accounts;
    }

    return accounts.filter((account) => account.type === selectedType);
  }, [accounts, selectedType]);
  const isFilteredEmpty =
    selectedType !== "all" && filteredAccounts.length === 0;
  const saveSuccessDialogText =
    accountSaveSuccessDialogTextByResult[activeSaveResult ?? "updated"];

  function closeSaveSuccessDialog() {
    setIsSaveSuccessOpen(false);

    clearResultParam();
  }

  return (
    <SettingsPageLayout
      action={
        canManageAccounts ? (
          <CreateButton
            href={routePaths.accountsNew}
            size="small"
            sx={settingsPageActionButtonSx}
          >
            {accountPageMessages.create}
          </CreateButton>
        ) : null
      }
      back={{
        href: routePaths.settings,
        label: accountPageMessages.backToSettings,
      }}
      subtitle={accountPageMessages.subtitle}
      title={accountPageMessages.title}
    >
      <Stack spacing={1.35}>
        <AccountSummaryCard accounts={accounts} baseCurrency={baseCurrency} />

        <Stack direction="row" spacing={0.7} sx={filterRowSx}>
          <AccountTypeFilterChip
            label="全部"
            selected={selectedType === "all"}
            onClick={() => setSelectedType("all")}
          />
          {accountTypeOptions
            .filter((option) => option.value !== "other")
            .map((option) => (
              <AccountTypeFilterChip
                key={option.value}
                label={option.label}
                selected={selectedType === option.value}
                onClick={() => setSelectedType(option.value)}
              />
            ))}
        </Stack>

        <AccountList
          accounts={filteredAccounts}
          canManageAccounts={canManageAccounts}
          emptyDescription={
            isFilteredEmpty
              ? "请切换其他账户类型。"
              : canManageAccounts
                ? undefined
                : "当前账本还没有可查看的账户。"
          }
          emptyTitle={isFilteredEmpty ? "该类型下还没有账户" : undefined}
        />
      </Stack>

      <SuccessFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={saveSuccessDialogText.description}
        onClose={closeSaveSuccessDialog}
        open={isSaveSuccessOpen}
        title={saveSuccessDialogText.title}
      />
    </SettingsPageLayout>
  );
}

function AccountTypeFilterChip({
  label,
  onClick,
  selected,
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <Chip
      clickable
      color={selected ? "warning" : "default"}
      label={label}
      onClick={onClick}
      sx={[
        { fontWeight: 800 },
        selected ? selectedAccountTypeChipSx : accountTypeChipSx,
      ]}
      variant={selected ? "filled" : "outlined"}
    />
  );
}

const accountTypeChipSx = {
  "@media (hover: hover)": {
    "&&.MuiChip-clickable:hover": { bgcolor: "action.hover" },
  },
  "@media (hover: none)": {
    "&&.MuiChip-clickable": { bgcolor: "transparent" },
  },
};

const selectedAccountTypeChipSx = {
  "@media (hover: hover)": {
    "&&.MuiChip-clickable:hover": { bgcolor: "warning.main" },
  },
  "@media (hover: none)": {
    "&&.MuiChip-clickable": { bgcolor: "warning.main" },
  },
};

const filterRowSx = {
  flexWrap: "nowrap",
  mx: -0.5,
  overflowX: "auto",
  px: 0.5,
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
};

const accountSaveSuccessDialogTextByResult: Record<
  AccountSaveResult,
  { description: string; title: string }
> = {
  archived: {
    description: "账户已删除，历史记录不会被删除。",
    title: "删除成功",
  },
  created: {
    description: "账户已创建。",
    title: "新增成功",
  },
  updated: {
    description: "账户修改已保存。",
    title: "保存成功",
  },
};
