"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState, type ReactElement } from "react";

import type { LedgerSetupRegion } from "internal/ledger";
import {
  GroupedPresetChecklist,
  type GroupedPresetChecklistGroup,
  type GroupedPresetChecklistItem,
  type GroupedPresetChecklistMessages,
} from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";
import {
  PresetDisclosureChevron,
  PresetDisclosurePanel,
} from "molecules/ui/PresetDisclosure/PresetDisclosure";
import { designTokens } from "theme/theme";

export type RegionPresetItem = GroupedPresetChecklistItem & {
  regions: readonly LedgerSetupRegion[];
};

export type RegionPresetSelectorMessages = {
  checklist: GroupedPresetChecklistMessages;
  /** 地区卡片右上角的已选数量。 */
  selectedCount: (selected: number) => string;
  /** 地区卡片标题，例如「日本常用商家」。 */
  title: (region: LedgerSetupRegion) => string;
  /** 第二地区卡片内的说明（两地共有的项目只列在生活地区中）；不需要时省略。 */
  sharedHint?: (primary: LedgerSetupRegion) => string;
};

export type RegionPresetSelectorProps = {
  disabled?: boolean;
  disabledKeys?: readonly string[];
  groups: readonly GroupedPresetChecklistGroup[];
  items: readonly RegionPresetItem[];
  messages: RegionPresetSelectorMessages;
  onChange: (keys: string[]) => void;
  /** 第二地区首次有勾选时调用。 */
  onSecondaryRegionSelect?: (region: LedgerSetupRegion) => void;
  region: LedgerSetupRegion | null;
  selectedKeys: readonly string[];
};

/**
 * 按地区分卡的预设勾选：生活地区在前且默认展开，另一地区平级、可折叠。
 * 两地共有的项目只出现在生活地区卡片中。商家与账户步骤共用。
 */
export function RegionPresetSelector({
  disabled,
  disabledKeys,
  groups,
  items,
  messages,
  onChange,
  onSecondaryRegionSelect,
  region,
  selectedKeys,
}: RegionPresetSelectorProps) {
  const primary = region ?? "jp";
  const secondary = primary === "jp" ? "cn" : "jp";
  const primaryItems = items.filter((item) => item.regions.includes(primary));
  const secondaryItems = items.filter(
    (item) =>
      item.regions.includes(secondary) && !item.regions.includes(primary),
  );

  function renderChecklist(
    regionItems: readonly RegionPresetItem[],
    additional: boolean,
  ) {
    const keys = new Set(regionItems.map(({ key }) => key));
    const regionGroups = groups
      .map((group) => ({
        ...group,
        itemKeys: group.itemKeys.filter((key) => keys.has(key)),
      }))
      .filter((group) => group.itemKeys.length > 0);
    return (
      <GroupedPresetChecklist
        disabled={disabled}
        disabledKeys={disabledKeys}
        groups={regionGroups}
        items={regionItems}
        messages={messages.checklist}
        selectedKeys={selectedKeys}
        onChange={(next) => {
          if (additional && next.length) onSecondaryRegionSelect?.(secondary);
          onChange([...selectedKeys.filter((key) => !keys.has(key)), ...next]);
        }}
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      {([primary, secondary] as const).map((groupRegion) => {
        const additional = groupRegion === secondary;
        const regionItems = additional ? secondaryItems : primaryItems;
        const count = getPresetSelection(
          regionItems,
          selectedKeys,
          disabledKeys,
        ).length;
        return (
          <RegionCard
            key={groupRegion}
            region={groupRegion}
            title={messages.title(groupRegion)}
            countLabel={messages.selectedCount(count)}
            defaultExpanded={!additional || count > 0}
            hint={additional ? messages.sharedHint?.(primary) : undefined}
          >
            {renderChecklist(regionItems, additional)}
          </RegionCard>
        );
      })}
    </Stack>
  );
}

function RegionCard({
  region,
  title,
  countLabel,
  defaultExpanded,
  hint,
  children,
}: {
  region: LedgerSetupRegion;
  title: string;
  countLabel: string;
  defaultExpanded: boolean;
  hint?: string;
  children: ReactElement;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const countId = `${panelId}-count`;

  return (
    <Box component="section" sx={regionCardSx}>
      <Typography component="h4" aria-labelledby={titleId}>
        <ButtonBase
          aria-controls={expanded ? panelId : undefined}
          aria-describedby={countId}
          aria-expanded={expanded}
          aria-labelledby={titleId}
          onClick={() => setExpanded((value) => !value)}
          sx={regionHeaderSx}
        >
          <PresetDisclosureChevron expanded={expanded} />
          <Box
            component="img"
            src={`/flags/${region}.svg`}
            alt=""
            sx={{ width: 20, height: 14, flexShrink: 0 }}
          />
          <span id={titleId}>{title}</span>
          <Typography
            component="span"
            id={countId}
            variant="caption"
            sx={regionCountSx}
          >
            {countLabel}
          </Typography>
        </ButtonBase>
      </Typography>
      <PresetDisclosurePanel id={panelId} expanded={expanded}>
        <Box>
          {hint && (
            <Typography
              color="textSecondary"
              variant="caption"
              component="p"
              sx={{ px: 1.5, pb: 1 }}
            >
              {hint}
            </Typography>
          )}
          {children}
        </Box>
      </PresetDisclosurePanel>
    </Box>
  );
}

const regionCardSx = {
  bgcolor: "var(--user-theme-card-bg)",
  border: "1px solid var(--user-theme-card-border)",
  borderRadius: `${designTokens.radius.md}px`,
  boxShadow: "var(--user-theme-card-shadow)",
  overflow: "hidden",
};

const regionHeaderSx = {
  gap: 1,
  justifyContent: "flex-start",
  minHeight: 52,
  px: 1.5,
  width: "100%",
  typography: "body1",
  fontWeight: 700,
  textAlign: "left",
  "& .MuiSvgIcon-root": { color: "primary.dark", flexShrink: 0 },
  "&.Mui-focusVisible": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: -2,
  },
};

const regionCountSx = {
  ml: "auto",
  px: 1,
  py: 0.25,
  borderRadius: `${designTokens.radius.full}px`,
  bgcolor: "var(--user-theme-badge-bg)",
  color: "var(--user-theme-badge-color)",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
