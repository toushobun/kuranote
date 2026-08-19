# Issue #605：核销无上限与净额转正

## 背景

Issue #598 建立了报销 / 退款关联的基础模型，但关联金额受目标支出“剩余可核销余额”封顶：累计核销达到原始支出金额后，后续收入不能再继续关联到同一目标。

Issue #606 将退款关联收敛为与报销一致的“收入侧单目标”模型：一条退款或报销收入明细最多关联一条支出目标，同一支出目标仍可接受多笔收入分批核销。Issue #605 在这个模型上进一步解除金额封顶，使累计退款 / 报销金额可以超过原始支出，并让核销超过原始支出后的结余转入收入统计。

## 当前金额模型

退款和报销都不再按目标剩余额度截断，建立关联时直接使用收入明细自身金额作为核销金额。一个目标可以持续接受多笔关联，即使已经结清或已经进入核销结余状态也不例外。

`calculate_transaction_item_remaining_offset_amount` 保留原函数名，但语义已经从“不能小于 0 的剩余额度”改为**可正可负的核销状态判定值**：

```text
remaining_offset_amount
  = 目标支出原始金额
  - Σ有效退款关联金额
  - Σ有效报销关联金额
```

符号约定以当前 migration 实现为准：

- `> 0`：仍有未核销金额。
- `= 0`：刚好结清。
- `< 0`：累计核销超过原始支出，已经产生核销结余（倒赚）。

因此该函数不再承担 Picker 或数据库写入的“额度上限”职责，调用方不得再用 `GREATEST(..., 0)`、`LEAST(收入金额, 剩余额度)` 等方式把负值截断。

## `special_status` 三态状态机

进入报销流程的支出使用三种状态：

- `remaining_offset_amount > 0`：`pending_reimbursement`，仍有未核销金额。
- `remaining_offset_amount = 0`：`reimbursed`，恰好结清。
- `remaining_offset_amount < 0`：`reimbursement_surplus`，核销超过原始支出金额。

状态由数据库在关联新增、删除或受控重建后重新派生。`reimbursement_surplus` 与 `reimbursed` 一样属于受控状态，不能由普通客户端写入任意切换。

只有退款关联、且 `special_status IS NULL` 的普通支出不会自动进入报销状态机；无论退款金额是否超过原始支出，它都保持 `NULL`。如果这类支出之后被用户标记为待报销，数据库会根据当时已经存在的全部有效退款 / 报销金额直接派生正确状态，可能立即进入 `reimbursed` 或 `reimbursement_surplus`。

## 业务净额与统计口径

`transaction_item_with_refund.business_net_amount` 使用有符号净额：

```text
business_net_amount
  = transaction_item.amount
  - Σ该明细参与的有效退款金额
  - Σ该明细参与的有效报销金额
```

对作为核销目标的支出来说：

- `business_net_amount > 0`：仍是实际支出，按该金额计入支出。
- `business_net_amount = 0`：完全抵消，不计入收入或支出。
- `business_net_amount < 0`：支出已经倒赚，统计时按其绝对值计入收入，不再计入支出。

Dashboard / 月度汇总 / 分类汇总都遵循这一口径。`buildStatisticsViewData` 只有在“支出分类 + 存在退款或报销关联 + `business_net_amount < 0`”时才把该母项切换到收入桶，并从支出排行中排除。

**关联收入本身的规则没有变化。** 退款 / 报销收入明细在建立关联后，其 `business_net_amount` 被对应核销金额抵消为 `0`，不会再作为普通收入重复计入统计。统计中的正向金额只来自母项支出转正后的净额，避免同一笔退款 / 报销被计算两次。

## Picker 候选规则

解除封顶后，Picker 不再使用“剩余可核销金额必须大于 0”作为可选条件：

- **退款 Picker**：保持 #606 的目标范围，只要求候选是支出；普通 `special_status = NULL` 支出仍可选择，已结清或已转正也不因净额被禁用。
- **报销 Picker**：候选必须处于报销流程中，即状态属于 `pending_reimbursement`、`reimbursed`、`reimbursement_surplus`。已经结清或已经倒赚的支出仍可继续追加新的报销关联。
- 候选数据继续透出有符号的剩余核销值，UI 不再因为该值为 `0` 或负数而禁用选择。

这使“先部分报销、再退款推正、之后继续追加报销 / 退款”的链路在 Picker 和数据库层保持一致，不会出现前端能选但数据库拒绝，或数据库允许但 Picker 隐藏目标的分叉。

## 展示层

`TransactionBusinessBadge` 对 `reimbursement_surplus` 使用独立的 `reimbursementSurplus` badge kind，标签为“已倒赚”。展示时仍保留退款核销金额和报销核销金额，用户可以同时看到最终状态以及净额由哪些关联组成。

`reimbursed` 继续表示恰好结清；当退款和报销共同完成结清时，展示层可以根据两种核销来源显示“已结清”。`reimbursement_surplus` 优先表达最终已经转正的业务结果，不能退化成普通“已报销”或“已结清”。

## 回归与组合路径

PR1～PR4 已分别覆盖金额解除封顶、三态状态机、统计分桶、Picker 候选和 Badge。PR5 额外补充跨 PR 组合路径，重点验证同一目标上的连续状态变化：

1. 支出先被报销部分核销，仍为 `pending_reimbursement`。
2. 再叠加退款后累计核销超过原始金额，转为 `reimbursement_surplus`，`business_net_amount` 变为负值并切到收入统计。
3. 进入核销结余后仍能继续追加新的关联，Picker 仍保留该目标。
4. 参与关联的退款 / 报销收入自身业务净额保持为 `0`，不会重复计入收入。

## 与旧设计文档的关系

- `issue-551-transaction-item-special-status.md` 保留 Issue #551 当时的历史设计，不作为当前金额规则的实现依据。
- `issue-606-refund-link-single-target.md` 的“收入侧单目标”建模仍然有效，但其中“核销金额继续受剩余额度封顶”的说明已经被 Issue #605 取代。
- 当前实现应以 Issue #605、最新 migrations、schema snapshot 和本说明为准；#574 后续处理已关联退款 / 报销明细的编辑能力时，也应基于这里的有符号净额和三态状态机重新核对旧 TODO。
