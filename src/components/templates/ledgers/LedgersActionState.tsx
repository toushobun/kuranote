"use client";

import { useActionState, type ComponentProps } from "react";

import type {
  CurrentLedgerActionState,
  CurrentLedgerStateAction,
} from "types/ledgers";

import { LedgersTemplate } from "./Ledgers";

const initialCurrentLedgerActionState: CurrentLedgerActionState = {};

type LedgersActionStateTemplateProps = Omit<
  ComponentProps<typeof LedgersTemplate>,
  "errorKey" | "errorMessage" | "updateCurrentLedgerAction"
> & {
  updateCurrentLedgerAction: CurrentLedgerStateAction;
};

export function LedgersActionStateTemplate({
  updateCurrentLedgerAction,
  ...templateProps
}: LedgersActionStateTemplateProps) {
  const [actionState, formAction] = useActionState(
    updateCurrentLedgerAction,
    initialCurrentLedgerActionState,
  );

  return (
    <LedgersTemplate
      {...templateProps}
      errorKey={actionState.errorKey ?? null}
      errorMessage={actionState.error ?? null}
      updateCurrentLedgerAction={formAction}
    />
  );
}
