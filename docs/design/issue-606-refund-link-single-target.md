# Issue #606：退款关联单目标模型

> [!IMPORTANT]
> 本文档记录 Issue #606 的“收入侧单目标”建模决策。后续 Issue #605 已解除退款 / 报销核销金额封顶，并更新 Picker 候选规则，因此下文“金额规则”中的 `LEAST(收入金额, 剩余可核销余额)` 以及 UI 中“只允许选择剩余可核销金额 > 0 的支出”已经不再是当前规则。当前金额、状态机、统计与 Picker 规则以 [`issue-605-unlimited-offset-and-surplus.md`](./issue-605-unlimited-offset-and-surplus.md) 为准；本文关于收入侧单目标、退款同账户、报销同币种等 #606 建模约束仍然有效。

## 背景

Issue #572 曾将退款关联扩展为多目标模型：一条退款收入明细可以关联多条支出明细，并由 largest-remainder 算法按各目标剩余可核销金额进行比例分摊。

Issue #598 已将报销关联调整为“收入侧单目标”模型。Issue #606 进一步统一两者的建模原则：`transaction_item` 已经是记账中的最小不可拆分明细，因此一条收入明细只关联一个支出目标。若一次退款实际覆盖多笔购买，用户应把退款收入拆成多条收入明细，再让每条收入明细分别关联对应支出。

## 当前模型

退款和报销都采用收入侧单目标语义：

- 一条退款收入明细最多关联一条支出明细。
- 一条报销收入明细最多关联一条待报销支出明细。
- 同一条支出明细仍可以被多条收入明细分批核销。
- 同一条收入明细不能同时作为退款和报销来源。
- 退款保留“收入账户与原支出账户必须一致”的专属校验；报销只要求币种一致。

退款继续使用独立的 `transaction_item_refund_link` 表，报销继续使用 `transaction_item_reimbursement_link` 表。两张表本次不合并，因为退款与报销在目标筛选、账户约束和状态联动上仍有业务差异，合并不会明显减少实现复杂度，反而扩大迁移和回归范围。

退款收入侧通过 `transaction_item_refund_link.refund_income_item_id` 的唯一约束保证单目标语义。一个退款收入明细最多对应一行关联记录；目标侧 `refunded_item_id` 不唯一，因此同一支出仍可接受多笔分批退款。

## 金额规则

Issue #606 只改变目标数量，不改变核销金额规则。退款实际核销金额继续在数据库锁定目标后计算：

```text
actual_offset = LEAST(
  refund_income_amount,
  calculate_transaction_item_remaining_offset_amount(refunded_item_id)
)
```

因此：

- 收入金额小于或等于目标剩余可核销余额时，收入金额全部用于核销。
- 收入金额大于目标剩余可核销余额时，只核销目标剩余额度，超出的收入部分保留为业务净收益。
- `calculate_transaction_item_remaining_offset_amount` 只负责计算一个目标的组合剩余可核销余额，与多目标分摊无关，本次不修改。
- 解除上述封顶不是本 Issue 的范围，继续由 #605 处理。

客户端不再提交 `refundAmount`，也不再计算比例分摊。RPC payload 只提交 `refundedItemId`，实际核销金额由数据库在获取目标行锁之后决定，避免客户端金额与并发下的最新剩余额度不一致。

## UI

`TransactionRefundLinkPicker` 改为单选，交互与 `TransactionReimbursementLinkPicker` 对齐：

- 未关联时选择一条目标明细。
- 已关联时可以重新选择或取消关联。
- 列表仍只允许选择有剩余可核销金额的支出。
- 退款仍要求目标与当前收款账户一致。
- 按月浏览和搜索共用的候选列表使用单个选中 ID 与 Radio，不再保留 Checkbox 或选中 ID 数组等多选语义。
- 单选状态从 Picker 到搜索、月度分组和候选行全链路以 `string | null` 传递，避免下层组件重新暴露多选接口。

两个 Picker 本次保持独立。退款需要同账户校验，而报销的目标集合和提示文案不同；强行合并只会增加条件分支，并不能显著减少代码。

本地 seed 中原先“一条退款收入按比例分摊两个商品”的示例也改为同一交易内两条退款收入子项，分别关联各自的支出目标，并保持原退款总额不变，避免示例数据继续表达已废弃的模型。

## 相关文档同步

- `issue-551-transaction-item-special-status.md` 仅保留历史设计，顶部已明确 #572 的退款多目标方案被本 Issue 取代，避免后续实现重新引用旧模型。
- `docs/security-definer-functions.md` 已将退款新建关联的锁顺序更新为与报销一致的 `ledger → target`，不再描述多目标排序锁定和 `allocatable_amount`。
- `20260818112000_remove_refund_allocation_update_guard.sql` 同步清理 `update_transaction` 最终定义里残留的 `refundAllocations` 前置校验；数据库测试直接检查最终函数定义不得再出现旧协议，并要求保留 `refundedItemId` 单目标校验。结构快照由全部 migrations 重新生成，最终生效 schema 不再包含 `refundAllocations`。

## 被废弃的 #572 多目标能力

以下能力从当前模型中移除：

- `refundAllocations` 数组输入。
- 客户端 `allocateRefundAmount` largest-remainder 比例分摊算法。
- 一条退款收入同时选择多个支出目标的 UI。
- 多目标重复校验、分摊合计校验和尾差分配逻辑。
- 专门验证多目标比例分摊的测试。

历史 migration 保留不改写；最终数据库行为由 Issue #606 新增 migration 覆盖。
