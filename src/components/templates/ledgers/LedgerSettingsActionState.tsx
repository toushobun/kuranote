"use client";

import { useActionState, type ComponentProps } from "react";

import type {
  LedgerSettingsActionState,
  LedgerSettingsStateAction,
} from "types/ledgers";

import { LedgerSettingsTemplate } from "./LedgerSettings";

const initialLedgerSettingsActionState: LedgerSettingsActionState = {};

type LedgerSettingsActionStateTemplateProps = Omit<
  ComponentProps<typeof LedgerSettingsTemplate>,
  "errorKey" | "errorMessage" | "updateLedgerSettingsAction"
> & {
  updateLedgerSettingsAction: LedgerSettingsStateAction;
};

export function LedgerSettingsActionStateTemplate({
  updateLedgerSettingsAction,
  ...templateProps
}: LedgerSettingsActionStateTemplateProps) {
  const [actionState, formAction] = useActionState(
    updateLedgerSettingsAction,
    initialLedgerSettingsActionState,
  );

  return (
    <LedgerSettingsTemplate
      {...templateProps}
      errorKey={actionState.errorKey ?? null}
      errorMessage={actionState.error ?? null}
      updateLedgerSettingsAction={formAction}
    />
  );
}
