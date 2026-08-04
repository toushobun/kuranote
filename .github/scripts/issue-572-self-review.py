from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


Path("src/internal/transaction/util/refundAllocation.ts").write_text(
    r'''export type TransactionRefundAllocation = {
  refundAmount: number;
  refundedItemId: string;
};

export type TransactionRefundAllocationTarget = {
  id: string;
  remainingRefundableAmount: string;
};

const minorUnitScale = BigInt(100);

/**
 * 金额を 0.01 单位の整数に変换する。
 * 浮動小数点演算を経由せず、入力文字列の小数桁を直接解釈する。
 */
export function toRefundMinorUnits(value: number | string): bigint | null {
  const text = String(value).trim();
  const match = text.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const whole = match[1];
  const fraction = (match[2] ?? "").padEnd(2, "0");
  try {
    return BigInt(whole) * minorUnitScale + BigInt(fraction);
  } catch {
    return null;
  }
}

/** 0.01 单位の整数を、末尾の不要な 0 を除いた金额文字列に戻す。 */
export function formatRefundMinorUnits(units: bigint): string {
  const negative = units < BigInt(0);
  const absoluteUnits = negative ? -units : units;
  const whole = absoluteUnits / minorUnitScale;
  const fraction = String(absoluteUnits % minorUnitScale).padStart(2, "0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${
    trimmedFraction ? `.${trimmedFraction}` : ""
  }`;
}

/**
 * 以 0.01 为最小货币单位，按剩余可退金额比例分摊。
 *
 * 先向下取整，再按小数余数从大到小补齐尾差；余数相同时按明细 ID
 * 升序处理，因此同一组输入始终得到相同结果。无法保证每条分摊都大于
 * 0、退款总额超过剩余可退合计或输入不合法时返回 null。
 */
export function allocateRefundAmount(
  totalAmount: number | string,
  targets: TransactionRefundAllocationTarget[],
): TransactionRefundAllocation[] | null {
  const totalUnits = toRefundMinorUnits(totalAmount);
  if (totalUnits === null || totalUnits <= BigInt(0) || targets.length === 0) {
    return null;
  }

  const sortedTargets = [...targets].sort((left, right) =>
    compareStableText(left.id, right.id),
  );
  if (
    new Set(sortedTargets.map((target) => target.id)).size !== targets.length
  ) {
    return null;
  }

  const targetUnits = sortedTargets.map((target) => ({
    id: target.id,
    units: toRefundMinorUnits(target.remainingRefundableAmount),
  }));
  if (
    targetUnits.some(
      (target) => target.units === null || target.units <= BigInt(0),
    )
  ) {
    return null;
  }

  const normalizedTargets = targetUnits as { id: string; units: bigint }[];
  const totalRemainingUnits = normalizedTargets.reduce(
    (sum, target) => sum + target.units,
    BigInt(0),
  );
  if (totalUnits > totalRemainingUnits) return null;

  const provisional = normalizedTargets.map((target) => {
    const numerator = totalUnits * target.units;
    return {
      allocatedUnits: numerator / totalRemainingUnits,
      id: target.id,
      remainder: numerator % totalRemainingUnits,
      remainingUnits: target.units,
    };
  });
  const allocatedBaseUnits = provisional.reduce(
    (sum, target) => sum + target.allocatedUnits,
    BigInt(0),
  );
  let tailUnits = totalUnits - allocatedBaseUnits;
  const tailOrder = [...provisional].sort(
    (left, right) =>
      compareBigInt(right.remainder, left.remainder) ||
      compareStableText(left.id, right.id),
  );

  for (const target of tailOrder) {
    if (tailUnits === BigInt(0)) break;
    target.allocatedUnits += BigInt(1);
    tailUnits -= BigInt(1);
  }

  if (
    tailUnits !== BigInt(0) ||
    provisional.some(
      (target) =>
        target.allocatedUnits <= BigInt(0) ||
        target.allocatedUnits > target.remainingUnits,
    )
  ) {
    return null;
  }

  return provisional
    .sort((left, right) => compareStableText(left.id, right.id))
    .map((target) => ({
      refundAmount: Number(formatRefundMinorUnits(target.allocatedUnits)),
      refundedItemId: target.id,
    }));
}

function compareBigInt(left: bigint, right: bigint) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareStableText(left: string, right: string) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
''',
    encoding="utf-8",
)

