"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { regionPresetMessages as messages } from "config/regionPresetMessages";
import { merchantPresetMessages } from "config/merchantPresetMessages";
import type { LedgerSetupRegion } from "internal/ledger";
import { LedgerRegionField } from "molecules/ledgers/LedgerRegionField/LedgerRegionField";
import { GroupedPresetChecklist } from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import type { buildMerchantChecklist } from "utils/merchantPresets";
import { designTokens } from "theme/theme";
import { getPresetSelection } from "molecules/ui/GroupedPresetChecklist/presetSelection";

export type MerchantPresetSelectorProps = ReturnType<
  typeof buildMerchantChecklist
> & {
  region: LedgerSetupRegion | null;
  recommendationLabel?: string;
  additionalRegions: readonly LedgerSetupRegion[];
  onAdditionalRegionsChange: (regions: LedgerSetupRegion[]) => void;
  selectedKeys: readonly string[];
  onChange: (keys: string[]) => void;
  disabledKeys?: readonly string[];
  disabled?: boolean;
} & (
    | {
        onRegionChange: (region: LedgerSetupRegion) => void;
        onRequestRegionChange?: never;
      }
    | { onRequestRegionChange: () => void; onRegionChange?: never }
  );

/** 向导和商家管理共用分区、追加地区、跨分类联动和已添加状态。 */
export function MerchantPresetSelector(props: MerchantPresetSelectorProps) {
  const {
    region,
    additionalRegions,
    items,
    groups,
    onChange,
    selectedKeys,
    disabled,
  } = props;
  const [changing, setChanging] = useState(false);
  const [collapsedRegions, setCollapsedRegions] = useState<LedgerSetupRegion[]>(
    [],
  );
  const other: LedgerSetupRegion = region === "jp" ? "cn" : "jp";
  const visibleItems = items.filter((item) =>
    item.regions.some(
      (current) => current === region || additionalRegions.includes(current),
    ),
  );
  const selection = getPresetSelection(
    visibleItems,
    selectedKeys,
    props.disabledKeys,
  );

  function renderRegion(current: LedgerSetupRegion, additional: boolean) {
    const regionItems = items.filter(
      (item) =>
        item.regions.includes(current) &&
        (!additional || !region || !item.regions.includes(region)),
    );
    const keys = new Set(regionItems.map((item) => item.key));
    const regionGroups = groups
      .map((group) => ({
        ...group,
        itemKeys: group.itemKeys.filter((key) => keys.has(key)),
      }))
      .filter((group) => group.itemKeys.length > 0);
    return (
      <Stack spacing={1.5} key={current}>
        {additional ? (
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography component="h4" sx={{ fontWeight: 700 }}>
              {messages.merchantGroup(current)}
            </Typography>
            <Button
              onClick={() =>
                setCollapsedRegions((regions) => [...regions, current])
              }
            >
              {messages.collapse}
            </Button>
          </Stack>
        ) : null}
        <GroupedPresetChecklist
          disabled={disabled}
          disabledKeys={props.disabledKeys}
          groups={regionGroups}
          items={regionItems}
          messages={merchantPresetMessages.checklist}
          selectedKeys={selectedKeys}
          onChange={(next) =>
            onChange([
              ...new Set([
                ...selectedKeys.filter((key) => !keys.has(key)),
                ...next,
              ]),
            ])
          }
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {region ? (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "action.hover",
            borderRadius: `${designTokens.radius.item}px`,
            px: 1.5,
            py: 0.5,
          }}
        >
          <Typography variant="body2">
            {props.recommendationLabel ?? messages.recommendation(region)}
          </Typography>
          <Button
            disabled={disabled}
            onClick={() =>
              props.onRequestRegionChange
                ? props.onRequestRegionChange()
                : setChanging((value) => !value)
            }
          >
            {messages.change}
          </Button>
        </Stack>
      ) : null}
      {!region || changing ? (
        props.onRegionChange ? (
          <LedgerRegionField
            disabled={disabled}
            value={region}
            onChange={(next) => {
              props.onRegionChange?.(next);
              setChanging(false);
            }}
          />
        ) : (
          <Button disabled={disabled} onClick={props.onRequestRegionChange}>
            {messages.change}
          </Button>
        )
      ) : null}
      {region ? (
        <>
          <Button
            disabled={disabled || selection.availableKeys.length === 0}
            onClick={() => onChange(selection.toggleAllKeys)}
            sx={{ alignSelf: "flex-end" }}
          >
            {selection.allSelected
              ? merchantPresetMessages.selectNone
              : merchantPresetMessages.selectAll}
          </Button>
          {renderRegion(region, false)}
          {additionalRegions.includes(other) &&
          !collapsedRegions.includes(other) ? (
            renderRegion(other, true)
          ) : (
            <Button
              disabled={disabled}
              variant="outlined"
              onClick={() => {
                props.onAdditionalRegionsChange([
                  ...new Set([...additionalRegions, other]),
                ]);
                setCollapsedRegions((regions) =>
                  regions.filter((region) => region !== other),
                );
              }}
              sx={{ borderStyle: "dashed", minHeight: 52 }}
            >
              {messages.addMerchants(other)}
            </Button>
          )}
        </>
      ) : null}
    </Stack>
  );
}
