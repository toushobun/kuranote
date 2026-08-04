from pathlib import Path


def patch(path: str, old: str, new: str, expected: int | None = None) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count == 0:
        raise RuntimeError(f"{path}: pattern not found: {old[:100]!r}")
    if expected is not None and count != expected:
        raise RuntimeError(
            f"{path}: expected {expected} matches, found {count}: {old[:100]!r}"
        )
    target.write_text(text.replace(old, new), encoding="utf-8")


patch(
    "src/internal/transaction/schema.test.ts",
    '    formData.append("itemRefundedItemId", refundTargetId);',
    '''    formData.append(
      "itemRefundAllocations",
      JSON.stringify([
        {
          refundAmount: 0,
          refundedItemId: refundTargetId,
        },
      ]),
    );''',
    expected=1,
)

patch(
    "src/internal/transaction/repository/transactionRepository.test.ts",
    "          refundedItemId: null,",
    "          refundAllocations: [],",
    expected=2,
)
patch(
    "src/internal/transaction/repository/transactionRepository.test.ts",
    'transaction_item_refund_link_income_unique',
    'transaction_item_refund_link_income_target_unique',
    expected=1,
)
patch(
    "src/internal/transaction/repository/transactionRepository.test.ts",
    'message: "该收入明细已经关联过一笔退款，请刷新后重试。",',
    'message: "同一退款收入不能重复关联同一支出明细，请刷新后重试。",',
    expected=1,
)

picker_test_path = Path(
    "src/components/organisms/transactions/TransactionRefundLinkPicker/TransactionRefundLinkPicker.test.tsx"
)
picker_test = picker_test_path.read_text(encoding="utf-8")
picker_test = picker_test.replace(
    "        onChange={onChange}\n        value={null}",
    '        onChange={onChange}\n        refundAmount="1000"\n        value={null}',
)
old_picker_assertion = '''    fireEvent.click(screen.getByRole("button", { name: "选择退款明细 午餐" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "refund-item-1",
        remainingRefundableAmount: "1000",
      }),
    );'''
new_picker_assertion = '''    fireEvent.click(screen.getByRole("button", { name: "选择退款明细 午餐" }));
    fireEvent.click(screen.getByRole("button", { name: "完成（1）" }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "refund-item-1",
        remainingRefundableAmount: "1000",
      }),
    ]);'''
if old_picker_assertion not in picker_test:
    raise RuntimeError("picker assertion pattern not found")
picker_test_path.write_text(
    picker_test.replace(old_picker_assertion, new_picker_assertion, 1),
    encoding="utf-8",
)

patch(
    "src/internal/transaction/service/read/transactionFormService.test.ts",
    '''          refundedItem: {
            accountId,
            amount: "3000",
            categoryId,
            id: linkedExpenseItemId,
            refundedAmount: "1000",
            transactionAt: "2026-08-01T01:00:00.000Z",
            transactionRecordId: "00000000-0000-4000-8000-000000009998",
          },
          reimbursementItems: [],''',
    '''          refundAllocations: [
            {
              refundAmount: "1000",
              refundedItem: {
                accountId,
                amount: "3000",
                categoryId,
                id: linkedExpenseItemId,
                refundedAmount: "1000",
                transactionAt: "2026-08-01T01:00:00.000Z",
                transactionRecordId: "00000000-0000-4000-8000-000000009998",
              },
            },
          ],
          reimbursementItems: [],''',
    expected=1,
)
patch(
    "src/internal/transaction/service/read/transactionFormService.test.ts",
    '''            businessStatus: "refund",
            refundedItemId: linkedExpenseItemId,
            refundCandidate: {
              id: linkedExpenseItemId,
              remainingRefundableAmount: "3000",
            },''',
    '''            businessStatus: "refund",
            refundCandidates: [
              {
                id: linkedExpenseItemId,
                remainingRefundableAmount: "3000",
              },
            ],''',
    expected=1,
)

print("Issue #572 test compatibility transformations completed")
