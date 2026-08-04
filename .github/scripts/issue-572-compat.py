from pathlib import Path
import re


def patch(path: str, transform) -> None:
    target = Path(path)
    target.write_text(transform(target.read_text(encoding="utf-8")), encoding="utf-8")


patch(
    "src/internal/transaction/util/refundAllocation.ts",
    lambda text: re.sub(r"(?<![A-Za-z0-9_])(\d+)n", r"BigInt(\1)", text),
)

patch(
    "src/components/organisms/transactions/TransactionForm/useTransactionForm.ts",
    lambda text: text.replace(
        "item.refundCandidates ?? null",
        "item.refundCandidates ?? []",
    ),
)


def update_hook_test(text: str) -> str:
    text = text.replace("setPickerRefundCandidate", "setPickerRefundCandidates")
    text = text.replace("pickerRefundCandidate", "pickerRefundCandidates")
    text = text.replace(
        "setPickerRefundCandidates(refundCandidate)",
        "setPickerRefundCandidates([refundCandidate])",
    )
    text = re.sub(
        r'''result\.current\.setPickerRefundCandidates\(\{\s+
        \.\.\.refundCandidate,\s+
        accountId:\s*"account-2",\s+
        \}\)''',
        '''result.current.setPickerRefundCandidates([
          {
            ...refundCandidate,
            accountId: "account-2",
          },
        ])''',
        text,
        flags=re.VERBOSE,
    )
    text = text.replace(
        "expect(result.current.pickerRefundCandidates).toEqual(refundCandidate);",
        "expect(result.current.pickerRefundCandidates).toEqual([refundCandidate]);",
    )
    text = text.replace(
        "expect(result.current.pickerRefundCandidates).toBeNull();",
        "expect(result.current.pickerRefundCandidates).toEqual([]);",
    )
    return text


patch(
    "src/components/organisms/transactions/TransactionForm/useTransactionForm.test.ts",
    update_hook_test,
)


def update_picker(text: str) -> str:
    text = text.replace(
        'import { useMemo, useState } from "react";',
        'import { useState } from "react";',
    )
    text = text.replace("  refundAmount: string;", "  refundAmount?: string;")
    text = text.replace(
        "  value: TransactionRefundCandidate[];",
        "  value?: TransactionRefundCandidate[] | null;",
    )
    text = text.replace("  refundAmount,\n", '  refundAmount = "0",\n')
    text = text.replace(
        "}: TransactionRefundLinkPickerProps) {\n",
        "}: TransactionRefundLinkPickerProps) {\n  const selectedValue = value ?? [];\n",
    )
    text = re.sub(
        r"  const allocations = useMemo\(\n    \(\) => allocateRefundAmount\(refundAmount, value\),\n    \[refundAmount, value\],\n  \);",
        "  const allocations = allocateRefundAmount(refundAmount, selectedValue);",
        text,
    )
    text = text.replace("setDraftValue(value);", "setDraftValue(selectedValue);")
    text = text.replace("value.length", "selectedValue.length")
    text = text.replace("value.map", "selectedValue.map")
    return text


patch(
    "src/components/organisms/transactions/TransactionRefundLinkPicker/TransactionRefundLinkPicker.tsx",
    update_picker,
)


def update_service_test(text: str) -> str:
    return text.replace(
        'refundedItemId: "00000000-0000-4000-8000-000000005073",',
        '''refundAllocations: [
          {
            refundAmount: 1200,
            refundedItemId: "00000000-0000-4000-8000-000000005073",
          },
        ],''',
    )


patch(
    "src/internal/transaction/service/transactionService.test.ts",
    update_service_test,
)

exec(
    Path(".github/scripts/issue-572-test-compat.py").read_text(encoding="utf-8"),
    {"__name__": "__main__"},
)

print("Issue #572 compatibility transformations completed")