replace_once(
    "src/internal/transaction/index.ts",
    '''export {
  allocateRefundAmount,
  type TransactionRefundAllocation,
  type TransactionRefundAllocationTarget,
} from "internal/transaction/util/refundAllocation";
''',
    '''export {
  allocateRefundAmount,
  formatRefundMinorUnits,
  toRefundMinorUnits,
  type TransactionRefundAllocation,
  type TransactionRefundAllocationTarget,
} from "internal/transaction/util/refundAllocation";
''',
)

replace_once(
    "src/internal/transaction/schema.ts",
    '''import type { TransactionRefundAllocation } from "internal/transaction/util/refundAllocation";
''',
    '''import {
  toRefundMinorUnits,
  type TransactionRefundAllocation,
} from "internal/transaction/util/refundAllocation";
''',
)

replace_once(
    "src/internal/transaction/schema.ts",
    '''    if (
      refundAllocations.length > 0 &&
      toMinorUnits(
        refundAllocations.reduce(
          (sum, allocation) => sum + allocation.refundAmount,
          0,
        ),
      ) !== toMinorUnits(amountResult.value)
    ) {
      return invalid(transactionErrorCodes.refundLinkInvalid);
    }
''',
    '''    if (refundAllocations.length > 0) {
      const itemAmountUnits = toRefundMinorUnits(amountResult.value);
      const allocationUnits = refundAllocations.map((allocation) =>
        toRefundMinorUnits(allocation.refundAmount),
      );
      if (
        itemAmountUnits === null ||
        allocationUnits.some((units) => units === null) ||
        (allocationUnits as bigint[]).reduce(
          (sum, units) => sum + units,
          BigInt(0),
        ) !== itemAmountUnits
      ) {
        return invalid(transactionErrorCodes.refundLinkInvalid);
      }
    }
''',
)

replace_once(
    "src/internal/transaction/schema.ts",
    '''      const numericAmount = Number(refundAmount);
      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0 ||
        toMinorUnits(numericAmount) === null
      ) {
        return null;
      }
''',
    '''      const refundAmountUnits = toRefundMinorUnits(refundAmount);
      const numericAmount = Number(refundAmount);
      if (
        refundAmountUnits === null ||
        refundAmountUnits <= BigInt(0) ||
        !Number.isFinite(numericAmount)
      ) {
        return null;
      }
''',
)

replace_once(
    "src/internal/transaction/schema.ts",
    '''function toMinorUnits(value: number) {
  const units = value * 100;
  return Number.isSafeInteger(units) ? units : null;
}

''',
    "",
)

replace_once(
    "src/internal/transaction/service/transactionService.ts",
    '''import { transactionErrorCodes } from "internal/transaction/errors";
''',
    '''import { transactionErrorCodes } from "internal/transaction/errors";
import { toRefundMinorUnits } from "internal/transaction/util/refundAllocation";
''',
)

replace_once(
    "src/internal/transaction/service/transactionService.ts",
    '''        const totalUnits = allocations.reduce(
          (sum, allocation) => sum + Math.round(allocation.refundAmount * 100),
          0,
        );
        if (
          targetIds.size !== allocations.length ||
          allocations.some(
            (allocation) =>
              allocation.refundAmount <= 0 ||
              !Number.isSafeInteger(allocation.refundAmount * 100),
          ) ||
          totalUnits !== Math.round(item.amount * 100)
        ) {
''',
    '''        const allocationUnits = allocations.map((allocation) =>
          toRefundMinorUnits(allocation.refundAmount),
        );
        const itemAmountUnits = toRefundMinorUnits(item.amount);
        if (
          targetIds.size !== allocations.length ||
          itemAmountUnits === null ||
          allocationUnits.some(
            (units) => units === null || units <= BigInt(0),
          ) ||
          (allocationUnits as bigint[]).reduce(
            (sum, units) => sum + units,
            BigInt(0),
          ) !== itemAmountUnits
        ) {
''',
)

