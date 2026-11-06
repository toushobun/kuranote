"use client";

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { memo, useId, type ReactNode } from "react";

import {
  PresetDisclosureChevron,
  PresetDisclosurePanel,
} from "molecules/ui/PresetDisclosure/PresetDisclosure";

import { useGroupedPresetChecklist } from "./useGroupedPresetChecklist";

export type GroupedPresetChecklistGroup = {
  /** emoji 字符串或图标元素，直接显示于分类标题行。 */
  icon: ReactNode;
  /** 分组下的项目 key（显示顺序）。同一项目可以出现在多个分组中。 */
  itemKeys: readonly string[];
  key: string;
  name: string;
};

export type GroupedPresetChecklistItem = {
  key: string;
  name: string;
  /** 名称下方的副文字（例如商家的官网域名）。 */
  secondaryText?: string;
  iconUrl?: string | null;
};

/** 组件内显示的文案，由调用方提供（组件不写死业务单位与中文）。 */
export type GroupedPresetChecklistMessages = {
  alsoIn?: (names: string[]) => string;
  /** 分组三态复选框的无障碍名称，需包含分组名。 */
  groupCheckboxLabel: (groupName: string) => string;
  /** 与分组名称同行显示的已选数量。 */
  groupSelectedCount: (
    selected: number,
    total: number,
    added: number,
  ) => string;
  /** 禁用且已勾选项目右侧的小标记；未提供时不显示标记。 */
  added?: string;
};

export type GroupedPresetChecklistProps = {
  disabled?: boolean;
  /** 已添加的项目：已勾选、不可取消、不计入本次选择。 */
  disabledKeys?: readonly string[];
  groups: readonly GroupedPresetChecklistGroup[];
  items: readonly GroupedPresetChecklistItem[];
  messages: GroupedPresetChecklistMessages;
  /** 勾选变化后的项目 key 列表（按 items 的顺序、已去重）。 */
  onChange: (selectedKeys: string[]) => void;
  selectedKeys: readonly string[];
};

/**
 * 「分组 → 项目」两层预设勾选。勾选状态以项目为单位（受控），
 * 分组复选框对其下可选项目进行批量操作。
 * 可同时展开多个分组。
 */
export function GroupedPresetChecklist({
  disabled = false,
  disabledKeys,
  groups,
  items,
  messages,
  onChange,
  selectedKeys,
}: GroupedPresetChecklistProps) {
  const checklist = useGroupedPresetChecklist({
    disabledKeys,
    groups,
    items,
    onChange,
    selectedKeys,
  });

  return (
    <Box sx={listSx}>
      {checklist.groups.map((row) => (
        <ChecklistGroup
          key={row.group.key}
          {...row}
          disabled={disabled}
          groups={groups}
          disabledSet={checklist.disabledSet}
          messages={messages}
          onSetItemsChecked={checklist.setItemsChecked}
          onToggleExpanded={checklist.toggleExpanded}
          selectedSet={checklist.selectedSet}
        />
      ))}
    </Box>
  );
}

type ChecklistGroupProps = {
  groups: readonly GroupedPresetChecklistGroup[];
  addedCount: number;
  disabledSet: ReadonlySet<string>;
  disabled: boolean;
  expanded: boolean;
  group: GroupedPresetChecklistGroup;
  items: readonly GroupedPresetChecklistItem[];
  messages: GroupedPresetChecklistMessages;
  onSetItemsChecked: (keys: readonly string[], checked: boolean) => void;
  onToggleExpanded: (groupKey: string) => void;
  selectedCount: number;
  selectedSet: ReadonlySet<string>;
};

function ChecklistGroup({
  groups,
  addedCount,
  disabledSet,
  disabled,
  expanded,
  group,
  items,
  messages,
  onSetItemsChecked,
  onToggleExpanded,
  selectedCount,
  selectedSet,
}: ChecklistGroupProps) {
  const panelId = useId();
  const total = items.length - addedCount;
  const allSelected =
    (total > 0 && selectedCount === total) || (total === 0 && addedCount > 0);
  const mixed = selectedCount > 0 && !allSelected;

  return (
    <Box aria-label={group.name} component="section">
      <Box sx={groupRowSx}>
        <ButtonBase
          aria-controls={expanded ? panelId : undefined}
          aria-describedby={`${panelId}-count`}
          aria-expanded={expanded}
          aria-label={group.name}
          onClick={() => onToggleExpanded(group.key)}
          sx={groupButtonSx}
        >
          <PresetDisclosureChevron expanded={expanded} />
          <Box aria-hidden sx={groupIconSx}>
            {group.icon}
          </Box>
          <Typography component="span" sx={groupNameSx}>
            {group.name}
          </Typography>
          <Typography
            component="span"
            id={`${panelId}-count`}
            color="textSecondary"
            variant="body2"
          >
            {messages.groupSelectedCount(selectedCount, total, addedCount)}
          </Typography>
        </ButtonBase>
        <Checkbox
          checked={allSelected}
          disabled={disabled || total === 0}
          indeterminate={mixed}
          sx={{ minWidth: 44, minHeight: 44 }}
          onChange={() =>
            onSetItemsChecked(
              items
                .filter(({ key }) => !disabledSet.has(key))
                .map(({ key }) => key),
              !allSelected,
            )
          }
          slotProps={{
            input: {
              "aria-label": messages.groupCheckboxLabel(group.name),
              "aria-checked": mixed ? "mixed" : undefined,
            },
          }}
        />
      </Box>
      <PresetDisclosurePanel id={panelId} expanded={expanded}>
        <Box sx={panelSx}>
          <ChecklistRows
            group={group}
            groups={groups}
            items={items}
            disabled={disabled}
            disabledSet={disabledSet}
            selectedSet={selectedSet}
            messages={messages}
            onSetItemsChecked={onSetItemsChecked}
          />
        </Box>
      </PresetDisclosurePanel>
    </Box>
  );
}

