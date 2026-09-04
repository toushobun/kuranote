"use client";

import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useActionState, useState } from "react";

import { defaultMerchantTagEmoji } from "config/merchantTagEmojis";
import { merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { SelectableFilterTag } from "molecules/ui/SelectableFilterTag/SelectableFilterTag";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { MerchantTagIconField } from "organisms/merchants/MerchantTagIconField/MerchantTagIconField";
import { designTokens } from "theme/theme";
import type {
  MerchantTag,
  MerchantTagActionState,
  MerchantTagReorderAction,
  MerchantTagStateAction,
} from "types/merchants";

import {
  type MerchantTagMoveDirection,
  useMerchantTagManager,
} from "./useMerchantTagManager";

type MerchantTagFilterProps = {
  keyword: string;
  mode?: "filter";
  selectedTagId?: string | null;
  tags: MerchantTag[];
};

type MerchantTagManagementProps = {
  archiveAction: MerchantTagStateAction;
  createAction: MerchantTagStateAction;
  mode: "management";
  reorderAction: MerchantTagReorderAction;
  tags: MerchantTag[];
  updateAction: MerchantTagStateAction;
};

type MerchantTagManagerProps =
  | MerchantTagFilterProps
  | MerchantTagManagementProps;

const initialState: MerchantTagActionState = {};

function filterHref(keyword: string, tagId?: string) {
  const query = new URLSearchParams();
  if (keyword.trim()) query.set("q", keyword.trim());
  if (tagId) query.set("tagId", tagId);
  const suffix = query.toString();
  return suffix ? `${routePaths.merchants}?${suffix}` : routePaths.merchants;
}

function MerchantTagFilter({
  keyword,
  selectedTagId,
  tags,
}: MerchantTagFilterProps) {
  return (
    <Stack
      aria-label="商家分类筛选"
      data-testid="merchant-tag-filter-list"
      direction="row"
      sx={{
        WebkitOverflowScrolling: "touch",
        flexWrap: "nowrap",
        gap: 1,
        overflowX: "auto",
        overscrollBehaviorX: "contain",
        pb: 0.5,
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "divider",
          borderRadius: `${designTokens.radius.full}px`,
        },
      }}
    >
      {tags.map((tag) => {
        const selected = selectedTagId === tag.id;

        return (
          <SelectableFilterTag
            ariaLabel={`${tag.name}，${tag.merchant_count} 个商家`}
            count={tag.merchant_count}
            href={filterHref(keyword, tag.id)}
            icon={tag.icon}
            key={tag.id}
            label={tag.name}
            selected={selected}
          />
        );
      })}
    </Stack>
  );
}

