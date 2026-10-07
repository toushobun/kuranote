"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Fragment, memo, useId, type ReactNode } from "react";

import { designTokens } from "theme/theme";

import { useGroupedPresetChecklist } from "./useGroupedPresetChecklist";

export type GroupedPresetChecklistGroup = {
  /** emoji 字符串或图标元素，显示在浅色圆形底座中。 */
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
};

/** 组件内显示的文案，由调用方提供（组件不写死业务单位与中文）。 */
export type GroupedPresetChecklistMessages = {
  /** 分组三态复选框的无障碍名称，需包含分组名。 */
  groupCheckboxLabel: (groupName: string) => string;
  /** 分组名下方的已选数量，例如「已选 3 / 5 家」。 */
  groupSelectedCount: (selected: number, total: number) => string;
  /** 展开区域顶部的「全选」。 */
  selectAll: string;
  /** 展开区域顶部的「全不选」。 */
  selectNone: string;
};

export type GroupedPresetChecklistProps = {
  disabled?: boolean;
  groups: readonly GroupedPresetChecklistGroup[];
  items: readonly GroupedPresetChecklistItem[];
  messages: GroupedPresetChecklistMessages;
  /** 勾选变化后的项目 key 列表（按 items 的顺序、已去重）。 */
  onChange: (selectedKeys: string[]) => void;
  selectedKeys: readonly string[];
};

/**
 * 「分组 → 项目」两层预设勾选。勾选状态以项目为单位（受控），
 * 分组复选框与展开区域的「全选 / 全不选」只是对其下项目的批量操作。
 * 可同时展开多个分组。
 */
export function GroupedPresetChecklist({
  disabled = false,
  groups,
  items,
  messages,
  onChange,
  selectedKeys,
}: GroupedPresetChecklistProps) {
  const checklist = useGroupedPresetChecklist({
    groups,
    items,
    onChange,
    selectedKeys,
  });

  return (
    <Box sx={listSx}>
      {checklist.groups.map((row, index) => (
        <Fragment key={row.group.key}>
          {index > 0 ? <Divider /> : null}
          <ChecklistGroup
            {...row}
            disabled={disabled}
            messages={messages}
            onSetItemsChecked={checklist.setItemsChecked}
            onToggleExpanded={checklist.toggleExpanded}
            selectedSet={checklist.selectedSet}
          />
        </Fragment>
      ))}
    </Box>
  );
}

type ChecklistGroupProps = {
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
  const total = items.length;
  const allSelected = total > 0 && selectedCount === total;
  const itemKeys = items.map(({ key }) => key);

  return (
    <Box aria-label={group.name} component="section">
      {/* 点击行的任意位置展开 / 收起；键盘操作通过右侧的展开按钮。 */}
      <Box onClick={() => onToggleExpanded(group.key)} sx={groupRowSx}>
        <Box aria-hidden sx={groupIconSx}>
          {group.icon}
        </Box>
        <Box sx={groupTextSx}>
          <Typography component="h4" sx={groupNameSx}>
            {group.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {messages.groupSelectedCount(selectedCount, total)}
          </Typography>
        </Box>
        <Checkbox
          checked={allSelected}
          disabled={disabled || total === 0}
          indeterminate={selectedCount > 0 && !allSelected}
          onChange={() => onSetItemsChecked(itemKeys, !allSelected)}
          // 点击复选框只切换勾选，不展开。
          onClick={(event) => event.stopPropagation()}
          slotProps={{
            input: { "aria-label": messages.groupCheckboxLabel(group.name) },
          }}
        />
        {/* 点击事件冒泡到行，由行统一切换展开状态。 */}
        <IconButton
          aria-controls={expanded ? panelId : undefined}
          aria-expanded={expanded}
          aria-label={group.name}
          size="small"
        >
          <ExpandMoreRoundedIcon
            sx={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: `transform ${designTokens.motion.collapse}ms`,
            }}
          />
        </IconButton>
      </Box>
      <Collapse
        id={panelId}
        in={expanded}
        timeout={designTokens.motion.collapse}
        unmountOnExit
      >
        <Box sx={panelSx}>
          <Stack direction="row" sx={panelActionsSx}>
            <Button
              disabled={disabled || allSelected}
              onClick={() => onSetItemsChecked(itemKeys, true)}
              size="small"
              sx={panelActionButtonSx}
              variant="text"
            >
              {messages.selectAll}
            </Button>
            <Button
              disabled={disabled || selectedCount === 0}
              onClick={() => onSetItemsChecked(itemKeys, false)}
              size="small"
              sx={panelActionButtonSx}
              variant="text"
            >
              {messages.selectNone}
            </Button>
          </Stack>
          {items.map((item) => (
            <ChecklistItemRow
              checked={selectedSet.has(item.key)}
              disabled={disabled}
              item={item}
              key={item.key}
              onSetItemsChecked={onSetItemsChecked}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

type ChecklistItemRowProps = {
  checked: boolean;
  disabled: boolean;
  item: GroupedPresetChecklistItem;
  onSetItemsChecked: (keys: readonly string[], checked: boolean) => void;
};

// 勾选单个项目时只有该项目（及其他分组中的同一项目）的行重新渲染。
const ChecklistItemRow = memo(function ChecklistItemRow({
  checked,
  disabled,
  item,
  onSetItemsChecked,
}: ChecklistItemRowProps) {
  return (
    <FormControlLabel
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
        <Box component="span" sx={itemLabelSx}>
          <Box component="span" sx={itemNameSx}>
            {item.name}
          </Box>
          {item.secondaryText ? (
            <Box component="span" sx={itemSecondarySx}>
              {item.secondaryText}
            </Box>
          ) : null}
        </Box>
      }
      sx={itemRowSx}
    />
  );
});

const listSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.lg}px`,
  overflow: "hidden",
};

// 行高满足手指点击（约 56px）。
const groupRowSx = {
  alignItems: "center",
  cursor: "pointer",
  display: "flex",
  gap: 1.25,
  minHeight: 64,
  pl: 1.6,
  pr: 0.75,
  py: 0.75,
  "@media (hover: hover)": {
    "&:hover": { bgcolor: "action.hover" },
  },
};

const groupIconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  display: "inline-flex",
  flexShrink: 0,
  fontSize: 20,
  height: 40,
  justifyContent: "center",
  width: 40,
};

const groupTextSx = {
  flex: 1,
  minWidth: 0,
};

const groupNameSx = {
  fontSize: 16,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const panelSx = {
  bgcolor: designTokens.color.background.subtle,
  pb: 0.5,
  pl: { xs: 3, sm: 4 },
  pr: 1.6,
};

const panelActionsSx = {
  gap: 0.5,
  justifyContent: "flex-end",
  minHeight: 44,
  alignItems: "center",
};

const panelActionButtonSx = {
  color: "var(--user-theme-action-text)",
  fontWeight: 800,
  minHeight: 40,
};

const itemRowSx = {
  alignItems: "center",
  minHeight: 56,
  mx: 0,
  width: "100%",
  "& .MuiFormControlLabel-label": {
    minWidth: 0,
  },
};

const itemLabelSx = {
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
  overflowWrap: "anywhere",
};