function ChecklistRows({
  group,
  groups,
  items,
  disabled,
  disabledSet,
  selectedSet,
  messages,
  onSetItemsChecked,
}: Pick<
  ChecklistGroupProps,
  | "group"
  | "groups"
  | "items"
  | "disabled"
  | "disabledSet"
  | "selectedSet"
  | "messages"
  | "onSetItemsChecked"
>) {
  return (
    <>
      {items.map((item) => (
        <ChecklistItemRow
          added={disabledSet.has(item.key)}
          addedLabel={messages.added}
          checked={disabledSet.has(item.key) || selectedSet.has(item.key)}
          disabled={disabled || disabledSet.has(item.key)}
          item={item}
          alsoIn={
            messages.alsoIn &&
            groups.some(
              (g) => g.key !== group.key && g.itemKeys.includes(item.key),
            )
              ? messages.alsoIn(
                  groups
                    .filter(
                      (g) =>
                        g.key !== group.key && g.itemKeys.includes(item.key),
                    )
                    .map((g) => g.name),
                )
              : undefined
          }
          key={item.key}
          onSetItemsChecked={onSetItemsChecked}
        />
      ))}
    </>
  );
}

type ChecklistItemRowProps = {
  alsoIn?: string;
  added: boolean;
  addedLabel?: string;
  checked: boolean;
  disabled: boolean;
  item: GroupedPresetChecklistItem;
  onSetItemsChecked: (keys: readonly string[], checked: boolean) => void;
};

// 勾选单个项目时只有该项目（及其他分组中的同一项目）的行重新渲染。
const ChecklistItemRow = memo(function ChecklistItemRow({
  alsoIn,
  added,
  addedLabel,
  checked,
  disabled,
  item,
  onSetItemsChecked,
}: ChecklistItemRowProps) {
  return (
    <FormControlLabel
      labelPlacement="start"
      control={
        <Checkbox
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onSetItemsChecked([item.key], event.target.checked)
          }
        />
      }
      label={
        <Box component="span" sx={itemContentSx}>
          {item.iconUrl !== undefined ? (
            <Avatar
              aria-hidden
              alt=""
              src={item.iconUrl ?? undefined}
              sx={{
                bgcolor: "primary.light",
                color: "text.primary",
                height: 34,
                width: 34,
              }}
            >
              {Array.from(item.name)[0]}
            </Avatar>
          ) : null}
          <Box component="span" sx={itemLabelSx}>
            <Box component="span" sx={itemNameSx}>
              {item.name}
            </Box>
            {item.secondaryText ? (
              <Box
                component="span"
                sx={[itemSecondarySx, added && addedTextSx]}
              >
                {item.secondaryText}
              </Box>
            ) : null}
            {alsoIn ? (
              <Box component="span" sx={itemSecondarySx}>
                {alsoIn}
              </Box>
            ) : null}
          </Box>
          {added && addedLabel ? (
            <Chip
              component="span"
              label={addedLabel}
              size="small"
              sx={addedTextSx}
            />
          ) : null}
        </Box>
      }
      sx={itemRowSx}
    />
  );
});

const listSx = {
  "& > section": {
    borderTop: "1px solid",
    borderColor: "divider",
  },
};

const groupRowSx = {
  alignItems: "center",
  display: "flex",
  pr: 0.5,
};

const groupButtonSx = {
  flex: 1,
  minWidth: 0,
  justifyContent: "flex-start",
  minHeight: 44,
  gap: 0.75,
  px: 1,
  textAlign: "left",
  "&.Mui-focusVisible": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: -2,
  },
  "@media (hover: hover)": {
    "&:hover": { bgcolor: "action.hover" },
  },
};

const groupIconSx = { fontSize: 20, flexShrink: 0 };

const groupNameSx = {
  fontSize: 16,
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const panelSx = {
  borderTop: "1px solid",
  borderColor: "divider",
  ml: 2,
  mr: 0.5,
  pl: 2.5,
};

const itemRowSx = {
  alignItems: "center",
  minHeight: 56,
  mx: 0,
  width: "100%",
  "&:not(:last-child)": { borderBottom: "1px solid", borderColor: "divider" },
  "& .MuiFormControlLabel-label": {
    minWidth: 0,
    width: "100%",
  },
};

const itemLabelSx = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
};

const itemNameSx = {
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const itemSecondarySx = {
  color: "text.secondary",
  fontSize: 12,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const itemContentSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  width: "100%",
};
const addedTextSx = { color: "text.disabled" };
