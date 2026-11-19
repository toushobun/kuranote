"use client";
import { MerchantCreateTemplate } from "../../../../src/components/templates/merchants/MerchantCreate";
import { MerchantEditTemplate } from "../../../../src/components/templates/merchants/MerchantEdit";
import { createMerchantRow } from "../../../../src/test/mocks/merchants";
import { save, saveMerchantDetails, fetchMerchantIcon } from "./actions";
const merchant = createMerchantRow();
export function MerchantEditor({ edit }: { edit: boolean }) {
  return edit ? (
    <MerchantEditTemplate
      archiveMerchantAction={save}
      fetchIconAction={fetchMerchantIcon}
      ledgerId="ledger-1"
      merchant={merchant}
      tags={[]}
      updateMerchantAction={saveMerchantDetails}
    />
  ) : (
    <MerchantCreateTemplate
      createMerchantAction={save}
      fetchIconAction={fetchMerchantIcon}
      ledgerId="ledger-1"
      tags={[]}
    />
  );
}
