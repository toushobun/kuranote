"use client";
import { useCallback, useState } from "react";
import {
  BackLayerScope,
  transactionBackLayerLevels,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { WizardDialogSwitch } from "molecules/ui/WizardDialog/WizardDialogSwitch";
import { MerchantPresetLauncher } from "organisms/merchants/MerchantPresetLauncher/MerchantPresetLauncher";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { TransactionStepFlow } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow";
import { TransferReceiptFlow } from "organisms/transactions/TransferReceiptFlow/TransferReceiptFlow";
import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import type {
  MerchantPresetLoadAction,
  MerchantPresetStateAction,
  MerchantTag,
} from "types/merchants";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionEntryMethod,
} from "types/transactions";
import { useNewTransactionStepFlow } from "./useNewTransactionStepFlow";

type NewTransactionStepFlowProps = Pick<
  TransactionStepFlowProps,
  "action" | "frequentMerchants"
> & {
  accountOptions: TransactionAccountOption[];
  addPresetsAction: MerchantPresetStateAction;
  categoryOptions: TransactionCategoryOption[];
  /** 打开记一笔时的方式（由 URL 决定）；之后在浏览器端切换。 */
  initialMethod?: TransactionEntryMethod;
  ledgerId: string;
  loadPresetsAction: MerchantPresetLoadAction;
  merchantOptions: FlowMerchant[];
  merchantTags: MerchantTag[];
  multiAccountPaymentEnabled: boolean;
  transactionItemSpecialStatusEnabled: boolean;
};

/**
 * 记一笔（#943）：「从商家记账」接入页面数据（含常用商家），选商家后的建议在浏览器端异步读取；
 * 「账户周转」是同一外框的转账小票，两种方式在浏览器端切换（#1050），
 * 标题栏不动、内容按「切换记账方式」抽屉里的顺序左右滑动（#1055）。
 */
export function NewTransactionStepFlow(props: NewTransactionStepFlowProps) {
  const w = useNewTransactionStepFlow({
    initialMethod: props.initialMethod ?? "merchant",
    ledgerId: props.ledgerId,
  });
  const [merchantTouched, setMerchantTouched] = useState(false);
  const [transferTouched, setTransferTouched] = useState(false);
  const touchMerchant = useCallback(() => setMerchantTouched(true), []);
  const touchTransfer = useCallback(() => setTransferTouched(true), []);
  function renderMethod(method: string) {
    if (method === "transfer") {
      return (
        <TransferReceiptFlow
          draft={{ otherTouched: merchantTouched, onTouched: touchTransfer }}
          accounts={props.accountOptions}
          action={props.action}
          onClose={w.onClose}
          onMethodChange={w.onMethodChange}
        />
      );
    }
    return (
      <TransactionStepFlow
        draft={{ otherTouched: transferTouched, onTouched: touchMerchant }}
        open
        merchantPickerSuspended={w.presetsOpen}
        action={props.action}
        accounts={props.accountOptions}
        merchants={props.merchantOptions}
        merchantTags={props.merchantTags}
        frequentMerchants={props.frequentMerchants}
        suggestions={w.suggestions}
        suggestionsMerchantId={w.suggestionsMerchantId}
        itemsOptions={{
          categoryOptions: props.categoryOptions,
          multiAccountPaymentEnabled: props.multiAccountPaymentEnabled,
          transactionItemSpecialStatusEnabled:
            props.transactionItemSpecialStatusEnabled,
        }}
        onClose={w.onClose}
        onMethodChange={w.onMethodChange}
        {...w.flowHandlers}
      />
    );
  }
  return (
    <>
      <WizardDialogSwitch
        keepMounted
        activeKey={w.method}
        order={entryMethodOrder}
        renderPane={renderMethod}
      />
      {w.presetsOpen ? (
        <BackLayerScope level={transactionBackLayerLevels.creation}>
          <MerchantPresetLauncher
            action={props.addPresetsAction}
            loadAction={props.loadPresetsAction}
            onClose={w.closePresets}
            onSaved={w.onPresetsAdded}
          />
        </BackLayerScope>
      ) : null}
    </>
  );
}

const entryMethodOrder = m.methods.map((method) => method.id);
