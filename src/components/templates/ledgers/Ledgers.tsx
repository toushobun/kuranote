import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ElementType } from "react";

import { ledgerSettingsHref, routePaths } from "config/paths";
import { SoftCard } from "atoms/ui/SoftCard";
import type {
  CurrentLedger,
  CurrentLedgerRole,
} from "lib/ledger/current-ledger";
import { PageShell } from "templates/layout/PageShell";
import { typographyStyles } from "theme/typographyTokens";

type LedgersTemplateProps = {
  currentLedgerId: string;
  ledgers: CurrentLedger[];
};

type LedgerIconOption = {
  icon: ElementType<SvgIconProps>;
  keyword: string;
};

const ledgerIconOptions: readonly LedgerIconOption[] = [
  { icon: HomeRoundedIcon, keyword: "家" },
  { icon: ChildCareRoundedIcon, keyword: "育儿" },
  { icon: LuggageRoundedIcon, keyword: "旅行" },
  { icon: EditNoteRoundedIcon, keyword: "测试" },
];

export function LedgersTemplate({
  currentLedgerId,
  ledgers,
}: LedgersTemplateProps) {
  const currentLedger =
    ledgers.find((ledger) => ledger.id === currentLedgerId) ?? ledgers[0];

  return (
    <>
      <Box
        aria-hidden="true"
        data-testid="ledgers-page-background"
        sx={pageBackgroundSx}
      />
      <PageShell maxWidth="xs" sx={ledgersPageShellSx}>
        <Stack spacing={1.5}>
          <Stack spacing={0.45}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <IconButton
                aria-label="返回"
                component={Link}
                href={routePaths.settings}
                sx={headerIconButtonSx}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
              <Typography component="h1" sx={pageTitleSx}>
                账本管理
              </Typography>
              <Button
                component={Link}
                href={routePaths.ledgersNew}
                startIcon={<AddRoundedIcon />}
                sx={createButtonSx}
                variant="contained"
              >
                新增账本
              </Button>
            </Stack>
            <Typography color="text.secondary" variant="body2" sx={{ pl: 5.75 }}>
              查看和管理你加入的账本
            </Typography>
          </Stack>

          {currentLedger ? (
            <CurrentLedgerCard ledger={currentLedger} />
          ) : (
            <LedgersEmptyCard />
          )}

          <Stack spacing={1}>
            <Typography component="h2" sx={sectionTitleSx}>
              我的账本列表
            </Typography>

            <Stack spacing={0.85}>
              {ledgers.map((ledger, index) => (
                <LedgerListItem
                  index={index}
                  isCurrent={ledger.id === currentLedgerId}
                  key={ledger.id}
                  ledger={ledger}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </PageShell>
    </>
  );
}

function CurrentLedgerCard({ ledger }: { ledger: CurrentLedger }) {
  const Icon = getLedgerIcon(ledger.name, 0);

  return (
    <SoftCard component="section" aria-label="当前账本" sx={currentCardSx}>
      <Stack spacing={1.45}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box sx={featuredIconBoxSx}>
            <Icon fontSize="medium" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography color="text.secondary" variant="body2">
              当前账本
            </Typography>
            <Typography component="p" sx={currentLedgerNameSx}>
              {ledger.name}
            </Typography>
          </Box>
          <Chip color="success" label="使用中" sx={statusChipSx} />
        </Stack>

        <Divider />

        <Stack
          direction="row"
          divider={<Divider flexItem orientation="vertical" />}
          spacing={1}
          sx={{ justifyContent: "space-between" }}
        >
          <LedgerMetaItem
            icon={PeopleAltRoundedIcon}
            label={`成员 ${ledger.memberCount} 人`}
          />
          <LedgerMetaItem
            icon={WalletRoundedIcon}
            label={`默认货币 ${ledger.baseCurrency}`}
          />
          <LedgerMetaItem
            icon={ShieldOutlinedIcon}
            label={`我的角色 ${roleLabelMap[ledger.currentUserRole]}`}
          />
        </Stack>
      </Stack>
    </SoftCard>
  );
}

function LedgerListItem({
  index,
  isCurrent,
  ledger,
}: {
  index: number;
  isCurrent: boolean;
  ledger: CurrentLedger;
}) {
  const Icon = getLedgerIcon(ledger.name, index);
  const href = ledgerSettingsHref(ledger.id);

  return (
    <SoftCard sx={ledgerItemCardSx(isCurrent)}>
      <ButtonBase
        component={Link}
        href={href}
        aria-current={isCurrent ? "page" : undefined}
        sx={ledgerItemButtonSx}
      >
        <Box sx={ledgerItemIconBoxSx}>
          <Icon fontSize="small" />
        </Box>

        <Stack spacing={0.45} sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Typography component="p" sx={ledgerItemNameSx}>
              {ledger.name}
            </Typography>
            {isCurrent ? (
              <Chip
                color="success"
                icon={<TaskAltRoundedIcon />}
                label="使用中"
                size="small"
                sx={statusChipSx}
              />
            ) : null}
          </Stack>

          <Typography color="text.secondary" variant="body2">
            成员 {ledger.memberCount} 人 · {ledger.baseCurrency} ·{" "}
            {roleLabelMap[ledger.currentUserRole]}
          </Typography>
        </Stack>

        {isCurrent ? null : (
          <Chip
            label="点击进入编辑"
            size="small"
            sx={editChipSx}
            variant="outlined"
          />
        )}
        <ChevronRightRoundedIcon sx={chevronSx} />
      </ButtonBase>
    </SoftCard>
  );
}

function LedgersEmptyCard() {
  return (
    <SoftCard sx={emptyCardSx}>
      <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center" }}>
        <Box sx={featuredIconBoxSx}>
          <MenuBookRoundedIcon fontSize="medium" />
        </Box>
        <Stack spacing={0.45}>
          <Typography component="p" sx={emptyTitleSx}>
            你还没有任何账本
          </Typography>
          <Typography color="text.secondary" variant="body2">
            创建第一个账本后，就可以开始整理家庭记录。
          </Typography>
        </Stack>
        <Button
          component={Link}
          href={routePaths.ledgersNew}
          startIcon={<AddRoundedIcon />}
          sx={createButtonSx}
          variant="contained"
        >
          新增账本
        </Button>
      </Stack>
    </SoftCard>
  );
}

function LedgerMetaItem({
  icon,
  label,
}: {
  icon: ElementType<SvgIconProps>;
  label: string;
}) {
  const Icon = icon;

  return (
    <Stack
      direction="row"
      spacing={0.6}
      sx={{ alignItems: "center", minWidth: 0 }}
    >
      <Icon sx={metaIconSx} />
      <Typography color="text.secondary" variant="body2" sx={metaTextSx}>
        {label}
      </Typography>
    </Stack>
  );
}

function getLedgerIcon(ledgerName: string, index: number) {
  const matched = ledgerIconOptions.find((option) =>
    ledgerName.includes(option.keyword),
  );

  if (matched) {
    return matched.icon;
  }

  return ledgerFallbackIcons[index % ledgerFallbackIcons.length];
}

const ledgerFallbackIcons = [
  HomeRoundedIcon,
  LuggageRoundedIcon,
  ChildCareRoundedIcon,
  EditNoteRoundedIcon,
] as const;

const roleLabelMap: Record<CurrentLedgerRole, string> = {
  admin: "管理员",
  member: "用户",
  owner: "管理员",
  viewer: "只读",
};

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

const ledgersPageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
};

const pageTitleSx = {
  ...typographyStyles.pageTitle,
  flex: 1,
  fontSize: { xs: 24, sm: 26 },
  fontWeight: 900,
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

const currentCardSx = {
  borderRadius: 2,
  p: { xs: 1.7, sm: 2 },
};

const featuredIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 56,
  justifyContent: "center",
  width: 56,
};

const currentLedgerNameSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 24, sm: 26 },
  fontWeight: 900,
};

const sectionTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 17,
  fontWeight: 900,
};

function ledgerItemCardSx(isCurrent: boolean) {
  return {
    borderColor: isCurrent
      ? "var(--user-theme-action-text)"
      : "var(--user-theme-card-border)",
    borderRadius: 2,
    overflow: "hidden",
  } as const;
}

const ledgerItemButtonSx = {
  alignItems: "center",
  color: "text.primary",
  display: "flex",
  gap: 1.25,
  justifyContent: "flex-start",
  p: 1.35,
  textAlign: "left",
  textDecoration: "none",
  width: "100%",
  "&:focus-visible, &:hover": {
    filter: "brightness(1.02)",
  },
};

const ledgerItemIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 46,
  justifyContent: "center",
  width: 46,
};

const ledgerItemNameSx = {
  ...typographyStyles.cardTitle,
  fontSize: 18,
  fontWeight: 900,
};

const statusChipSx = {
  fontWeight: 800,
};

const editChipSx = {
  borderColor: "var(--user-theme-action-text)",
  color: "var(--user-theme-action-text)",
  display: { xs: "none", sm: "inline-flex" },
  fontWeight: 700,
};

const chevronSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 26,
};

const metaIconSx = {
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  fontSize: 20,
};

const metaTextSx = {
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const emptyCardSx = {
  borderRadius: 2,
  p: { xs: 2, sm: 2.5 },
};

const emptyTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 18,
  fontWeight: 900,
};
