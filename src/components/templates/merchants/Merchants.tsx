import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantForm } from "organisms/merchants/MerchantForm/MerchantForm";
import { MerchantList } from "organisms/merchants/MerchantList/MerchantList";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type { ServerAction } from "types/actions";
import type { MerchantRow } from "types/merchants";

type MerchantsTemplateProps = {
  archiveMerchantAction: ServerAction;
  archiveMerchantAliasAction: ServerAction;
  canManageMerchants?: boolean;
  createMerchantAction: ServerAction;
  createMerchantAliasAction: ServerAction;
  keyword: string;
  ledgerName: string;
  merchants: MerchantRow[];
  updateMerchantAction: ServerAction;
};

export function MerchantsTemplate({
  archiveMerchantAction,
  archiveMerchantAliasAction,
  canManageMerchants = true,
  createMerchantAction,
  createMerchantAliasAction,
  keyword,
  ledgerName,
  merchants,
  updateMerchantAction,
}: MerchantsTemplateProps) {
  return (
    <PageShell>
      <PageHeader
        title="商家"
        subtitle={
          <Stack spacing={0.5}>
            <span>当前账本：{ledgerName}</span>
            <span>
              管理常用商家、商家网址、备注和别名。KuraNote
              会以商家为主轴，再结合分类进行统计。
            </span>
          </Stack>
        }
      />

      <SectionCard component="form" sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            defaultValue={keyword}
            fullWidth
            helperText="同时匹配商家主名称和别名。"
            label="搜索商家"
            name="q"
            placeholder="例如：LIFE、来福、スギ"
          />
          <Button
            sx={{ alignSelf: "flex-start" }}
            type="submit"
            variant="outlined"
          >
            搜索
          </Button>
        </Stack>
      </SectionCard>

      {canManageMerchants ? (
        <MerchantForm action={createMerchantAction} />
      ) : null}
      <MerchantList
        archiveAliasAction={archiveMerchantAliasAction}
        archiveMerchantAction={archiveMerchantAction}
        canManageMerchants={canManageMerchants}
        createAliasAction={createMerchantAliasAction}
        merchants={merchants}
        updateMerchantAction={updateMerchantAction}
      />
    </PageShell>
  );
}
