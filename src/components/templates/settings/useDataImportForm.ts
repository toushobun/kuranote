"use client";

import { useActionState, useState, type ChangeEvent } from "react";

import type {
  DataImportActionState,
  DataImportStateAction,
} from "types/dataImport";

const initialState: DataImportActionState = {};

export function useDataImportForm(checkFormatAction: DataImportStateAction) {
  const [state, formAction, isPending] = useActionState(
    checkFormatAction,
    initialState,
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFileName(file ? file.name : null);
  }

  return {
    formAction,
    handleFileChange,
    isPending,
    selectedFileName,
    state,
  };
}
