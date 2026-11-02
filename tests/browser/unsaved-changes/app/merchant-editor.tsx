"use client";
import { MerchantCreateTemplate } from "../../../../src/components/templates/merchants/MerchantCreate";
import { MerchantEditTemplate } from "../../../../src/components/templates/merchants/MerchantEdit";
import { createMerchantRow } from "../../../../src/test/mocks/merchants";
import {
  save,
  saveMerchantDetails,
  saveAlias,
  fetchMerchantIcon,
} from "./actions";
const merchant = createMerchantRow();
export function MerchantEditor({ edit }: { edit: boolean }) {
  return edit ? (
    <MerchantEditTemplate
      archiveMerchantAction={save}
      archiveMerchantAliasAction={saveAlias}
      createMerchantAliasAction={saveAlias}
      fetchIconAction={fetchMerchantIcon}
      ledgerId="ledger-1"
      ledgerName="兼容性测试账本"
      merchant={merchant}
      tags={[]}
      setPreferredMerchantAliasAction={saveAlias}
      updateMerchantAction={saveMerchantDetails}
    />
  ) : (
    <MerchantCreateTemplate
      createMerchantAction={save}
      fetchIconAction={fetchMerchantIcon}
      ledgerId="ledger-1"
      ledgerName="兼容性测试账本"
      tags={[]}
    />
  );
}
