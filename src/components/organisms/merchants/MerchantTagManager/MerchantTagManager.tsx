"use client";

import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useActionState, useState } from "react";

import { defaultMerchantTagEmoji } from "config/merchantTagEmojis";
import { routePaths } from "config/paths";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { MerchantTagIconField } from "organisms/merchants/MerchantTagIconField/MerchantTagIconField";
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

type MerchantTagManagerProps = {
  archiveAction: MerchantTagStateAction;
  canManage: boolean;
  createAction: MerchantTagStateAction;
  keyword: string;
  reorderAction: MerchantTagReorderAction;
  selectedTagId?: string | null;
  tags: MerchantTag[];
  updateAction: MerchantTagStateAction;
};

const initialState: MerchantTagActionState = {};

function filterHref(keyword: string, tagId?: string) {
  const query = new URLSearchParams();
  if (keyword.trim()) query.set("q", keyword.trim());
  if (tagId) query.set("tagId", tagId);
  const suffix = query.toString();
  return suffix ? `${routePaths.merchants}?${suffix}` : routePaths.merchants;
}

export function MerchantTagManager({
  archiveAction,
  canManage,
  createAction,
  keyword,
  reorderAction,
  selectedTagId,
  tags,
  updateAction,
}: MerchantTagManagerProps) {
  const [managing, setManaging] = useState(false);
  const [editingTag, setEditingTag] = useState<MerchantTag | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(defaultMerchantTagEmoji);
  const [createState, dispatchCreate, createPending] = useActionState(
    createAction,
    initialState,
  );
  const [updateState, dispatchUpdate, updatePending] = useActionState(
    updateAction,
    initialState,
  );
  const [archiveState, dispatchArchive, archivePending] = useActionState(
    archiveAction,
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
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800 }}>商家标签</Typography>
          <Typography color="text.secondary" variant="body2">
            按标签快速筛选常用商家
          </Typography>
        </Box>
        {canManage ? (
          <Button
            onClick={() => setManaging((value) => !value)}
            size="small"
            type="button"
          >
            {managing ? "完成" : "管理标签"}
          </Button>
        ) : null}
      </Stack>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        {tags.map((tag) => (
          <Chip
            clickable
            color={selectedTagId === tag.id ? "primary" : "default"}
            component={Link}
            href={filterHref(keyword, tag.id)}
            key={tag.id}
            label={`${tag.icon} ${tag.name} · ${tag.merchant_count}`}
            variant={selectedTagId === tag.id ? "filled" : "outlined"}
          />
        ))}
      </Stack>

      {managing ? (
        <Stack
          spacing={0.5}
          sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}
        >
          {manager.orderedTags.map((tag, index) => (
            <Stack
              data-merchant-tag-row-id={tag.id}
              direction="row"
              key={tag.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => manager.dropOn(event, tag.id)}
              spacing={1}
              sx={{
                alignItems: "center",
                minHeight: 56,
                opacity: manager.draggedId === tag.id ? 0.58 : 1,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  alignItems: "center",
                  bgcolor: "var(--user-theme-icon-badge-bg)",
                  borderRadius: 2,
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
                <Typography noWrap sx={{ fontWeight: 700 }}>
                  {tag.name}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {tag.merchant_count} 个商家
                </Typography>
              </Box>
              <Tooltip title={`编辑${tag.name}`}>
                <IconButton
                  aria-label={`编辑${tag.name}`}
                  disabled={pending}
                  onClick={() => openEdit(tag)}
                  size="small"
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
              <Typography
                color="text.disabled"
                sx={{ width: 18 }}
                variant="caption"
              >
                {index + 1}
              </Typography>
            </Stack>
          ))}
          <Button
            disabled={pending}
            onClick={openCreate}
            startIcon={<AddRoundedIcon />}
            sx={{ alignSelf: "flex-start" }}
            type="button"
          >
            新增标签
          </Button>
        </Stack>
      ) : null}

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
            onSubmit={() => setCreating(false)}
            spacing={2.5}
          >
            <TextField
              autoComplete="off"
              fullWidth
              label="标签名称"
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
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
            onSubmit={() => setEditingTag(null)}
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
              value={name}
            />
            <MerchantTagIconField onChange={setIcon} value={icon} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Stack
            action={dispatchArchive}
            component="form"
            onSubmit={() => setEditingTag(null)}
          >
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