replace_once(
    "src/internal/transaction/service/read/transactionFormService.ts",
    '''import {
  fromTransactionSpecialStatusStorageValue,
  resolveTransactionBusinessStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
''',
    '''import {
  fromTransactionSpecialStatusStorageValue,
  resolveTransactionBusinessStatus,
} from "internal/transaction/entity/transactionSpecialStatus";
import {
  formatRefundMinorUnits,
  toRefundMinorUnits,
} from "internal/transaction/util/refundAllocation";
''',
)

replace_once(
    "src/internal/transaction/service/read/transactionFormService.ts",
    '''      const remainingRefundableAmount = Math.max(
        0,
        Number(refundedItem.amount) -
          Number(refundedItem.refundedAmount) +
          Number(refundAmount),
      );
''',
    '''      const originalAmountUnits = toRefundMinorUnits(refundedItem.amount);
      const refundedAmountUnits = toRefundMinorUnits(
        refundedItem.refundedAmount,
      );
      const currentAllocationUnits = toRefundMinorUnits(refundAmount);
      const calculatedRemainingUnits =
        originalAmountUnits !== null &&
        refundedAmountUnits !== null &&
        currentAllocationUnits !== null
          ? originalAmountUnits -
            refundedAmountUnits +
            currentAllocationUnits
          : BigInt(0);
      const remainingRefundableAmount = formatRefundMinorUnits(
        calculatedRemainingUnits > BigInt(0)
          ? calculatedRemainingUnits
          : BigInt(0),
      );
''',
)

replace_once(
    "src/internal/transaction/service/read/transactionFormService.ts",
    '''        remainingRefundableAmount: String(remainingRefundableAmount),
''',
    '''        remainingRefundableAmount,
''',
)

migration_path = "supabase/migrations/20260805010000_support_refund_multi_item_allocation.sql"
replace_once(
    migration_path,
    '''    if jsonb_typeof(v_refund_allocations) is distinct from 'array'
       or jsonb_array_length(v_refund_allocations) > 100 then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;
''',
    '''    if jsonb_typeof(v_refund_allocations) is distinct from 'array' then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;

    if jsonb_array_length(v_refund_allocations) > 100 then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;
''',
)

source_path = Path(
    "supabase/migrations/20260802090000_rework_reimbursement_refund_links.sql"
)
source_sql = source_path.read_text(encoding="utf-8")
function_start = source_sql.index(
    "create or replace function public.update_transaction("
)
function_end = source_sql.index(
    "\ncreate or replace function public.load_transaction_group_summaries_with_special_status(",
    function_start,
)
update_function = source_sql[function_start:function_end]
update_function = update_function.replace(
    "    v_sort_order integer := 0;\n",
    "    v_sort_order integer := 0;\n    v_transaction_item_id uuid;\n",
    1,
)
update_function = update_function.replace(
    '''                  where link.refunded_item_id = ti.id
                     or link.refund_income_item_id = ti.id
''',
    '''                  where link.refunded_item_id = ti.id
''',
    1,
)
update_function = update_function.replace(
    '''    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;
''',
    '''    end loop;

    delete from public.transaction_item_refund_link link
    using public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and link.refund_income_item_id = ti.id;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;
''',
    1,
)
update_function = update_function.replace(
    '''        if coalesce(jsonb_array_length(coalesce(v_item -> 'reimbursementItemIds', '[]'::jsonb)), 0) > 0
           or nullif(v_item ->> 'refundedItemId', '') is not null then
            raise exception 'income_links_create_only'
                using errcode = '22023', detail = 'income_links_create_only';
        end if;
''',
    '''        if coalesce(jsonb_array_length(coalesce(v_item -> 'reimbursementItemIds', '[]'::jsonb)), 0) > 0 then
            raise exception 'income_links_create_only'
                using errcode = '22023', detail = 'income_links_create_only';
        end if;
''',
    1,
)
update_function = update_function.replace(
    '''        ) values (
            p_ledger_id, p_transaction_record_id, p_account_id,
            v_item_category_id, v_item_amount, 0, v_balance_delta, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        );

        perform public.apply_account_balance_delta(
''',
    '''        ) values (
            p_ledger_id, p_transaction_record_id, p_account_id,
            v_item_category_id, v_item_amount, 0, v_balance_delta, null,
            v_sort_order, v_item_special_status, v_user_id, v_user_id
        ) returning id into v_transaction_item_id;

        perform public.apply_transaction_item_links(
            p_ledger_id,
            v_transaction_item_id,
            v_item,
            v_user_id
        );

        perform public.apply_account_balance_delta(
''',
    1,
)
if "or link.refund_income_item_id = ti.id" in update_function:
    raise RuntimeError("refund income edit guard was not removed")
