"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState, type ReactElement } from "react";
import { regionPresetMessages as messages } from "config/regionPresetMessages";
import { merchantPresetMessages } from "config/merchantPresetMessages";
import type { LedgerSetupRegion } from "internal/ledger";
import { GroupedPresetChecklist } from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";
import type { buildMerchantChecklist } from "utils/merchantPresets";
import {
  PresetDisclosureChevron,
  PresetDisclosurePanel,
} from "molecules/ui/PresetDisclosure/PresetDisclosure";
import { designTokens } from "theme/theme";

export type MerchantPresetSelectorProps = ReturnType<
  typeof buildMerchantChecklist
> & {
  region: LedgerSetupRegion | null;
  additionalRegions: readonly LedgerSetupRegion[];
  onAdditionalRegionsChange: (regions: LedgerSetupRegion[]) => void;
  selectedKeys: readonly string[];
  onChange: (keys: string[]) => void;
  disabledKeys?: readonly string[];
  disabled?: boolean;
};

export function MerchantPresetSelector({
  region,
  additionalRegions,
  onAdditionalRegionsChange,
  items,
  groups,
  onChange,
  selectedKeys,
  disabledKeys,
  disabled,
}: MerchantPresetSelectorProps) {
  const primary = region ?? "jp";
  const secondary = primary === "jp" ? "cn" : "jp";
  const primaryItems = items.filter((item) => item.regions.includes(primary));
  const secondaryItems = items.filter(
    (item) =>
      item.regions.includes(secondary) && !item.regions.includes(primary),
  );
  function renderChecklist(regionItems: typeof items, additional = false) {
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
        messages={merchantPresetMessages.checklist}
        selectedKeys={selectedKeys}
        onChange={(next) => {
          if (
            additional &&
            next.length &&
            !additionalRegions.includes(secondary)
          ) {
            onAdditionalRegionsChange([...additionalRegions, secondary]);
          }
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
          <MerchantRegionCard
            key={groupRegion}
            region={groupRegion}
            count={count}
            defaultExpanded={!additional || count > 0}
            hint={additional ? messages.sharedMerchants(primary) : undefined}
          >
            {renderChecklist(regionItems, additional)}
          </MerchantRegionCard>
        );
      })}
    </Stack>
  );
}

function MerchantRegionCard({
  region,
  count,
  defaultExpanded,
  hint,
  children,
}: {
  region: LedgerSetupRegion;
  count: number;
  defaultExpanded: boolean;
  hint?: string;
  children: ReactElement;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const countId = `${panelId}-count`;
  const title = messages.merchantGroup(region);

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
            {messages.merchantSelectedCount(count)}
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
  bgcolor: "common.white",
  borderRadius: `${designTokens.radius.md}px`,
  boxShadow: 1,
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
  bgcolor: "primary.light",
  color: "primary.dark",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
