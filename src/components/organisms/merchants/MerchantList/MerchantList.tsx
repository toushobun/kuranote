import Stack from "@mui/material/Stack";

import { EmptyState } from "molecules/ui/EmptyState";
import type { ServerAction } from "types/actions";
import type { MerchantRow } from "types/merchants";

import { MerchantCard } from "../MerchantCard/MerchantCard";

type MerchantListProps = {
  archiveAliasAction: ServerAction;
  archiveMerchantAction: ServerAction;
  canManageMerchants?: boolean;
  createAliasAction: ServerAction;
  merchantAliasFormResetKeys?: Readonly<Record<string, string>>;
  merchantEditFormResetKeys?: Readonly<Record<string, string>>;
  merchants: MerchantRow[];
  updateMerchantAction: ServerAction;
};

export function MerchantList({
  archiveAliasAction,
  archiveMerchantAction,
  canManageMerchants = true,
  createAliasAction,
  merchantAliasFormResetKeys = {},
  merchantEditFormResetKeys = {},
  merchants,
  updateMerchantAction,
}: MerchantListProps) {
  if (merchants.length === 0) {
    return (
      <EmptyState
        title="还没有商家"
        description={
          canManageMerchants
            ? "请先新增一个常用商家。"
            : "当前账本还没有可查看的商家。"
        }
      />
    );
  }

  return (
    <Stack spacing={2.5} sx={{ mt: 4 }}>
      {merchants.map((merchant) => (
        <MerchantCard
          archiveAliasAction={archiveAliasAction}
          archiveMerchantAction={archiveMerchantAction}
          canManageMerchants={canManageMerchants}
          createAliasAction={createAliasAction}
          key={merchant.id}
          merchant={merchant}
          merchantAliasFormResetKey={
            merchantAliasFormResetKeys[merchant.id] ?? "initial"
          }
          merchantEditFormResetKey={
            merchantEditFormResetKeys[merchant.id] ?? "initial"
          }
          updateMerchantAction={updateMerchantAction}
        />
      ))}
    </Stack>
  );
}