if "perform public.apply_transaction_item_links(" not in update_function:
    raise RuntimeError("update transaction link rebuild was not inserted")
Path(
    "supabase/migrations/20260805020000_support_refund_allocation_edit.sql"
).write_text(
    "-- 允许退款收入在编辑交易时原子删除旧分摊并按新选择重建。\n\n"
    + update_function.lstrip(),
    encoding="utf-8",
)

replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    '''      message: "报销和退款关联只能在新建收入交易时设置。",
''',
    '''      message: "报销关联只能在新建收入交易时设置。",
''',
)
replace_once(
    "src/internal/transaction/repository/transactionRepository.test.ts",
    '''        "报销和退款关联只能在新建收入交易时设置。",
''',
    '''        "报销关联只能在新建收入交易时设置。",
''',
)

replace_once(
    "src/internal/transaction/util/refundAllocation.test.ts",
    '''import { allocateRefundAmount } from "./refundAllocation";
''',
    '''import {
  allocateRefundAmount,
  formatRefundMinorUnits,
  toRefundMinorUnits,
} from "./refundAllocation";
''',
)
replace_once(
    "src/internal/transaction/util/refundAllocation.test.ts",
    '''describe("allocateRefundAmount", () => {
''',
    '''describe("refund amount minor units", () => {
  it("小数金额不经过浮点运算即可精确转换", () => {
    expect(toRefundMinorUnits(0.1)).toBe(BigInt(10));
    expect(toRefundMinorUnits("0.20")).toBe(BigInt(20));
    expect(formatRefundMinorUnits(BigInt(30))).toBe("0.3");
  });
});

describe("allocateRefundAmount", () => {
''',
)

replace_once(
    "src/internal/transaction/schema.test.ts",
    '''    it("商家为空时校验失败", () => {
''',
    '''    it("精确接受 0.1 与 0.2 合计为 0.3 的退款分摊", () => {
      const formData = createFormData({
        itemAmount: "0.3",
        type: "income",
      });
      formData.append(
        "itemRefundAllocations",
        JSON.stringify([
          {
            refundAmount: 0.1,
            refundedItemId: "00000000-0000-4000-8000-000000000201",
          },
          {
            refundAmount: 0.2,
            refundedItemId: "00000000-0000-4000-8000-000000000202",
          },
        ]),
      );

      expect(validateTransactionForm(formData)).toMatchObject({
        ok: true,
        value: {
          items: [
            {
              amount: 0.3,
              refundAllocations: [
                { refundAmount: 0.1 },
                { refundAmount: 0.2 },
              ],
            },
          ],
        },
      });
    });

    it("商家为空时校验失败", () => {
''',
)

replace_once(
    "src/internal/transaction/repository/transactionRepository.test.ts",
    '''  it("普通交易和转账更新映射各自 RPC 参数", async () => {
''',
    '''  it("退款收入更新将多目标分摊数组传给更新 RPC", async () => {
    const { repository, rpc } = createRepository();
    const refundAllocations = [
      {
        refundAmount: 300,
        refundedItemId: "00000000-0000-4000-8000-000000005073",
      },
      {
        refundAmount: 900,
        refundedItemId: "00000000-0000-4000-8000-000000005074",
      },
    ];

    await repository.updateNormal({
      ...normalInput,
      items: [{ ...normalInput.items[0], refundAllocations }],
      transactionRecordId,
      type: "income",
    });

    expect(rpc).toHaveBeenCalledWith(
      "update_transaction",
      expect.objectContaining({
        p_items: [
          expect.objectContaining({
            refundAllocations,
          }),
        ],
      }),
    );
  });

  it("普通交易和转账更新映射各自 RPC 参数", async () => {
''',
)

