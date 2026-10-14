"use client";

import { merchantPresetMessages as messages } from "config/merchantPresetMessages";
import { LoadingState } from "molecules/ui/LoadingState";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type {
  MerchantPresetLoadAction,
  MerchantPresetStateAction,
} from "types/merchants";
import { MerchantPresetDialog } from "../MerchantPresetDialog/MerchantPresetDialog";
import { useMerchantPresetLoader } from "./useMerchantPresetLoader";

type MerchantPresetLauncherProps = {
  action: MerchantPresetStateAction;
  loadAction: MerchantPresetLoadAction;
  onClose: () => void;
};

/** 弹框打开才读取数据；读取失败沿用 Action 失败反馈。 */
export function MerchantPresetLauncher({
  action,
  loadAction,
  onClose,
}: MerchantPresetLauncherProps) {
  const state = useMerchantPresetLoader(loadAction);
  if (state.options)
    return (
      <MerchantPresetDialog
        action={action}
        options={state.options}
        onClose={onClose}
      />
    );
  return (
    <>
      {!state.error ? (
        <WizardDialog
          closeLabel={messages.close}
          title={messages.title}
          onClose={onClose}
          open
        >
          <WizardStepLayout actions={null}>
            <LoadingState description={null} title={messages.loading} />
          </WizardStepLayout>
        </WizardDialog>
      ) : null}
      <ActionFailureFeedback state={state} title={messages.loadFailureTitle} />
    </>
  );
}
