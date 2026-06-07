import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  categoryTypeOptions,
  type CategoryParentOption,
} from "types/categories";
import { GlassCard } from "ui/GlassCard";

type CategoryAction = (formData: FormData) => void | Promise<void>;

type CategoryFormProps = {
  createCategoryAction: CategoryAction;
  parentOptions: CategoryParentOption[];
};

export function CategoryForm({
  createCategoryAction,
  parentOptions,
}: CategoryFormProps) {
  return (
    <GlassCard sx={{ mt: 4, p: 3 }}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
        新增分类
      </Typography>

      <Stack
        component="form"
        action={createCategoryAction}
        spacing={2.5}
        sx={{ mt: 3 }}
      >
        <TextField
          autoComplete="off"
          fullWidth
          label="分类名称"
          name="name"
          placeholder="例如：餐饮、工资、交通"
          required
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />

        <TextField
          defaultValue="expense"
          fullWidth
          label="分类类型"
          name="type"
          required
          select
        >
          {categoryTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          defaultValue=""
          fullWidth
          helperText="留空时创建大分类；选择大分类时创建可用于记账的小分类。"
          label="上级分类"
          name="parentId"
          select
        >
          <MenuItem value="">无上级分类</MenuItem>
          {parentOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.type === "expense" ? "支出" : "收入"} / {option.name}
            </MenuItem>
          ))}
        </TextField>

        <Button type="submit" variant="contained">
          新增分类
        </Button>
      </Stack>
    </GlassCard>
  );
}