replace_once(
    "src/internal/transaction/service/transactionService.test.ts",
    '''  it("支出分类允许保存待报销状态", async () => {
''',
    '''  it("0.1 与 0.2 的退款分摊可精确匹配 0.3 收入", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          amount: 0.3,
          refundAllocations: [
            {
              refundAmount: 0.1,
              refundedItemId: "00000000-0000-4000-8000-000000005073",
            },
            {
              refundAmount: 0.2,
              refundedItemId: "00000000-0000-4000-8000-000000005074",
            },
          ],
        },
      ],
      type: "income" as const,
    };

    await service.createNormal(input);

    expect(repository.createNormal).toHaveBeenCalledWith(input);
  });

  it("退款收入编辑允许重新提交多目标分摊", async () => {
    const { repository, service } = createService(
      "member",
      createRepository(),
      "income",
    );
    const input = {
      ...normalInput,
      items: [
        {
          ...normalInput.items[0],
          refundAllocations: [
            {
              refundAmount: 300,
              refundedItemId: "00000000-0000-4000-8000-000000005073",
            },
            {
              refundAmount: 900,
              refundedItemId: "00000000-0000-4000-8000-000000005074",
            },
          ],
        },
      ],
      transactionRecordId,
      type: "income" as const,
    };

    await service.updateNormal(input);

    expect(repository.updateNormal).toHaveBeenCalledWith(input);
  });

  it("支出分类允许保存待报销状态", async () => {
''',
)

replace_once(
    "src/internal/transaction/service/read/transactionFormService.test.ts",
    '''              refundAmount: "1000",
              refundedItem: {
                accountId,
                amount: "3000",
''',
    '''              refundAmount: "0.1",
              refundedItem: {
                accountId,
                amount: "0.3",
''',
)
replace_once(
    "src/internal/transaction/service/read/transactionFormService.test.ts",
    '''                refundedAmount: "1000",
''',
    '''                refundedAmount: "0.2",
''',
)
replace_once(
    "src/internal/transaction/service/read/transactionFormService.test.ts",
    '''                remainingRefundableAmount: "3000",
''',
    '''                remainingRefundableAmount: "0.2",
''',
)

