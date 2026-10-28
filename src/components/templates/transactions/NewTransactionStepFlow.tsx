"use client";
import { MerchantPresetLauncher } from "organisms/merchants/MerchantPresetLauncher/MerchantPresetLauncher";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { TransactionStepFlow } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow";
import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import type {
  MerchantPresetLoadAction,
  MerchantPresetStateAction,
  MerchantTag,
} from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
} from "types/transactions";
import { useNewTransactionStepFlow } from "./useNewTransactionStepFlow";

type NewTransactionStepFlowProps = Pick<
  TransactionStepFlowProps,
  "action" | "initialAccountId" | "initialMerchantId" | "initialStep"
> & {
  accountOptions: TransactionAccountOption[];
  addPresetsAction: MerchantPresetStateAction;
  categoryOptions: TransactionCategoryOption[];
  ledgerId: string;
  loadPresetsAction: MerchantPresetLoadAction;
  merchantOptions: FlowMerchant[];
  merchantTags: MerchantTag[];
  multiAccountPaymentEnabled: boolean;
  transactionItemSpecialStatusEnabled: boolean;
};

/** 记账方式「从商家记账」（#943）：页面数据接入分步流程，推荐数据在浏览器端异步读取。 */
export function NewTransactionStepFlow(props: NewTransactionStepFlowProps) {
  const w = useNewTransactionStepFlow(props);
  return (
    <>
      <TransactionStepFlow
        open
        action={props.action}
        accounts={props.accountOptions}
        merchants={props.merchantOptions}
        merchantTags={props.merchantTags}
        frequentMerchants={w.frequentMerchants}
        suggestions={w.suggestions}
        suggestionsMerchantId={w.suggestionsMerchantId}
        itemsOptions={{
          categoryOptions: props.categoryOptions,
          multiAccountPaymentEnabled: props.multiAccountPaymentEnabled,
          prefillAutomaticItems: true,
          transactionItemSpecialStatusEnabled:
            props.transactionItemSpecialStatusEnabled,
        }}
        initialAccountId={props.initialAccountId}
        initialMerchantId={props.initialMerchantId}
        initialStep={props.initialStep}
        {...w.flowHandlers}
      />
      {w.presetsOpen ? (
        <MerchantPresetLauncher
          action={props.addPresetsAction}
          loadAction={props.loadPresetsAction}
          onClose={w.closePresets}
          returnTo={w.presetsReturnTo}
        />
      ) : null}
    </>
  );
}
