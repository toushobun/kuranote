"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import { defaultCategoryEmoji } from "config/categoryEmojis";
import {
  type CategoryAction,
  type CategoryParentOption,
  categoryTypeOptions,
} from "types/categories";
import type { TransactionType } from "types/transactions";

import { CategoryIconField } from "../CategoryIconField/CategoryIconField";

type CategoryFormProps = {
  createCategoryAction: CategoryAction;
  parentOptions: CategoryParentOption[];
};

function isTransactionType(value: string): value is TransactionType {
  return value === "expense" || value === "income";
}

export function CategoryForm({
  createCategoryAction,
  parentOptions,
}: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [iconName, setIconName] = useState(defaultCategoryEmoji);
  const filteredParentOptions = parentOptions.filter(
    (option) => option.type === selectedType,
  );

  function closeDialog() {
    setOpen(false);
    setCategoryName("");
    setSelectedType("expense");
    setSelectedParentId("");
    setIconName(defaultCategoryEmoji);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        startIcon={<AddRoundedIcon />}
        type="button"
        variant="contained"
      >
        新增分类
      </Button>

      <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={open}>
        <DialogTitle>新增分类</DialogTitle>
        <Stack component="form" action={createCategoryAction}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                autoComplete="off"
                fullWidth
                label="分类名称"
                name="name"
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="例如：餐饮、工资、交通"
                required
                slotProps={{ htmlInput: { maxLength: 100 } }}
                value={categoryName}
              />

              <TextField
                fullWidth
                label="分类类型"
                name="type"
                onChange={(event) => {
                  const value = event.target.value;

                  if (isTransactionType(value)) {
                    setSelectedType(value);
                    setSelectedParentId("");
                  }
                }}
                required
                select
                value={selectedType}
              >
                {categoryTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                helperText="留空时创建大分类；选择大分类时创建可用于记账的小分类。"
                label="上级分类"
                name="parentId"
                onChange={(event) => setSelectedParentId(event.target.value)}
                select
                value={selectedParentId}
              >
                <MenuItem value="">无上级分类</MenuItem>
                {filteredParentOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>

              <CategoryIconField onChange={setIconName} value={iconName} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} type="button">
              取消
            </Button>
            <Button type="submit" variant="contained">
              新增分类
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </>
  );
}