function MerchantTagManagement({
  archiveAction,
  createAction,
  reorderAction,
  tags,
  updateAction,
}: MerchantTagManagementProps) {
  const [editingTag, setEditingTag] = useState<MerchantTag | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(defaultMerchantTagEmoji);
  const [createState, dispatchCreate, createPending] = useActionState(
    async (previousState: MerchantTagActionState, formData: FormData) => {
      const nextState = await createAction(previousState, formData);
      if (!nextState.error) setCreating(false);
      return nextState;
    },
    initialState,
  );
  const [updateState, dispatchUpdate, updatePending] = useActionState(
    async (previousState: MerchantTagActionState, formData: FormData) => {
      const nextState = await updateAction(previousState, formData);
      if (!nextState.error) setEditingTag(null);
      return nextState;
    },
    initialState,
  );
  const [archiveState, dispatchArchive, archivePending] = useActionState(
    async (previousState: MerchantTagActionState, formData: FormData) => {
      const nextState = await archiveAction(previousState, formData);
      if (!nextState.error) setEditingTag(null);
      return nextState;
    },
    initialState,
  );
  const [reorderState, setReorderState] = useState(initialState);
  const manager = useMerchantTagManager({
    onReorderError: setReorderState,
    reorderAction,
    tags,
  });
  const pending =
    createPending || updatePending || archivePending || manager.isPending;

  function openCreate() {
    setName("");
    setIcon(defaultMerchantTagEmoji);
    setCreating(true);
  }

  function openEdit(tag: MerchantTag) {
    setName(tag.name);
    setIcon(tag.icon);
    setEditingTag(tag);
  }

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        {manager.orderedTags.map((tag) => (
          <Stack
            data-merchant-tag-row-id={tag.id}
            direction="row"
            key={tag.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => manager.dropOn(event, tag.id)}
            spacing={1}
            sx={{
              alignItems: "center",
              border: 1,
              borderColor: "divider",
              borderRadius: `${designTokens.radius.item}px`,
              minHeight: 64,
              opacity: manager.draggedId === tag.id ? 0.58 : 1,
              px: 1,
              py: 0.5,
            }}
          >
            <Box
              aria-hidden
              sx={{
                alignItems: "center",
                bgcolor: "var(--user-theme-icon-badge-bg)",
                borderRadius: `${designTokens.radius.sm}px`,
                display: "flex",
                fontSize: "1.5rem",
                height: 42,
                justifyContent: "center",
                width: 42,
              }}
            >
              {tag.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography noWrap sx={{ fontWeight: 700 }}>
                  {tag.name}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    bgcolor: "var(--user-theme-icon-badge-bg)",
                    borderRadius: `${designTokens.radius.full}px`,
                    color: "primary.main",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    px: 0.75,
                    py: 0.5,
                  }}
                >
                  {tag.merchant_count}
                </Box>
              </Stack>
            </Box>
            <Tooltip title={`编辑${tag.name}`}>
              <Button
                aria-label={`编辑${tag.name}`}
                disabled={pending}
                onClick={() => openEdit(tag)}
                size="small"
                startIcon={<EditRoundedIcon fontSize="small" />}
                sx={{ color: "text.secondary", flexShrink: 0, minWidth: 0 }}
              >
                {merchantText.editCategory}
              </Button>
            </Tooltip>
            <Divider flexItem orientation="vertical" />
            <Tooltip title={`拖动${tag.name}调整排序，也可使用上下方向键`}>
              <span>
                <IconButton
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  aria-label={`调整${tag.name}排序`}
                  disabled={pending}
                  draggable
                  onDragEnd={manager.finishDrag}
                  onDragStart={(event) => manager.startDrag(event, tag.id)}
                  onKeyDown={(event) => {
                    let direction: MerchantTagMoveDirection | null = null;
                    if (event.key === "ArrowUp") direction = -1;
                    if (event.key === "ArrowDown") direction = 1;
                    if (direction) {
                      event.preventDefault();
                      manager.moveTag(tag.id, direction);
                    }
                  }}
                  size="small"
                  sx={{ cursor: "grab" }}
                >
                  <DragIndicatorRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ))}
        <Button
          disabled={pending}
          onClick={openCreate}
          startIcon={<AddRoundedIcon />}
          sx={{
            borderRadius: `${designTokens.radius.item}px`,
            borderStyle: "dashed",
            py: 1.25,
          }}
          type="button"
          variant="outlined"
        >
          {merchantText.addCategory}
        </Button>
      </Stack>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setCreating(false)}
        open={creating}
      >
        <DialogTitle>新增标签</DialogTitle>
        <DialogContent dividers>
          <Stack
            action={dispatchCreate}
            component="form"
            id="merchant-tag-create-form"
            spacing={2.5}
          >
            <TextField
              autoComplete="off"
              fullWidth
              label="标签名称"
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              slotProps={{ htmlInput: { maxLength: 100 } }}
              value={name}
            />
            <MerchantTagIconField onChange={setIcon} value={icon} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(false)}>取消</Button>
          <Button
            disabled={createPending}
            form="merchant-tag-create-form"
            type="submit"
            variant="contained"
          >
            新增
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setEditingTag(null)}
        open={editingTag !== null}
      >
        <DialogTitle>编辑标签</DialogTitle>
        <DialogContent dividers>
          <Stack
            action={dispatchUpdate}
            component="form"
            id="merchant-tag-edit-form"
            spacing={2.5}
          >
            <input name="tagId" type="hidden" value={editingTag?.id ?? ""} />
            <TextField
              autoComplete="off"
              fullWidth
              label="标签名称"
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              slotProps={{ htmlInput: { maxLength: 100 } }}
              value={name}
            />
            <MerchantTagIconField onChange={setIcon} value={icon} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Stack action={dispatchArchive} component="form">
            <input name="tagId" type="hidden" value={editingTag?.id ?? ""} />
            <Button
              color="error"
              disabled={archivePending}
              startIcon={<ArchiveRoundedIcon />}
              type="submit"
            >
              归档标签
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setEditingTag(null)}>取消</Button>
            <Button
              disabled={updatePending}
              form="merchant-tag-edit-form"
              type="submit"
              variant="contained"
            >
              保存
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <MerchantFailureFeedback state={createState} title="标签新增失败" />
      <MerchantFailureFeedback state={updateState} title="标签更新失败" />
      <MerchantFailureFeedback state={archiveState} title="标签归档失败" />
      <MerchantFailureFeedback state={reorderState} title="标签排序失败" />
    </Stack>
  );
}

export function MerchantTagManager(props: MerchantTagManagerProps) {
  if (props.mode === "management") {
    return <MerchantTagManagement {...props} />;
  }

  return <MerchantTagFilter {...props} />;
}