Path("supabase/tests/database/refund_allocation_edit.test.sql").write_text(
    r'''begin;

set local search_path = public, extensions;

select plan(8);

create temporary table test_refund_edit_context as
select
    expense_item.ledger_id,
    expense_item.account_id,
    expense_item.transaction_record_id as expense_record_id,
    expense_category.id as expense_category_id,
    income_category.id as income_category_id,
    expense_item.created_by as user_id
from public.transaction_item expense_item
join public.category expense_category
  on expense_category.id = expense_item.category_id
 and expense_category.ledger_id = expense_item.ledger_id
 and expense_category.type = 'expense'
join public.transaction_record expense_record
  on expense_record.id = expense_item.transaction_record_id
 and expense_record.ledger_id = expense_item.ledger_id
 and expense_record.status = 'active'
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = expense_item.ledger_id
      and category.type = 'income'
      and category.parent_id is not null
      and category.is_archived = false
    limit 1
) income_category on true
limit 1;

update public.ledger
set transaction_item_special_status_enabled = true
where id = (select ledger_id from test_refund_edit_context);

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    values_to_insert.id,
    context.ledger_id,
    context.expense_record_id,
    context.account_id,
    context.expense_category_id,
    values_to_insert.amount,
    0,
    -values_to_insert.amount,
    null,
    5810 + values_to_insert.sort_order,
    context.user_id,
    context.user_id
from test_refund_edit_context context
cross join (values
    ('57241000-0000-4000-8000-000000000001'::uuid, 100::numeric, 1),
    ('57241000-0000-4000-8000-000000000002'::uuid, 300::numeric, 2)
) values_to_insert(id, amount, sort_order);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    '57242000-0000-4000-8000-000000000001',
    ledger_id,
    'normal',
    'active',
    now(),
    null,
    '退款编辑测试',
    null,
    user_id,
    user_id
from test_refund_edit_context;

insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id, category_id, amount,
    discount_amount, balance_delta, note, sort_order, created_by, updated_by
)
select
    '57242000-0000-4000-8000-000000000002',
    ledger_id,
    '57242000-0000-4000-8000-000000000001',
    account_id,
    income_category_id,
    100,
    0,
    100,
    null,
    0,
    user_id,
    user_id
from test_refund_edit_context;

select public.apply_transaction_item_links(
    (select ledger_id from test_refund_edit_context),
    '57242000-0000-4000-8000-000000000002',
    jsonb_build_object(
        'refundAllocations',
        jsonb_build_array(
            jsonb_build_object(
                'refundedItemId', '57241000-0000-4000-8000-000000000001',
                'refundAmount', 25
            ),
            jsonb_build_object(
                'refundedItemId', '57241000-0000-4000-8000-000000000002',
                'refundAmount', 75
            )
        )
    ),
    (select user_id from test_refund_edit_context)
);

select set_config(
    'request.jwt.claim.sub',
    (select user_id::text from test_refund_edit_context),
    true
);
set local role authenticated;

select lives_ok(
    $$
        select public.update_transaction(
            (select ledger_id from test_refund_edit_context),
            '57242000-0000-4000-8000-000000000001',
            'income',
            now(),
            jsonb_build_array(
                jsonb_build_object(
                    'amount', 80,
                    'categoryId', (select income_category_id from test_refund_edit_context),
                    'refundAllocations', jsonb_build_array(
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000001',
                            'refundAmount', 20
                        ),
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000002',
                            'refundAmount', 60
                        )
                    )
                )
            ),
            (select account_id from test_refund_edit_context),
            null,
            '编辑后'
        )
    $$,
    '退款收入编辑时可以原子重建分摊'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    2,
    '编辑后只保留新建的两条退款分摊'
);

select is(
    (
        select string_agg(link.refund_amount::text, ',' order by link.refunded_item_id)
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    '20.00,60.00',
    '编辑后按新金额重新分摊'
);

select is(
    (
        select amount
        from public.transaction_item
        where transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    80::numeric,
    '编辑后的退款收入金额保存成功'
);

select throws_ok(
    $$
        select public.update_transaction(
            (select ledger_id from test_refund_edit_context),
            '57242000-0000-4000-8000-000000000001',
            'income',
            now(),
            jsonb_build_array(
                jsonb_build_object(
                    'amount', 500,
                    'categoryId', (select income_category_id from test_refund_edit_context),
                    'refundAllocations', jsonb_build_array(
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000001',
                            'refundAmount', 125
                        ),
                        jsonb_build_object(
                            'refundedItemId', '57241000-0000-4000-8000-000000000002',
                            'refundAmount', 375
                        )
                    )
                )
            ),
            (select account_id from test_refund_edit_context),
            null,
            '无效编辑'
        )
    $$,
    '22023',
    'refund_amount_exceeded',
    '编辑时超过剩余可退金额会拒绝'
);

select is(
    (
        select income_item.amount::text || '/' ||
               coalesce(string_agg(link.refund_amount::text, ',' order by link.refunded_item_id), '')
        from public.transaction_item income_item
        left join public.transaction_item_refund_link link
          on link.refund_income_item_id = income_item.id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
        group by income_item.amount
    ),
    '80.00/20.00,60.00',
    '无效编辑回滚后保留原金额和原分摊'
);

select lives_ok(
    $$
        select public.update_transaction(
            (select ledger_id from test_refund_edit_context),
            '57242000-0000-4000-8000-000000000001',
            'income',
            now(),
            jsonb_build_array(
                jsonb_build_object(
                    'amount', 80,
                    'categoryId', (select income_category_id from test_refund_edit_context)
                )
            ),
            (select account_id from test_refund_edit_context),
            null,
            '取消退款关联'
        )
    $$,
    '编辑退款收入时可以移除全部分摊'
);

select is(
    (
        select count(*)::integer
        from public.transaction_item_refund_link link
        join public.transaction_item income_item
          on income_item.id = link.refund_income_item_id
        where income_item.transaction_record_id = '57242000-0000-4000-8000-000000000001'
    ),
    0,
    '移除后不再保留退款分摊'
);

select * from finish();
rollback;
''',
    encoding="utf-8",
)

print("Issue #572 self-review fixes prepared")
