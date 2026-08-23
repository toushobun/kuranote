# Issue #574：已关联交易的确认式同步编辑

## 背景

Issue #551 为避免退款 / 报销关系与交易金额不一致，曾冻结已关联交易的编辑。Issue #598 建立退款、报销基础能力，Issue #606 将两者统一为“收入侧单目标”模型，Issue #605 又解除核销上限并引入 `reimbursement_surplus`。在这些规则稳定后，Issue #574 将整体冻结替换为受控、可确认、原子化且具备并发保护的编辑流程。

本文记录 #574 最终落地方案。金额、统计和 Picker 规则继续以 [`issue-605-unlimited-offset-and-surplus.md`](./issue-605-unlimited-offset-and-surplus.md) 为准；退款单目标建模与退款同账户约束继续以 [`issue-606-refund-link-single-target.md`](./issue-606-refund-link-single-target.md) 为准。

## 最终编辑边界

已关联交易可以正常进入编辑页，不再因为存在关联而整体只读。放开编辑不等于取消约束：

- 日期、商家和备注不改变关联语义，可直接保存，不显示同步确认。
- 金额、账户、分类、收支类型或关联对象发生变化时，先由服务端判断是否影响既有关联。
- 仍有关联时不能删除明细或整笔交易，必须先解除关联。
- 已进入报销流程的母项不能取消待报销标记，也不能把派生的 `reimbursed` / `reimbursement_surplus` 当作普通字段任意写入。
- 分类或收支类型变化会破坏“支出作为目标、收入作为返款来源”的语义时，拒绝保存并提示先解除关联。
- 退款收入与目标支出必须保持同账户；报销收入允许切换账户，但新旧账户币种必须一致。

数据库仍保留触发器、RPC 校验和 RLS 防线，不能通过绕过编辑页直接制造不一致数据。

## 确认式同步流程

编辑页通过 `useLinkedTransactionEditAction` 保存当前表单。第一次提交完整进入 Server Action 和 `linkedTransactionEditService`：

1. Server Action 重新解析表单、当前账本和每条持久化明细的 `expectedUpdatedAt`。
2. Service 读取最新编辑视图，对比原值与提交值，并校验关联对象、分类、账户、特殊状态和删除行为。
3. 如果关联相关字段有变化且尚未确认，Service 返回 `linked_sync_confirmation_required` 冲突；此时没有调用写入 RPC。
4. 页面保存一份本次 `FormData` 并显示“同步修改关联数据”弹层。
5. 选择“取消”只关闭弹层并丢弃待确认数据，不会再次提交，也不会产生任何持久化写入。
6. 选择“同步修改”在同一份表单上加入 `confirmSync=true` 后重新提交。第二次服务端校验通过后，调用 `update_linked_transaction_edit` 完成单事务保存。

确认令牌不是绕过校验的授权。第二次提交仍重新读取当前状态并执行全部权限、业务和乐观锁检查。

## 母项与子项编辑规则

### 编辑母项支出

母项的 `transaction_item.amount` 是原始支出 base 金额。修改母项金额时：

- 只更新母项自身金额和真实现金流对应的 `balance_delta`。
- 不修改任何退款或报销子项的金额，也不重分配关联金额。
- 业务净额按 `新 base 金额 - Σ退款关联金额 - Σ报销关联金额` 重新计算。
- 已进入报销流程的母项根据新净额双向推导三态：净额大于 0 为 `pending_reimbursement`，等于 0 为 `reimbursed`，小于 0 为 `reimbursement_surplus`。

因此母项金额可以小于累计核销额，结果会自然进入核销结余，而不是拒绝保存或截断子项。

### 编辑退款或报销收入子项

退款与报销都采用收入侧单目标模型。修改已关联收入金额时：

- 收入明细本体金额更新为提交的新值。
- 对应的 `refund_amount` 或 `reimbursement_amount` 直接更新为收入新金额，不做上限截断。
- 目标支出的业务净额和三态立即重新推导。
- 关联收入自身的业务净额继续被关联金额抵消为 0，避免统计重复计入。

重新选择目标属于先解除或替换单一关联的管理操作；不能在普通编辑提交中悄悄改变既有关联对象。

## 单事务保存与统一锁顺序

`update_linked_transaction_edit` 是一笔交易完整保存的数据库编排入口。它在同一事务内更新交易头字段，并逐条复用 `update_linked_transaction_item` 完成关联明细修改。任意后续校验或明细更新失败时，已经执行的交易头、金额、余额、关联和状态变化全部回滚。

关联编辑、清关联、新建关联和交易类型转换统一遵循以下锁顺序：

```text
ledger → transaction_record（稳定顺序）→ transaction_item / 关联目标（稳定顺序）→ account（UUID 稳定顺序）
```

具体流程只获取自己需要的锁，但不得反转上述顺序。账户切换同时锁定新旧账户；多个记录、明细或账户按稳定 UUID 顺序锁定。这样编辑与新建 / 清除退款报销关联并发时会串行等待，不形成相反锁序造成的 deadlock。

## 乐观锁与冲突语义

编辑视图为每条持久化明细携带 `updated_at`。表单以 `itemExpectedUpdatedAt__<itemId>` 提交，Server Action 将其整理为 `expectedUpdatedAtByItemId`，Service 只为实际变化的关联明细构造更新项。

RPC 获取行锁后比较当前 `updated_at` 与客户端版本：

- 相同则继续原子更新，并触碰新的版本时间。
- 不同则返回稳定的 `transaction_item_version_conflict`。
- Repository 将稳定 RPC code 转换为 `ConflictError`，Server Action 以 inline `{ error, errorKey }` 返回当前页面。

冲突不会静默覆盖先保存客户端的数据；由于比较和全部更新位于同一事务，交易头或其他明细也不会留下部分写入。用户需要刷新编辑页，基于最新数据重新修改。

## 回归覆盖

PR1～PR3 分别建立数据库原子能力、Server Action / Service 保存网关和确认弹层 UI。PR4 在既有分层测试之外补充两类组合验证：

- `src/internal/transaction/linkedTransactionEditFlow.integration.test.tsx` 使用真实编辑模板、确认 hook、Server Action 和 Service，验证母项 / 子项从首次提交、确认到持久化边界的完整路径，以及取消确认零写入。
- `issue_574_pr4_cross_layer_integration.test.sql` 使用最终数据库编排 RPC，连续验证 `pending_reimbursement → reimbursed → reimbursement_surplus` 及编辑 / 解除后的反向回落，母项与子项金额规则、业务净额、退款与报销组合，以及过期版本冲突的整体回滚。

PR1 已有真实多会话测试继续负责证明统一锁序下的等待行为与无 deadlock；#598 / #605 / #606 的数据库和统计回归测试继续固定基础关联、无限核销、单目标与净额统计规则。

## 人工验收边界

自动化测试完成后，Issue 仍需人工验收真实编辑体验，包括确认弹层文案与焦点、取消后的页面状态、刷新后数据、账户 / 分类拒绝提示，以及两个真实客户端并发编辑时的冲突反馈。PR 只使用 `Refs #574` 建立关联，不自动关闭 Issue。
