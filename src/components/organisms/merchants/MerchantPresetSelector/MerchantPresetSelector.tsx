"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";
import { regionPresetMessages as messages } from "config/regionPresetMessages";
import { merchantPresetMessages } from "config/merchantPresetMessages";
import type { LedgerSetupRegion } from "internal/ledger";
import { GroupedPresetChecklist } from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";
import type { buildMerchantChecklist } from "utils/merchantPresets";
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
  const secondaryCount = getPresetSelection(
    secondaryItems,
    selectedKeys,
    disabledKeys,
  ).length;
  const [secondaryExpanded, setSecondaryExpanded] = useState(
    secondaryCount > 0,
  );
  const panelId = useId();

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
    <Stack spacing={1}>
      <Typography component="h4" sx={{ fontWeight: 700 }}>
        {messages.merchantGroup(primary)}
      </Typography>
      {renderChecklist(primaryItems)}
      <Stack component="section">
        <Typography component="h4">
          <ButtonBase
            aria-controls={secondaryExpanded ? panelId : undefined}
            aria-expanded={secondaryExpanded}
            onClick={() => setSecondaryExpanded((value) => !value)}
            sx={secondaryHeaderSx}
          >
            <ChevronRightRoundedIcon
              aria-hidden
              fontSize="small"
              sx={{
                transform: secondaryExpanded ? "rotate(90deg)" : undefined,
              }}
            />
            {messages.merchantGroup(secondary)}
            <Typography
              component="span"
              color="textSecondary"
              variant="body2"
              sx={{ ml: "auto" }}
            >
              {messages.merchantSelectedCount(secondaryCount)}
            </Typography>
          </ButtonBase>
        </Typography>
        <Collapse
          id={panelId}
          inert={!secondaryExpanded}
          in={secondaryExpanded}
          mountOnEnter
          unmountOnExit
        >
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Typography color="textSecondary" variant="body2">
              {messages.sharedMerchants(primary)}
            </Typography>
            {renderChecklist(secondaryItems, true)}
          </Stack>
        </Collapse>
      </Stack>
    </Stack>
  );
}

const secondaryHeaderSx = {
  border: "1px dashed",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  gap: 1,
  justifyContent: "flex-start",
  minHeight: 44,
  px: 1.5,
  width: "100%",
  fontWeight: 700,
  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
};
