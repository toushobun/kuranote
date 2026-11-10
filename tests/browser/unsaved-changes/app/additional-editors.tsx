"use client";
import { NewTransferTransactionTemplate } from "../../../../src/components/templates/transactions/TransactionFormPage";
import { AccountCreateTemplate } from "../../../../src/components/templates/accounts/AccountCreate";
import { CategoriesActionStateTemplate } from "../../../../src/components/templates/categories/CategoriesActionState";
import { BalanceAdjustmentEditForm } from "../../../../src/components/organisms/transactions/BalanceAdjustmentEditForm/BalanceAdjustmentEditForm";
import { flowFixture } from "../../../../src/test/mocks/transactionStepFlow";
import { accountHolderOptionsFixture } from "../../../../src/test/mocks/accountHolders";
import { save, saveCategory, reorderCategory } from "./actions";

export function NewTransferEditor() {
  return (
    <NewTransferTransactionTemplate
      accountOptions={flowFixture.accounts}
      action={save}
    />
  );
}
export function NewAccountEditor() {
  return (
    <AccountCreateTemplate
      baseCurrency="JPY"
      holderOptions={accountHolderOptionsFixture}
      ledgerName="验证账本"
      createAccountAction={save}
    />
  );
}
export function CategoryEditor() {
  return (
    <div id="category-page">
      <CategoriesActionStateTemplate
        ledgerName="验证账本"
        parentOptions={[]}
        categories={[
          {
            id: "category-1",
            name: "餐饮",
            icon_name: "🍽️",
            children: [],
            parent_id: null,
            type: "expense",
            sort_order: 0,
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ]}
        createCategoryAction={saveCategory}
        updateCategoryAction={saveCategory}
        archiveCategoryAction={saveCategory}
        reorderCategoryAction={reorderCategory}
      />
    </div>
  );
}
export function BalanceEditor() {
  return (
    <BalanceAdjustmentEditForm
      initialValues={{
        type: "balance_adjustment",
        accountId: "cash",
        accountName: "现金",
        currency: "JPY",
        signedDelta: "-2500",
        transactionRecordId: "balance-1",
        transactionAt: "2026-10-29T03:20:10.000Z",
        note: "盘点",
        accountArchived: false,
      }}
      action={save}
      deleteAction={save}
      canDelete
      editRestriction={null}
    />
  );
}
