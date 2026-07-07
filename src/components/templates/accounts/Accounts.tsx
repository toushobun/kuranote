"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { routePaths } from "config/paths";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { AccountCreateDialog } from "organisms/accounts/AccountCreateDialog";
import { AccountList } from "organisms/accounts/AccountList";
import { AccountSummaryCard } from "organisms/accounts/AccountSummaryCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { TransactionAmountKeypadLauncher } from "organisms/transactions/TransactionAmountKeypadLauncher";
import { PageShell } from "templates/layout/PageShell";
import type { ServerAction } from "types/actions";
import {
  accountTypeOptions,
  type AccountHolderOption,
  type AccountRow,
  type AccountType,
} from "types/accounts";

export type AccountSaveResult = "archived" | "created" | "updated";

type ErrorFeedback = {
  id: string;
  message: string;
};

type AccountsTemplateProps = {
  accounts: AccountRow[];
  archiveAccountAction: ServerAction;
  baseCurrency: string;
  createAccountAction: ServerAction;
  errorKey?: string | null;
  errorMessage: string | null;
  holderOptions: AccountHolderOption[];
  ledgerName: string;
  saveResult?: AccountSaveResult | null;
  updateAccountAction: ServerAction;
};

type AccountTypeFilter = AccountType | "all";

export function AccountsTemplate({
  accounts,
  archiveAccountAction,
  baseCurrency,
  createAccountAction,
  errorKey = null,
  errorMessage,
  holderOptions,
  saveResult = null,
  updateAccountAction,
}: AccountsTemplateProps) {
  const [selectedType, setSelectedType] = useState<AccountTypeFilter>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [errorFeedbacks, setErrorFeedbacks] = useState<ErrorFeedback[]>([]);
  const errorFeedbackIdRef = useRef(0);
  const enqueuedErrorKeysRef = useRef(new Set<string>());
  const [activeSaveResult, setActiveSaveResult] = useState(saveResult);
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(
    saveResult !== null,
  );
  const [previousSaveResult, setPreviousSaveResult] = useState(saveResult);
  const router = useRouter();

  useEffect(() => {
    // errorKey 由服务端为每次错误 redirect 生成，即使 errorMessage 文案相同，
    // errorKey 也会不同，因此这里必须依赖 errorKey 而不是只依赖 errorMessage，
    // 否则连续发生的相同错误不会被识别为新的一次事件。
    if (errorMessage === null || errorKey === null) return;

    // StrictMode 下 effect 会额外重跑一次，用 ref 记录已入队的 errorKey，
    // 避免同一次错误事件被重复 append 成两条反馈。
    if (enqueuedErrorKeysRef.current.has(errorKey)) return;
    enqueuedErrorKeysRef.current.add(errorKey);

    errorFeedbackIdRef.current += 1;
    const id = `${errorKey}-${errorFeedbackIdRef.current}`;

    setErrorFeedbacks((feedbacks) => [
      ...feedbacks,
      { id, message: errorMessage },
    ]);
  }, [errorMessage, errorKey]);

  if (saveResult !== previousSaveResult) {
    setPreviousSaveResult(saveResult);

    if (saveResult !== null) {
      setActiveSaveResult(saveResult);
      setIsSaveSuccessOpen(true);
      setIsCreateDialogOpen(false);
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

  function closeErrorFeedback(id: string) {
    setErrorFeedbacks((feedbacks) =>
      feedbacks.filter((feedback) => feedback.id !== id),
    );

    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("errorKey");
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  }

  function closeSaveSuccessDialog() {
    setIsSaveSuccessOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("result");
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  }

  return (
    <>
      <Box
        aria-hidden="true"
        data-testid="accounts-page-background"
        sx={pageBackgroundSx}
      />
      <PageShell maxWidth="xs" sx={accountsPageShellSx}>
        <Stack spacing={1.35}>
          <Stack spacing={0.4}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <IconButton
                aria-label="返回"
                component={Link}
                href={routePaths.settings}
                sx={headerIconButtonSx}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
              <Typography
                component="h1"
                sx={{ flex: 1, fontSize: { xs: 24, sm: 26 }, fontWeight: 900 }}
              >
                账户管理
              </Typography>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                startIcon={<AddRoundedIcon />}
                sx={createButtonSx}
                variant="contained"
              >
                新增账户
              </Button>
            </Stack>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ pl: 5.75 }}
            >
              整理家里的现金、银行卡、电子钱包和信用卡
            </Typography>
          </Stack>

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
            archiveAccountAction={archiveAccountAction}
            emptyDescription={
              isFilteredEmpty
                ? "请切换其他账户类型，或新增一个账户。"
                : undefined
            }
            emptyTitle={isFilteredEmpty ? "该类型下还没有账户" : undefined}
            holderOptions={holderOptions}
            saveResult={saveResult}
            updateAccountAction={updateAccountAction}
          />
        </Stack>

        <TransactionAmountKeypadLauncher />
        <AccountCreateDialog
          createAccountAction={createAccountAction}
          defaultCurrency={baseCurrency}
          holderOptions={holderOptions}
          onClose={() => setIsCreateDialogOpen(false)}
          open={isCreateDialogOpen}
        />
        {errorFeedbacks.map((feedback, index) => (
          <FailureFeedbackDialog
            key={feedback.id}
            bottomOffset={errorFeedbackBottomOffset(index)}
            description={feedback.message}
            onClose={() => closeErrorFeedback(feedback.id)}
            open
            title="账户操作失败"
          />
        ))}
        <SuccessFeedbackDialog
          bottomOffset={saveFeedbackBottomOffset}
          description={saveSuccessDialogText.description}
          onClose={closeSaveSuccessDialog}
          open={isSaveSuccessOpen}
          title={saveSuccessDialogText.title}
        />
      </PageShell>
    </>
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
      sx={{ fontWeight: 800 }}
      variant={selected ? "filled" : "outlined"}
    />
  );
}

const headerIconButtonSx = {
  color: "text.primary",
  mt: 0.2,
};

const pageBackgroundSx = {
  bgcolor: "background.paper",
  inset: 0,
  position: "fixed",
  zIndex: -1,
};

// 账户页需要比其他 PageShell 页面更紧凑的移动端边距，局部覆盖而非改动全局 spacing token。
const accountsPageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
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

const createButtonSx = {
  background: "var(--user-theme-fab-bg)",
  borderRadius: 999,
  color: "var(--user-theme-fab-text)",
  flexShrink: 0,
  fontWeight: 800,
  minHeight: 40,
  px: 2,
  whiteSpace: "nowrap",
  "&:hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
};

const saveFeedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

// 多条错误反馈叠加显示时，按队列顺序依次上移，避免互相遮挡。
function errorFeedbackBottomOffset(index: number) {
  return `calc(${saveFeedbackBottomOffset} + ${index * 88}px)`;
}

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
