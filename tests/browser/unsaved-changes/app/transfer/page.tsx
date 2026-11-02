import { EditTransferTransactionTemplate } from "../../../../../src/components/templates/transactions/TransactionFormPage";
import { save } from "../actions";
import { Probe } from "../probe";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Probe>
      <EditTransferTransactionTemplate
        accountOptions={[
          { id: "account-1", currency: "JPY", name: "日元现金" },
          { id: "account-2", currency: "JPY", name: "银行账户" },
        ]}
        action={save}
        canDelete
        deleteAction={save}
        editRestriction={null}
        initialValues={{
          accountId: "account-1",
          transferTargetAccountId: "account-2",
          transferAmount: "5000",
          note: "编辑前转账备注",
          transactionAt: "2026-10-29T03:20:10.000Z",
          transactionRecordId: "00000000-0000-4000-8000-000000009003",
          type: "transfer",
        }}
      />
    </Probe>
  );
}
