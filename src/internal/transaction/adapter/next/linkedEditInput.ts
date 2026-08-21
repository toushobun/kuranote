export type LinkedEditActionInput = {
  confirmSync: boolean;
  expectedUpdatedAtByItemId: Readonly<Record<string, string>>;
};

const offsetDateTimePattern = /(?:Z|[+-]\d{2}:\d{2})$/;

export function parseLinkedEditActionInput(
  formData: FormData,
  itemIds: Array<string | undefined>,
): LinkedEditActionInput | null {
  const confirmSyncText = String(formData.get("confirmSync") ?? "").trim();
  if (confirmSyncText !== "" && confirmSyncText !== "true") return null;

  const expectedValues = formData.getAll("itemExpectedUpdatedAt");
  if (expectedValues.length !== 0 && expectedValues.length !== itemIds.length) {
    return null;
  }

  const expectedUpdatedAtByItemId: Record<string, string> = {};
  if (expectedValues.length > 0) {
    for (const [index, rawValue] of expectedValues.entries()) {
      const value = String(rawValue).trim();
      if (!value) continue;
      const itemId = itemIds[index];
      if (
        !itemId ||
        !offsetDateTimePattern.test(value) ||
        !Number.isFinite(Date.parse(value))
      ) {
        return null;
      }
      expectedUpdatedAtByItemId[itemId] = value;
    }
  }

  return {
    confirmSync: confirmSyncText === "true",
    expectedUpdatedAtByItemId,
  };
}
