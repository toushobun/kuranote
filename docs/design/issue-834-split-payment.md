# Issue #834：单笔消费由多个账户共同支付（付款明细）设计

## 背景与范围

本文是 [#834](https://github.com/toushobun/kuranote/issues/834) 的设计文档。本文设计已于 2026-10-15 经维护者确认，作为 #834 各子 Issue 的实现依据；实现中发现与本文冲突时，先更新本文再改代码。产品决策来源为 Issue 正文、2026-10-14 的「仕様确认记录」评论，以及 2026-10-15 的 review 结论（见第 5 节「已决事项记录」）。

前置 Issue [#899](https://github.com/toushobun/kuranote/issues/899) 已合并：退款关联不再要求同账户，与报销一样只要求币种一致。#574 / #605 / #606 的现行规则分别见 [`issue-574-linked-transaction-edit.md`](./issue-574-linked-transaction-edit.md)、[`issue-605-unlimited-offset-and-surplus.md`](./issue-605-unlimited-offset-and-surplus.md) 和 [`issue-606-refund-link-single-target.md`](./issue-606-refund-link-single-target.md)。

示例（与 Issue 评论相同）：在妇产科医院支付治疗费 4 万、住院费 8 万，合计 12 万；「我的账户」出 5 万，「妻子账户」出 7 万。

## 已核对的现状

核对基线为 `main` 的 `d210201`。数据库以 `supabase/schema_snapshot/current_schema.sql` 的最终定义为准。

| 位置                                                                                                                        | 当前行为                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transaction_item`                                                                                                          | 每条明细都有 `account_id NOT NULL` 和 `balance_delta NOT NULL DEFAULT 0`。普通记录、转账、余额调整共用这两列：普通记录每条明细写同一个账户，`balance_delta` 为 ±金额；转账两条明细（转出 / 转入）；余额调整一条明细。`transaction_record` 本身没有账户列。     |
| `create_transaction` / `update_transaction`（含 `_locked_impl`）                                                            | 入参只有一个 `p_account_id`，循环写明细时每条都调用一次 `apply_account_balance_delta`。更新时先按明细逐条回滚旧余额，再逐条应用新余额。两者都没有显式按 UUID 锁账户，账户行锁由 `apply_account_balance_delta` 的 `UPDATE` 按调用顺序隐式取得。                 |
| `convert_transaction_type_locked_impl`                                                                                      | 先按 UUID 顺序 `FOR UPDATE` 锁住新旧账户，再删除全部明细并按新类型重建。`convert_transaction_type_with_special_status` 在转换之后会对非转账目标再调用一次 `update_transaction`。                                                                               |
| `void_transaction_locked_impl`                                                                                              | 按 UUID 顺序锁住明细涉及的账户，再逐条明细回滚 `balance_delta`，最后把记录标记为 `deleted`；明细行保留。                                                                                                                                                       |
| `update_linked_transaction_edit` → `update_linked_transaction_item`（含 `_locked_impl`）                                    | #574 的受控编辑。每条明细提交 `accountId`，按 ledger → record → item / 关联目标 → account（UUID）的顺序加锁。切换账户时回滚旧账户、应用新账户；账户不变时只应用差额。旧账户已归档时拒绝。                                                                      |
| `apply_transaction_item_links`、`validate_transaction_item_reimbursement_link`、`validate_linked_transaction_item_mutation` | 退款 / 报销的币种校验都经 `transaction_item.account_id → account.currency` 取得币种，比较收入明细和目标支出明细。                                                                                                                                              |
| `apply_account_balance_delta`                                                                                               | 只能更新未归档账户，归档账户直接报错。所以现有记录只要用过已归档账户，就无法编辑或删除。                                                                                                                                                                       |
| `load_transaction_group_summaries_with_special_status`                                                                      | 交易列表的非时间维度分组实际调用的是这个函数（`transactionRepository.loadGroupSummaries`）。它按**明细**过滤：账户、分类、特殊状态都作用在 `matched_items` 上，金额只累计命中的明细，按账户分组时取 `transaction_item.account_id` 和 `business_net_amount`。   |
| `load_transaction_group_summaries`（基础版）                                                                                | 按**记录**过滤（`exists`），金额按分组维度计算，按账户分组时取明细 `amount`。应用代码已不再调用它，只有 `src/internal/dbMigrations/*` 的 migration 文本测试还引用。                                                                                            |
| `src/internal/transaction/util/grouping/*`、`transactionGroupBuilder.ts`、`groupLoaders.ts`                                 | 时间维度分组和组内明细在 TS 端计算。`filterItems` 同样按明细过滤（`item.account_id !== filters.accountId` 时剔除），`recordMatchesGroup` 和 `addItemGroups` 按 `item.account_id` 判断账户分组。                                                                |
| `buildTransactionListItem.ts`                                                                                               | 普通记录的列表账户取第一条明细的 `account_id`。`categoryItems[].accountId` 供退款 / 报销 Picker 使用（`TransactionGroupList.tsx`）。                                                                                                                           |
| `transactionFormService.ts`、`transactionService.ts`                                                                        | 编辑视图的 `initialValues.accountId` 取第一条明细的账户。任一明细账户已归档时，`editRestriction = "archivedAccount"`，整笔只读。保存前，`requireActiveTransactionAccounts` 要求新旧账户都未归档。                                                              |
| 导出（`transactionExportQueryService.ts` → `dataExportWorkbook.ts`）                                                        | 导出没有专用 RPC，经 Repository 的 `listRecords` / `listItems` 读取。「收支」sheet 一条明细一行，每行写该明细的账户四列（账户、币种、持有人、类型）。导入按 sheet 名识别「收支 / 转账 / 余额变更」，无法识别的 sheet 会被忽略（`validateImportWorkbook.ts`）。 |
| `useTransactionForm.ts`                                                                                                     | 表单只有一个 `selectedAccountId`。同一笔记录可以同时有支出明细和收入明细，余额按净额变化。退款 / 报销候选的币种校验使用所选账户的币种。                                                                                                                        |
| `update_account_with_holders`                                                                                               | 有交易的账户也可以改币种。这是现有缺口（转账、退款关联同样受影响），不是本 Issue 新引入的问题。处理方式见 3.2 末尾和第 6 节（另开 Issue，作为子 Issue 4 的前置条件）。                                                                                         |

## 1. 已确定的产品规则

以下照录，不做改动。

- 一笔记账记录（transaction_record）可以由一个或多个账户共同支付。新增「付款明细」：每行是账户 + 金额，挂在交易本体上，余额只由付款明细决定。
- 付款明细与分类明细是「总分」关系：多个账户合计出资，共同支付整笔记录，不对应某一条分类明细。
- 只支持「全部是支出明细」的记录。纯收入、含收入明细的记录、转账不支持多账户（转账暂不支持）。
- 同一笔记录的付款账户必须同币种，不处理汇率。
- 校验：每个付款金额 ≥ 0（允许 0，金额为 0 的行保留，不自动删除）；同一账户不能出现两次；付款金额合计必须等于支出明细金额合计；已归档账户不能新选，历史记录中已有的照常显示。
- 单账户仍是最常见的场景，UI 默认和现在一样；只有用户点「添加付款账户」时才展开多账户 UI。删到只剩一个账户时自动回到单账户状态。
- 新增的付款账户行金额默认留空，不自动计算差额；通过「付款合计 / 明细合计」对账条提示差额，不平衡时不能保存。
- 交易列表中，多账户记录的账户位置显示「现金（我）等 2 个账户」（方案 B），第一个账户按录入顺序；不加展开箭头，点击后和其他记录一样进入编辑页。
- 不新增交易详情页。付款明细在编辑页中显示和编辑。
- 退款 / 报销：#899 之后只要求币种一致、不看账户；多账户记录的付款账户都是同币种，所以退款 / 报销规则不需要额外处理，退款可以进入任意同币种账户。
- 导出：每笔记录加入付款明细列表（账户 + 金额）。导入（读取外部 xlsx）不在本 Issue 范围内。
- 折扣、积分抵扣不在本 Issue 范围内（#835）。
- 现有数据：尚未正式投入使用，不需要考虑历史数据的兼容和回填（如果 migration 需要处理 seed 或测试数据，写明方案）。

## 2. 统计口径

### 2.1 已确定规则（方案 D，2026-10-15 维护者确认）

最初的表述是「沿用 load_transaction_group_summaries 现有的规则：筛选条件只决定哪些记录出现，金额按分组维度计算」。核对后发现，列表实际使用的分组函数是**明细级过滤**（见 2.2），因此维护者改为采用方案 D：

> 沿用列表现有的「明细级过滤」思路：筛选条件把不相关的部分剔除，只计命中的部分。筛选账户时，「命中的部分」就是该账户的付款份额。

以医院 12 万为例（治疗费 4 万 + 住院费 8 万；我 5 万、妻子 7 万）：

| 筛选     | 分组维度                             | 结果                                                                             |
| -------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| 无       | 月 / 商家 / 成员等记录级维度         | 12 万（整笔，不变）                                                              |
| 无       | 分类 / 大分类                        | 住院费 8 万、治疗费 4 万，各计一次（不变）                                       |
| 无       | 账户                                 | 我 5 万、妻子 7 万（付款明细的实际金额）                                         |
| 我的账户 | 月 / 商家 / 成员等记录级维度         | 5 万（我的付款份额）                                                             |
| 我的账户 | 分类 / 大分类 / 特殊状态等明细级维度 | 住院费 8 万、治疗费 4 万（明细全额，不分摊、不重复），并标识为「共同支付」的记录 |
| 我的账户 | 账户                                 | 只显示「我的账户」组，5 万                                                       |

其余规则：

- **单账户记录**在任何筛选和分组下，显示结果与现状完全一致，包括已退款记录在明细级维度下的业务净额口径。唯一的例外是「按账户分组」：改为付款明细的实际收付金额（单账户的退款 / 报销收入侧同样取实际收款金额）。
- **筛选账户的条件**改为「付款明细中包含该账户」（转账 / 余额调整仍看明细账户）。
- 带退款 / 报销核销的视图（`_with_special_status`）按账户分组时，用付款明细的实际付款金额，不分摊业务净额。
- 统计页（/statistics）的分类、商家排行不受影响。
- **已知并接受的结果：** 筛选某账户后，多账户记录在「按月」等记录级维度下计入该账户的份额，而在「按分类」等明细级维度下计入明细全额。所以同一筛选条件下，各分类合计与按月合计可能不一致（例：筛选我的账户，按月 5 万，按分类合计 12 万）。明细级维度通过「共同支付」标识说明差异来源（2.4）。
- **由方案 D 推导的组合规则：** 账户筛选与分类 / 大分类 / 特殊状态 / 「可退款支出」等明细级筛选**同时**存在时，命中部分由明细级筛选决定（付款无法与明细取交集），多账户记录在记录级维度下也计入命中明细的全额，账户筛选只决定记录是否出现。例：筛选我的账户 + 分类住院费，按月显示 8 万。这种情况下金额为明细全额，**不能只显示数字**：多账户记录必须带「共同支付」标识并显示整笔金额，让用户一眼看出这 8 万不全是该账户出的。显示形式：「8 万（共同支付 · 整笔 12 万）」。不显示该账户的出资份额：份额是整笔记录的份额而不是该明细的份额，与明细全额并列会被误读（#909 追加 2，见 3.16）。数据字段见 2.4。
- **已知边界（由上述规则直接得出）：** 记录级维度下的「份额」是实际付款金额，不扣除退款 / 报销。被退款的多账户支出在「筛选账户 + 按月」时仍按份额全额计入；而单账户的退款收入记录保持现有业务净额口径（已关联时为 0）。需要看账户实际流水时，以「按账户分组」为准。如需按「人」查看（某人名下所有账户合计，例如退款进入我的礼品卡时，我 = −5 万 + 1 万 = −4 万），见 [#909](https://github.com/toushobun/kuranote/issues/909)；本 Issue 中「筛选单个账户只看该账户自己的收付」的规则不变。

### 2.2 现状与可行性

交易列表实际使用 `load_transaction_group_summaries_with_special_status`（非时间维度分组）和 TS 端 `grouping/*` + `transactionGroupBuilder.ts`（时间维度分组、组内明细）。这两处现在都是**明细级过滤**：账户、分类、特殊状态都作用在明细上，金额只累计命中的明细。基础版 `load_transaction_group_summaries`（记录级过滤）已没有应用调用方，按已决事项删除（2.3）。

方案 D 可以在这两处现有结构上实现，不需要分摊算法。新增的只有一个分支：**「有账户筛选、没有其他明细级筛选」时，多账户记录在记录级维度下的金额取该账户的付款份额**。其余情况保留现有明细级计算，只把账户条件从明细上移走。

为了让「账户维度」只有一个读取入口，新增只读视图 `transaction_account_movement`（`security_invoker = true`），合并两类来源：

| 来源                                                  | 行                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `transaction_payment`                                 | 普通记录（`type = 'normal'`）的每条付款明细：`ledger_id, transaction_record_id, account_id, amount, balance_delta, sort_order` |
| `transaction_item` ⋈ `transaction_record`（类型过滤） | 转账、余额调整的明细（`type in ('transfer', 'balance_adjustment')`），列同上                                                   |

所有按账户筛选、按账户分组、「最近使用账户」等读取都改为经这个视图，不再各自拼 union。

账户分组改用实际收付金额后，单账户已退款记录在账户分组中的收入 / 支出两列会变化（例：支出 X、退款 R 原来显示「支出 X − R、退款侧 0」，现在显示「支出 X、退款侧收入 R」），**余额不变**。退款进入其他同币种账户时（#899 已允许），新口径能把两个账户各自的实际流水显示正确。

### 2.3 需要修改的函数（统计 / 列表）

记号：`p_account_id` = 筛选账户；「多账户记录」= 付款明细 ≥ 2 行；「有其他明细级筛选」= 分类、大分类、特殊状态任一非空，或 `p_record_type = 'refundableExpense'`。

**`load_transaction_group_summaries_with_special_status`**（子 Issue 4）

1. `base_items` 不变（仍以 `business_net_amount` 计算 `signed_amount`）。新增 CTE `record_payments`：按记录统计 `payment_count`，以及 `p_account_id` 对应付款行的 `balance_delta`（`account_share_delta`）。
2. `matched_items` 去掉 `bi.account_id = p_account_id`，改为记录级条件：`p_account_id is null or exists (select 1 from transaction_account_movement m where m.transaction_record_id = bi.record_id and m.account_id = p_account_id)`。其他条件不变。
3. `p_group_by in ('merchant', 'member')`（记录级维度）时，金额行来自 `record_rows`：
   - 记录满足「`p_account_id` 非空 ∧ 多账户记录 ∧ 没有其他明细级筛选」，且至少有一条命中明细 → 该记录只产生**一行**，`signed_amount = account_share_delta`（例：−5 万）。
   - 其他记录 → 沿用 `matched_items` 的逐明细行（与现状相同）。
4. `p_group_by = 'account'` 时走 `account_rows`：取至少有一条命中明细的记录，连接 `transaction_account_movement`。普通记录的 `signed_amount = balance_delta`（实际收付，单账户也一样），转账 / 余额调整仍为 0（现状）。`p_account_id` 非空时只保留该账户的行（只出现该账户一组）。`count(distinct record_id)` 计入每个出资账户。
5. `p_group_by in ('parentCategory', 'category', 'specialStatus')`（明细级维度）：金额逻辑不变（命中明细的业务净额）。按大分类 / 小分类分组时只纳入普通记录，转账、余额调整没有分类，不进入「未知」组（#909 追加 2）。所有维度新增两个返回列，供「共同支付」标识使用（2.4）。只在 `p_account_id` 非空时计算，否则为 0；均按组内**去重后的多账户记录**统计（一笔记录在一个组内只计一次）：
   - `shared_payment_record_count integer`：组内多账户记录数。
   - `shared_payment_record_total_amount numeric`：这些记录的整笔金额（付款明细 `amount` 合计，等于支出明细合计）合计。
   - （#914 时还有 `shared_payment_account_share_amount`，#909 追加 2 删除，见 3.16。）
6. 签名的返回列变化后，先 `drop function` 再创建，并重新授予 EXECUTE；`TransactionGroupSummaryRow` 同步增加字段。

**基础版 `load_transaction_group_summaries`**：删除该函数，以及只验证它的 migration 文本测试（`loadTransactionGroupSummaries*Migration.test.ts`、`currentLedgerBoundaryAudit.test.ts` 中的对应断言）（子 Issue 4）。

**TS 端**（子 Issue 4）：

| 位置                                                                                                                              | 改动                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `util/grouping/filters.ts`                                                                                                        | `filterItems` 去掉 `item.account_id !== filters.accountId` 条件；`filterTransactionRecords` 的账户条件改为「该记录的账户来源（付款明细 / 转账明细）包含 `accountId`」。`hasItemFilters` 不再把 `accountId` 计入明细级筛选，另导出 `hasNonAccountItemFilters(filters)` 供下面的份额判断使用。                                                             |
| 新增纯函数 `util/grouping/recordContribution.ts`                                                                                  | `resolveRecordLevelContribution({ record, matchedItems, payments, filters, categoryById })`：满足「有账户筛选 ∧ 多账户记录 ∧ 没有其他明细级筛选」时返回该账户付款份额（`balance_delta`），否则返回命中明细的业务净额合计（现有 `calculateRecordNetAmount` 的口径）。这是 SQL 第 3 步在 TS 端的唯一实现，时间维度分组和组内列表行都用它，不各自重复判断。 |
| `util/transactionGroupBuilder.ts`                                                                                                 | `addRecordToGroup`（时间 / 商家 / 成员）改为用 `resolveRecordLevelContribution` 累计金额。`addItemGroups` 的账户分支改为遍历付款明细（筛选账户时只取该账户），用 `balance_delta` 累计；分类 / 特殊状态分支不变。各组增加 `sharedPaymentRecordCount`、`sharedPaymentRecordTotalAmount`（口径同 SQL 第 5 步）。                                            |
| `util/grouping/groupMatching.ts`                                                                                                  | `groupBy === "account"` 改为在该记录的账户来源中查找 `groupKey`。                                                                                                                                                                                                                                                                                        |
| `util/grouping/contextLookups.ts`、`util/grouping/types.ts`、`service/read/groupLoaders.ts`、`service/read/transactionContext.ts` | 上下文增加 `payments` / `paymentsByRecordId`（经 `transactionRepository.listPayments`）；账户上下文的 `accountIds` 从付款明细和转账明细收集；RPC 返回的 `shared_payment_*` 三列映射到组摘要。                                                                                                                                                            |
| `util/buildTransactionListItem.ts`                                                                                                | 见 2.4。                                                                                                                                                                                                                                                                                                                                                 |
| `transactionRepository.loadDashboardRecentlyUsedAccountIds`                                                                       | 从 `transaction_account_movement` 取账户（按 `sort_order`），不再读 `transaction_item.account_id`。                                                                                                                                                                                                                                                      |
| `transactionRepository.loadDashboardMonthSource`、`statisticsRepository`（/statistics）                                           | 只用分类和金额，不读账户，**不改**。                                                                                                                                                                                                                                                                                                                     |

### 2.4 「共同支付」标识的数据来源

**出现条件。** 有账户筛选时，多账户记录的金额在以下两种情况下是明细全额而不是该账户的份额，必须显示「共同支付」标识和整笔金额（不显示份额，#909 追加 2）：

| #   | 条件                                                                                                                 | 金额           | 例（医院 12 万，筛选我的账户）                   |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------ |
| 1   | 有账户筛选 + 明细级维度分组（按分类 / 大分类 / 特殊状态）                                                            | 命中明细的全额 | 按分类：住院费 8 万（共同支付 · 整笔 12 万）     |
| 2   | 有账户筛选 + 其他明细级筛选（分类 / 大分类 / 特殊状态 / 可退款支出）同时存在，任何分组维度（包括按月 / 商家 / 成员） | 命中明细的全额 | 分类住院费 + 按月：8 万（共同支付 · 整笔 12 万） |

两种情况合起来就是「有账户筛选 ∧ 多账户记录 ∧（明细级维度分组 ∨ 有其他明细级筛选）」，由 TS 端一个纯函数判断（与 `resolveRecordLevelContribution` 放在同一文件，复用 `hasNonAccountItemFilters`），列表行和组头都调用它，不各自重复判断。按账户分组时金额就是付款份额，不需要标识。

**需要的数据：**

| 数据       | 列表行（`TransactionListItem`）             | 分组摘要（RPC 列 / TS 组摘要字段）                                             |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| 付款账户数 | `payment_account_count: number`（始终给出） | `shared_payment_record_count` / `sharedPaymentRecordCount`（组内多账户记录数） |
| 整笔金额   | `record_total_amount?: string`              | `shared_payment_record_total_amount` / `sharedPaymentRecordTotalAmount`        |

- **列表行：** `buildTransactionListItem` 从付款明细计算 `payment_account_count`。`payment_account_count ≥ 2` 时，账户位置按方案 B 显示「首个账户等 N 个账户」。`record_total_amount`（付款明细 `amount` 合计）只在「有账户筛选 ∧ 多账户记录」时给出，其他情况不给。主金额统一来自 `resolveRecordLevelContribution`，与组合计一致：没有其他明细级筛选的记录级维度下是份额（2.1），出现条件 1 / 2 下是命中明细全额；两种情况都只显示「共同支付 · 整笔 Y」。
- **分组摘要：** 两个字段来自 RPC（2.3 第 5 步）或 TS builder，口径相同。满足出现条件且 `sharedPaymentRecordCount > 0` 时，组头在金额旁显示「含共同支付 N 笔 · 整笔 Y」，说明组合计不全是该账户出的。文案集中到模块常量。
- **视觉样式：** 按 Issue 评论第 10 点，具体展示方式按设计图确定；本文只规定数据字段和出现条件。
- **实现位置：** 字段与计算都在子 Issue 4。

## 3. 数据模型与 migration 设计

### 3.1 新表 `transaction_payment`

```sql
create table public.transaction_payment (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null,
    transaction_record_id uuid not null,
    account_id uuid not null,
    amount numeric(14,2) not null,
    balance_delta numeric(14,2) not null,
    sort_order integer not null default 0,
    created_by uuid references public.app_user(id),
    created_at timestamptz not null default now(),
    constraint transaction_payment_amount_check check (amount >= 0),
    constraint transaction_payment_delta_matches_amount_check
        check (abs(balance_delta) = amount),
    constraint transaction_payment_sort_order_check check (sort_order >= 0),
    constraint transaction_payment_record_account_unique
        unique (transaction_record_id, account_id),
    constraint transaction_payment_record_same_ledger_fk
        foreign key (transaction_record_id, ledger_id)
        references public.transaction_record(id, ledger_id) on delete restrict,
    constraint transaction_payment_account_same_ledger_fk
        foreign key (account_id, ledger_id)
        references public.account(id, ledger_id) on delete restrict
);

create index transaction_payment_record_idx
    on public.transaction_payment (transaction_record_id, sort_order, id);
create index transaction_payment_account_idx
    on public.transaction_payment (ledger_id, account_id, transaction_record_id);
```

各项取舍如下：

- **挂在 record 上，不挂在 item 上。** 这样表达的是「总分」关系，付款行不引用任何分类明细。
- **适用范围是全部 `type = 'normal'` 记录，不只是支出记录。** 每笔普通记录（包括纯收入、收支混合）都恰好有 ≥ 1 行付款明细，从而成为余额的**唯一**来源；收入记录的一行表示「收款账户」。数据库层只有多行时才要求「全部是支出明细」。这样普通记录就不再需要读 `transaction_item.account_id`，见 3.3。
- **`amount` 与 `balance_delta` 都保存。** 与 `transaction_item` / 转账的既有约定一致：`amount` 是展示和导出用的非负金额（即「付款金额」），`balance_delta` 是唯一传给 `apply_account_balance_delta` 的值。删除记录时，按行回滚 `-balance_delta` 即可，不需要再按记录组成推导符号。`abs(balance_delta) = amount` 由 CHECK 保证。
  - 多账户（全部是支出）：每行 `balance_delta = -amount`。
  - 单账户：`balance_delta = Σ收入明细 − Σ支出明细`（与现在每条明细 ±金额的合计一致），`amount = abs(balance_delta)`。
- **不需要 `updated_by` / `updated_at`。** 编辑时整组替换（见 3.5），行没有独立的生命周期；版本控制落在 `transaction_record.updated_at` 上：已关联编辑提交 `p_expected_record_updated_at`，不一致时返回 `transaction_item_version_conflict`（复用 #574 现有 code 与提示）；普通 `update_transaction` 保持现状（后写覆盖），不扩大范围。
- **金额为 0 的行照常保存**，不自动删除。
- **`sort_order` 即录入顺序。** 列表「首个账户」取 `sort_order` 最小的一行。
- **不设 `discount_amount`。** 折扣不在本 Issue 范围内（#835）。
- **删除记录（`status = 'deleted'`）时付款明细保留**，与 `transaction_item` 一致，供历史追溯；账户余额在作废时按行回滚。

### 3.2 记录级不变量与延迟校验

「合计相等」「多行只允许全部是支出」这类不变量跨越 `transaction_payment` 和 `transaction_item` 两张表，单行 CHECK 无法表达。新增延迟约束触发器 `validate_transaction_record_payments()`，定义为 `CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED`，挂在 `transaction_payment`（INSERT / UPDATE / DELETE）、`transaction_item`（INSERT / UPDATE OF `amount`, `category_id`, `transaction_record_id` / DELETE）和 `transaction_record`（UPDATE OF `type`, `status`）上，提交时对受影响的记录逐笔检查：

| 检查                                                                                                 | 失败时的稳定 code（`detail`）                                  |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `active` 的 `normal` 记录至少 1 行付款明细                                                           | `payment_required`                                             |
| `transfer` / `balance_adjustment` 记录没有付款明细                                                   | `payment_record_type_invalid`                                  |
| `Σ payment.balance_delta = Σ(收入明细 amount) − Σ(支出明细 amount)`                                  | `payment_total_mismatch`                                       |
| 付款明细多于 1 行时，所有明细的分类类型都是 `expense`，且每行 `balance_delta = -amount`              | `payment_multi_account_not_allowed`                            |
| 所有付款账户币种相同                                                                                 | `payment_currency_mismatch`                                    |
| 本记录作为退款 / 报销任一侧时，记录币种与关联对方记录的币种一致                                      | `refund_currency_mismatch` / `reimbursement_currency_mismatch` |
| 过渡期（见 3.3）：付款明细恰好 1 行，且每条明细的 `account_id` 等于该行账户、`balance_delta` 为 NULL | `payment_transition_invalid`                                   |

同一账户不能出现两次，由唯一约束 `transaction_payment_record_account_unique` 兜底（`23505`）。只有约束名精确匹配时，Repository 才把它转换为 `payment_account_duplicate`。

错误提示的写法参照 `account_active_name_unique` 的先例（#801 / #802）：RPC 在写入结束前执行 `set constraints <trigger> immediate`，让错误在 RPC 内抛出，带上稳定的 `detail`。延迟触发器本身是绕过 RPC 时的最后防线。pgTAP 测试以 `begin; … rollback;` 运行，延迟约束不会自动触发，所以测试必须显式执行 `set constraints … immediate`（`account_name_scope.test.sql` 等已有先例）。

**账户改币种：** 延迟触发器只在付款明细 / 明细 / 记录变化时检查，`update_account_with_holders` 修改账户币种不会被它拦截，会让已有记录违反「同一笔记录同币种」（转账、退款关联也有同样问题）。本 Issue 不在这里处理，另开 Issue「有交易的账户禁止改币种」，并把它作为子 Issue 4（解除单行限制、开放多账户）合并前的前置条件，避免出现同一笔记录多个付款账户币种不一致的数据。

「记录币种」统一由新的内部 STABLE 函数 `transaction_record_currency(p_ledger_id, p_transaction_record_id)` 给出：普通记录取付款账户的币种（不变量保证唯一），转账 / 余额调整取明细账户的币种。所有币种校验都改用这个函数，不再经 `transaction_item.account_id` 取币种。

### 3.3 `transaction_item.account_id` / `balance_delta` 的去留与过渡期

**最终状态**（不保留两份事实来源）：

| 记录类型                         | `transaction_item.account_id` | `transaction_item.balance_delta` | 余额来源                         |
| -------------------------------- | ----------------------------- | -------------------------------- | -------------------------------- |
| `normal`                         | 必须为 NULL                   | 必须为 NULL                      | `transaction_payment`            |
| `transfer`、`balance_adjustment` | 必须非空（现状，不变）        | 必须非空（现状，不变）           | `transaction_item`（现状，不变） |

两列都改为 nullable，按记录类型的约束写进已有的 `validate_transaction_item_category_shape()` 触发器（它已经按 `transaction_record.type` 校验 `category_id` 的形态，正好扩展）。转账和余额调整的存储与 RPC 不变。

对每一种记录类型来说，账户只有一个来源。不过「账户在哪张表」仍随类型不同；用 2.2 的 `transaction_account_movement` 视图把读取侧统一到一个入口。本 Issue 不把转账 / 余额调整迁入 `transaction_payment`（规则写明转账不受影响、余额调整语义不变）；将来转账若支持多账户，再评估把三类记录统一成一张「账户分录」表。

**过渡期**：子 Issue 必须各自以 `main` 为 base、独立通过 CI（见第 6 节），而读取 `transaction_item.account_id` 的地方很多（列表、分组 RPC、筛选、导出、Picker、编辑视图、最近使用账户）。如果子 Issue 1 直接删列，它就得同时改完所有读取方。因此设一个有边界的过渡期：

- **开始：** 子 Issue 1 的 migration 生效。
- **余额：** 过渡期内余额**已经只由** `transaction_payment.balance_delta` 决定。普通记录明细的 `balance_delta` 从子 Issue 1 起写 NULL，不参与任何余额计算。余额不存在双来源。
- **账户镜像：** 普通记录明细的 `account_id` 暂时作为只读镜像，由 RPC 写成唯一付款账户，延迟触发器校验两者一致（`payment_transition_invalid`）。镜像只供尚未切换的读取方使用，新代码不得读取。
- **单行限制：** 过渡期内数据库要求普通记录的付款明细恰好 1 行，即还不能真正保存多账户记录。这样未切换的读取方不会读到错误的账户。
- **结束条件：** 所有读取方都切换到付款明细 / `transaction_account_movement`（子 Issue 3 导出、子 Issue 4 列表与统计合并）。子 Issue 4 的 migration 把普通记录明细的 `account_id` 置为 NULL，并启用最终状态的类型约束，删除镜像校验，解除单行限制，同时更新 `transaction_item` 的 INSERT / UPDATE RLS policy（现有 policy 要求 `account_id` 指向未归档账户）。之后在代码中 grep `transaction_item` 的 `account_id`，只应剩下转账 / 余额调整的路径。

过渡期已由子 Issue 4 PR 2 结束，实现差异见 3.14。

### 3.4 RPC 入参契约

`create_transaction`、`update_transaction`、`convert_transaction_type`（含 `_with_special_status`）的 `p_account_id uuid` 改为 `p_payments jsonb`。签名变化时先 `drop function` 旧签名再创建，避免重载歧义，并按 `docs/security-definer-functions.md` 重新撤销 / 授予 EXECUTE。payload 形态：

```json
[{ "accountId": "…" }, { "accountId": "…", "amount": "50000.00" }]
```

- **1 个元素（单账户）：** 不传 `amount`。RPC 按明细推导 `balance_delta = Σ收入 − Σ支出`，`amount = abs(...)`。单账户的输入和保存语义与现在完全一致，UI、导入都不需要计算付款金额。
- **≥ 2 个元素（多账户）：** 每个元素必须提交 `amount`（≥ 0，两位小数），RPC 写 `balance_delta = -amount`。数组顺序就是 `sort_order`。
- 账户必须属于本账本且未归档（`account_invalid`）；重复账户返回 `payment_account_duplicate`。其余规则交给 3.2 的不变量，RPC 结束前立即检查。

转账（`create_transfer_transaction` / `update_transfer_transaction`）和余额调整（`create_balance_adjustment_transaction` / `update_balance_adjustment_transaction` / `record_account_initial_balance` / `update_account_with_balance_adjustment`）的签名不变。

### 3.5 余额更新、原子性与锁顺序

所有写入都在一个 RPC（一个事务）内完成。付款明细、交易明细、关联、余额任一步失败，整体回滚，不会出现部分账户已更新、部分失败的状态。

锁顺序沿用 #574 的统一规则，并补上「账户必须先按 UUID 显式加锁」这一条。多账户记录让一笔交易同时更新多个账户：如果仍靠 `apply_account_balance_delta` 按调用顺序隐式加锁，两个并发事务以不同顺序更新 A、B 时会死锁。

```text
ledger（需要时）→ transaction_record（稳定顺序）→ transaction_item / 关联目标（稳定顺序）
  → account（旧付款账户 ∪ 新付款账户，按 UUID 一次性 FOR NO KEY UPDATE，理由见 3.9）
```

| 流程                                           | 余额处理                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 创建                                           | 校验 payload → 写 record → 写明细 → 按 UUID 锁账户 → 写付款明细 → 按账户聚合 `balance_delta`，以 UUID 顺序调用 `apply_account_balance_delta` → 建立关联（关联的币种校验读取付款账户，见 3.9）。                                                                                                                                               |
| 编辑（`update_transaction`）                   | 锁 record → 锁明细 / 关联目标 → 读旧付款明细 → 按 UUID 锁「旧 ∪ 新」账户 → 旧账户中有已归档的就拒绝（`account_invalid`，与现在「含归档账户不可编辑」一致）→ 删除旧付款明细、写入新付款明细（整组替换；付款行没有外部引用）→ 每个账户算 `Σ新 balance_delta − Σ旧 balance_delta`，只对非 0 差额按 UUID 顺序调用 `apply_account_balance_delta`。 |
| 删除（`void_transaction`）                     | 锁 record → 按 UUID 锁付款账户 → 每行回滚 `-balance_delta` → 标记 `deleted`，付款明细保留。转账 / 余额调整路径不变。                                                                                                                                                                                                                          |
| 类型转换（normal ⇄ transfer）                  | 现在已按 UUID 锁「旧 ∪ 新」账户，只需把普通记录一侧的账户集合改为付款明细。normal → transfer：回滚并删除付款明细，再按现有逻辑写转账明细。transfer → normal：删除转账明细，按 `p_payments` 写付款明细。`_with_special_status` 内部对 `update_transaction` 的第二次调用改为透传 `p_payments`。                                                 |
| 已关联编辑（`update_linked_transaction_edit`） | 见 4.1。付款明细在明细更新之后、记录头更新之前，按上述「编辑」规则整组替换。                                                                                                                                                                                                                                                                  |

**含已归档付款账户的记录：** 保持现状，整笔只读（`editRestriction = "archivedAccount"`），RPC 也拒绝编辑 / 删除。不放开「已归档行不变时可编辑」；归档后续会大规模整理（Issue 评论第 5 点），届时再统一设计。

`apply_account_balance_delta` 的签名和「已归档账户不能更新」的语义都不变，只是改为每个账户调用一次（传聚合后的差额），不再每条明细调用一次。

### 3.6 RLS 与权限

- `transaction_payment` 启用 RLS。SELECT policy 与 `transaction_item_select_active_record` 同形：当前用户是 active 成员，且所属 record 为 `active`。
- **不授予** authenticated 对 `transaction_payment` 的 INSERT / UPDATE / DELETE，写入只经 SECURITY DEFINER RPC。这比 `transaction_item` 现在开放直接写入（由 RLS 和 `enforce_transaction_child_permission` 约束）更严格：付款明细直接决定余额，没有绕过 RPC 的必要。
- `transaction_account_movement` 视图使用 `security_invoker = true`，继承两张基表的 RLS。
- `validate_transaction_record_payments()`、`transaction_record_currency()` 是内部函数，撤销 PUBLIC / anon / authenticated / service_role 的 EXECUTE。`docs/security-definer-functions.md` 增加本 Issue 一节，记录新函数、授权和锁顺序。

### 3.7 账本删除与放弃创建

`docs/database-schema.md` 要求新增账本外键时同步审查删除顺序：

- `delete_ledger`：在删除顺序 2（`transaction_item`、`transaction_record`）之前删除 `transaction_payment`。它通过 record / account 间接属于账本，外键为 RESTRICT。补充 `delete_ledger.test.sql`。
- `abandon_ledger_setup`：创建阶段不写交易，已有的「存在 `transaction_record` 即拒绝」已经覆盖付款明细，不需要改，在表格中补一行说明即可。
- 更新 `docs/database-schema.md` 中 #875 / #890 的两张表。

### 3.8 seed 与测试数据

- **migration 不做回填。** 生产环境没有数据（Issue 评论第 2 点）。`supabase db reset` 先回放 migrations 再执行 seed，所以 migration 回填对 seed 无效。为了让已有本地库（未 reset）不至于在第一次编辑时报 `payment_required`，子 Issue 1 的 migration **附带**一段幂等的 `insert … select`：按普通记录的明细账户，生成「每笔一行、`balance_delta = Σ明细 ±金额`」的付款明细（已有付款明细的记录跳过），生产环境上为空操作。
- **`supabase/seed.sql`：** 子 Issue 1 给每笔普通记录显式插入一行付款明细，明细的 `balance_delta` 改为 NULL（过渡期内 `account_id` 保持镜像）。子 Issue 4 删除明细中的 `account_id`，并新增 1～2 笔多账户示例（例如 Amazon「礼品卡 + 信用卡」、医院「我的账户 + 妻子账户」），供人工验收使用。
- **pgTAP（`supabase/tests/database/*.test.sql`）：** 约 30 个文件直接 `insert into public.transaction_item`。子 Issue 1 新增共享 helper（例如测试 schema 中的 `tests.insert_normal_transaction(...)`），一次写入 record、明细、付款明细，各文件改为调用它，不各自复制插入语句（AI_RULES 的复用规则同样适用于测试代码）。涉及延迟约束的断言显式执行 `set constraints … immediate`。

### 3.9 子 Issue 1 实现注记（#911）

实现时对本节以上内容做了以下补充，理由逐条记录：

- **账户锁用 `FOR NO KEY UPDATE`。** 写明细（过渡期镜像 `account_id`）和付款明细时，外键检查会对账户行取 `KEY SHARE`。显式 `FOR UPDATE` 与 `KEY SHARE` 冲突：两个事务在 A、B 之间反向切换付款账户时，各自先写明细取得对方要锁的账户的 `KEY SHARE`，再按 UUID 加 `FOR UPDATE`，会互相等待而死锁（`transaction_payment_account_lock_concurrency.sh` 在 `FOR UPDATE` 下可复现）。`FOR NO KEY UPDATE` 与余额 `UPDATE` 本身的锁等级相同，不与 `KEY SHARE` 冲突，按 UUID 一次性取得即可。类型转换与删除的账户锁一并改为 `FOR NO KEY UPDATE`。
- **创建 / 编辑先写付款明细再建关联。** 关联的币种校验改为看付款账户（`transaction_record_currency`），所以付款明细必须先于 `apply_transaction_item_links` 写入。这与现有 `update_transaction` 的顺序相同（先处理余额、再建关联）；建关联的路径都先持有 ledger 锁，账户锁与关联目标锁之间不会形成交叉等待。
- **过渡期 `transaction_item.account_id` 保持 NOT NULL。** 过渡期内每条普通明细都写镜像，改为 nullable 只会让读取方的类型变成可空，与本期「行为不变」无关。改为 nullable 与最终状态约束一起移到子 Issue 4。`balance_delta` 已改为 nullable 并去掉默认值。
- **明细 `balance_delta` 的形态由 `validate_transaction_item_category_shape` 立即校验**（`23514`，`transaction_item_balance_delta_invalid`）：普通记录必须为 NULL，转账 / 余额调整必须非空。3.2 表中 `payment_transition_invalid` 只负责「恰好 1 行」和「明细账户镜像等于付款账户」，因此延迟触发器在 `transaction_item` 上额外监听 `account_id`。
- **新增内部函数 `transaction_payment_account_ids(p_ledger_id, p_payments)`**：解析付款账户（`payment_required` / `account_invalid` / `payment_account_duplicate`），创建 / 编辑 / 类型转换（取镜像账户、确定锁集合）与 `replace_transaction_payments` 共用，不各自复制解析逻辑。多账户缺金额为 `payment_amount_required`，金额格式错误为 `amount_invalid`。
- **`p_expected_record_updated_at` 默认 NULL，NULL 时只做明细级版本校验。** 记录版本要等子 Issue 2 由 Service 传入；本期 Repository 传 NULL，已关联编辑仍由每条明细的 `expectedUpdatedAt` 保护。直接调用 RPC 的一方不传时也只是放弃记录级乐观锁，不影响数据一致性。
- **Repository 输入类型本期不改。** `CreateNormalTransactionInput` 等仍为 `accountId`，Repository 内部转换为 `p_payments: [{ accountId }]`；导入经同一 Repository，不需要改动。`payments` 类型随子 Issue 2 的 `TransactionPayment` 一起引入。已关联编辑的 Repository 输入把 `accountId` 从明细移到记录级（RPC 签名要求）。
- **测试 helper 放在 `supabase/seeds/test_helpers.sql`（`tests` schema）。** pgTAP 与本地 seed 都依赖 seed 数据，`db reset` / `supabase start` 会先加载它；不进入 migrations。提供 `tests.insert_normal_transaction_items(jsonb)`（按 `transaction_item` 列名直接写明细并补齐付款明细）、`tests.sync_normal_transaction_payments(uuid[])`、`tests.current_transaction_payments(uuid)`，以及按旧参数经 `update_linked_transaction_edit` 提交的 `tests.update_linked_transaction_item(...)`。seed 中的普通明细 `balance_delta` 改为 NULL，并调用 `tests.sync_normal_transaction_payments()` 生成付款明细。

### 3.10 子 Issue 2 实现注记（#912）

实现时对本节以上内容做了以下补充，理由逐条记录：

- **`requireActiveTransactionAccounts` 改为显式接收 `existingAccountIds`。** 原来内部统一调用 `listItems` 取「已有账户」；`updateNormal` 改为调用新的 `listPayments` 取已有付款账户（为 #834 子 Issue 4 去掉普通记录明细 `account_id` 做准备），`updateTransfer` 保持调用 `listItems`（转账账户仍在明细上，不受影响）。两者的「新账户」与「已有账户」合并校验逻辑不变。
- **`linkedTransactionEditService.ts` 的账户校验改为调用 `validateTransactionPayments`。** 原实现只检查「新账户是否在有效选项中」；由于该路径（已存在关联明细）绕过 `transactionService.updateNormal`，是唯一不会自动获得第二道防线校验的分支，改为调用与 create / update / convert 相同的 `validateTransactionPayments`，一并获得去重、币种一致、多账户仅支出、合计相等的校验。付款明细是否变化（账户集合、顺序、金额）改为比较 `payments` 数组；单账户时金额由 RPC 推导，不参与比较，避免把「已持久化金额」与「表单留空（null）」误判为变化。
- **记录版本 `p_expected_record_updated_at` 的链路已打通，但前端还没有入口提交它。** `linkedTransactionEditService` → `linkedTransactionItemService` → `linkedTransactionItemRepository` → RPC 的参数传递与 `transaction_item_version_conflict` → `ConflictError` 的映射均已实现并有直接单测覆盖（Service 用 mock 构造冲突场景）；`adapter/next/linkedEditInput.ts` 也已能解析可选的 `expectedRecordUpdatedAt` 表单字段。但现有 `TransactionForm.tsx`（#915 范围，本 Issue 不改 `src/components/**`）还没有渲染对应的隐藏字段，所以浏览器端目前始终不提交该值，RPC 收到 NULL 时只做明细级版本校验，与现状行为一致。#915（或一个很小的后续 PR）补上 `<input type="hidden" name="expectedRecordUpdatedAt">` 即可在不改 Service/Repository 的前提下打通端到端的记录级乐观锁。（#915 已补上，见 3.15。）
- **HTTP JSON API（`/transactions` 路由）本次不支持多账户。** `createTransactionRequestSchema` 等 zod schema 维持 `accountId` 字段不变（4.2 原表未提及这些路由，设计文档没有覆盖，这里补充说明而非变更文档结论）；`transactionController.ts` 在调用 Service 前把 `accountId` 适配为单账户 `payments: [{ accountId, amount: null }]`，用户可见行为与现状一致。多账户目前只能通过 Server Action 的 `paymentAccountId[]` / `paymentAmount[]` 表单字段提交（最终也会被 3.3 过渡期的单行限制拒绝）。
- **`transactionImportService.ts` 的改动随本子 Issue 一起落地。** 见 4.2 表格对应行的更正说明：3.9 已记录 #911 把 Repository 输入类型改造推迟到本子 Issue，因此该适配实际在这里完成，而不是子 Issue 1。

### 3.11 子 Issue 3 实现注记（#913）

实现时对本节以上内容做了以下补充，理由逐条记录：

- **`TransactionExportRecord` 按记录类型拆成判别联合（discriminated union），不是单一形状。** `type: "normal"` 的分支里 `items` 只保留 `categoryId` / `amount`，账户改由新增的 `payments: TransactionExportPayment[]` 表达；`type: "transfer" | "balance_adjustment"` 的分支里 `items` 保留原有的 `accountId` / `balanceDelta`。这样普通记录的 `items` 在类型层面就不可能再带账户字段，不依赖调用方自觉不读它；4.4 原表没有规定具体 TS 形状，这里补充说明。
- **普通记录的 `items` 同时去掉了 `balanceDelta`，不只是 `accountId`。** 现有 `dataExportWorkbook.ts` 对普通记录从未读取 `items[].balanceDelta`（金额直接取 `items[].amount`，正负由分类的收入 / 支出类型决定），该字段在普通记录上完全是未使用的只读镜像，随 `accountId` 一并删除，避免保留一个无人读取的字段。转账 / 余额调整的 `items[].balanceDelta` 不变（用于判定转账方向、读取余额变更金额）。
- **`transactionExportQueryService.ts` 的依赖类型新增 `TransactionExportRepository`（继承 `TransactionContextRepository`，补 `listPayments`），不是直接给 `TransactionContextRepository` 加方法。** `TransactionContextRepository` 同时被 `TransactionDashboardRepository`、`TransactionGroupRepository` 继承，直接加方法会让仪表盘、分组统计等与本子 Issue 无关的路径也被迫实现 `listPayments`，扩大改动范围；新增一个只给导出用的窄接口可以避免这一点，具体的 Supabase 实现（`createSupabaseTransactionRepository`）本身已经实现 `listPayments`（#911），结构上自动满足新接口，不需要改动。
- **「付款明细」sheet 的「顺序」列取数组下标（从 1 开始），不是 `transaction_payment.sort_order` 原始值。** `TransactionExportRecord.payments` 按 4.2 的约定只保留 `accountId` / `amount` / `balanceDelta`，不携带 `sort_order`；`transactionExportQueryService` 读取的 `listPayments` 已经按 `sort_order` 升序排列，因此数组顺序本身就是录入顺序，「顺序」列直接取写出时的位置（第几行记成几）即可，不需要再额外携带原始 `sort_order` 整数。
- **「付款明细」sheet 的列定义（`paymentDetailColumns`）和 sheet 名（`paymentDetailSheetName`）就近放在 `src/utils/dataExportWorkbook.ts` 模块内，不加入 `internal/dataImport` 的 `ImportSheetKind` / `importColumnsBySheetKind`。** 本 Issue明确不做导入支持，这个 sheet 对导入来说只是「名字不认识、忽略」的普通 sheet；放进 `ImportSheetKind` 会让导入侧看起来已经认识它，容易和后续「导入支持付款明细 sheet」Issue 的范围混淆。

### 3.12 #921 替换「付款明细」sheet

维护者认为额外一个 sheet 普通用户看不懂，因此将 #913 / PR #920 的「付款明细」sheet 替换为「收支」sheet 内的分号格式（4.4）。当前没有真实多账户数据，不保留旧 sheet 的兼容代码、列常量或专用测试。3.11 仅作为历史实现记录保留；普通记录从 `transaction_payment` 读取账户与付款顺序的设计继续沿用。导出契约移除未被使用的付款 `balanceDelta`，仅保留账户和金额。

### 3.13 子 Issue 4 PR 1 实现注记（#914）

子 Issue 4 拆成 2 个 PR：PR 1 实现方案 D 的统计 / 列表 / 「共同支付」标识，过渡期保持开启；PR 2 执行结束过渡期的 migration 与 seed。PR 1 对本节以上内容做了以下补充，理由逐条记录：

- **`TransactionExportRepository` 并入 `TransactionContextRepository`。** 3.11 为了不扩大范围单独加了窄接口；本 PR 起列表、分组、仪表盘的上下文都要读付款明细，`listPayments` 成为上下文的公共依赖，窄接口不再有意义。
- **列表行不输出 `payment_account_count`。** 账户位置的「首个账户 等 N 个账户」在 `buildTransactionListItem` 内直接由付款明细生成到 `account_name`，前端没有其他地方需要账户数，保留该字段会成为无人读取的字段。
- **`account_share_amount` 只在主金额为命中明细全额（出现条件 1 / 2）时给出；`record_total_amount` 在「有账户筛选 ∧ 多账户记录」时给出。** 记录级维度下主金额本身就是本账户份额，列表行按 Issue「共同支付显示规格」只显示「共同支付 · 整笔 ¥Y」；出现条件 1 / 2 下显示「共同支付 · 本账户 ¥X / 整笔 ¥Y」。文案用「本账户」而不是 2.1 / 2.4 示例中的「我出资」（以 Issue 规格为准）。#909 追加 2 起不再显示份额，`account_share_amount` 已删除（3.16）。
- **主金额为本账户份额时不显示原金额。** 原金额是明细业务净额口径，与份额口径不可比，同时显示会误导；主金额为明细全额时照常显示，顺序为当前金额 → 共同支付行 → 原金额。
- **分组摘要用嵌套对象 `sharedPayment: { recordCount, recordTotalAmount }`，不是平铺字段。** 这些值总是一起出现或一起缺省，嵌套后前端只需判断一次。只在出现条件成立且 `recordCount > 0` 时给出；RPC 的列照常返回，由 TS 端按同一判断函数决定是否显示。（#914 时还有 `accountShareAmount`，#909 追加 2 删除，见 3.16。）
- **`currentLedgerBoundaryAudit.test.ts` 的对应断言改为检查 `load_transaction_group_summaries_with_special_status`，而不是删除。** 基础版删除后，该断言检查的「非时间维度分组 RPC 只读取 active 成员可访问的目标账本」仍然成立且有意义，改为指向实际使用的函数。
- **pgTAP 构造多账户数据曾用测试辅助函数 `tests.replace_transaction_payments_in_transition`。** 过渡期内 `validate_transaction_record_payments` 是延迟约束触发器，在 pgTAP 最终回滚的事务中不会触发，因此可以直接替换付款明细构造多账户记录。PR 2 已删除该辅助函数，多账户数据改用正式 RPC `create_transaction` 写入（见 3.14）。
- **`transaction_item_special_status_statistics.test.sql` 中按账户分组的 4 个断言改为「按分类分组 + 账户筛选」。** 这些断言验证的是业务净额口径；按账户分组自本 PR 起改为付款明细的实际收付（2.1），业务净额口径改在分类维度验证。
- **编辑表单读取普通记录的币种改为取首个付款账户。** 为满足「普通记录路径不再读明细 `account_id`」，`transactionFormService` 的明细金额格式化不再读明细账户镜像；表单的多账户 UI 仍属于 #915。
- **按 `transaction_record_id` 分组的工具函数移到 `utils/collections.ts` 的 `groupByKey`。** 上下文、分组 builder 与列表行都需要按记录分组明细和付款明细，抽成通用函数共用。
- **验收后的修正：列表行按所在分组计算金额，与组合计一致。** PR 1 的列表行不接收分组维度（行金额只由筛选条件决定），出现条件 1 下组头是命中明细全额，组内行却是本账户份额与「共同支付 · 整笔」，与 2.4「主金额统一来自 `resolveRecordLevelContribution`，与组合计一致」不符。现在组内列表行带上所在分组（`groupBy` + `groupKey`），组头与行共用 `resolveSharedPaymentAmountBasis` 判断口径：
  - 有账户筛选 + 按分类 / 大分类 / 特殊状态分组（出现条件 1）：多账户记录的组内行金额为命中该组的明细全额，下方显示「共同支付 · 本账户 ¥X / 整笔 ¥Y」（#909 追加 2 起只显示「共同支付 · 整笔 ¥Y」，见 3.16）。例：筛选我的账户 + 按分类，住院费组内行 8 万，治疗费组内行 4 万。单账户记录维持现状。
  - 按账户分组（有无筛选都一样）：多账户记录在每个账户组内显示该账户的付款金额（`balance_delta` 的绝对值），下方显示「共同支付 · 整笔 ¥Y」，因此 `record_total_amount` 在按账户分组时也给出。例：无筛选按账户分组，我的账户组内行 5 万、妻子账户组内行 7 万。组头的金额本身就是付款金额，不显示共同支付提示。
  - 其他情况不变：记录级维度显示份额，有其他明细级筛选时显示命中明细全额。搜索结果、仪表盘等不按组展开的列表不传分组。
- **验收后的修正：#915 之前多账户记录不能用现有表单编辑。** 现有编辑表单不提交 `paymentAccountId`，`parseTransactionPayments` 回落为首个账户付全额，直接保存会删除其他付款账户并挪动余额。编辑视图对付款明细 ≥ 2 行的普通记录返回 `editRestriction: "multiAccount"`，与含已归档账户的记录一样整体只读，提示「多账户记录暂不支持编辑，请等待后续版本」，但保留删除入口。服务端兜底：普通编辑、类型转换（含转为转账）与受控关联编辑在原记录付款明细 ≥ 2 行、提交的付款明细不足 2 行时拒绝保存，错误码 `payment_multi_account_edit_unsupported`（`ValidationError`）。两处都在 #915 开放多账户表单后移除（已移除，见 3.15）。

### 3.14 子 Issue 4 PR 2 实现注记（#914）

PR 2 执行 3.3 的「结束条件」：新增 migration `20261019150000_end_transaction_payment_transition.sql`，普通记录明细的 `account_id` 回填为 NULL，`transaction_item.account_id` 改为 nullable，删除镜像校验与单行限制，更新 `transaction_item` 的 INSERT / UPDATE RLS policy；seed 加入多账户示例。对本节以上内容的补充如下：

- **明细账户的形态由 `validate_transaction_item_category_shape` 立即校验，错误码 `transaction_item_account_invalid`（`23514`）。** 与 `balance_delta` 的 `transaction_item_balance_delta_invalid` 放在同一个触发器：普通记录必须为 NULL，转账 / 余额调整必须非空。触发器的监听列加上 `account_id`。延迟触发器 `validate_transaction_record_payments` 不再需要监听明细的 `account_id`，从监听列中移除。
- **`payment_transition_invalid` 随镜像校验一起删除**（数据库与 TS 的错误码、提示文案、Repository 分支和测试）。3.2 表中该行只描述过渡期。
- **RPC 写明细前先执行 `transaction_payment_account_ids` 校验付款账户。** 过渡期内创建 / 编辑 / 类型转换在写明细前取镜像账户，顺带完成付款账户校验；去掉镜像后保留这一步，`account_invalid` 等错误仍先于明细相关错误抛出，报错顺序不变。
- **回填用普通 `UPDATE`。** 参照 #911，生产环境尚无真实交易数据，不分批。
- **测试辅助函数保留「明细带 `account_id`」的入参形态。** 约 30 个 pgTAP 文件与 seed 经 `tests.insert_normal_transaction_items` 写普通明细；现在 JSON 中的 `account_id` 登记到本地表 `tests.normal_item_payment_account`（明细本身写 NULL），再据此重建付款明细，避免逐个改写测试数据。改付款账户用 `tests.set_normal_transaction_payment_account`。多账户数据一律经正式 RPC 写入（`transaction_payment.test.sql` 的多账户段、`split_payment_group_summaries.test.sql` 的医院示例）。
- **TS 的 `TransactionItemDbRow.account_id` 改为 `string | null`。** 转账 / 余额调整读取明细账户统一经 `requireItemAccountId`（`recordAccounts.ts`），普通记录路径只读付款明细。
- **seed 示例：** 新增账户「🎁 Amazon 礼品卡」（`other`，用户一持有），Amazon「礼品卡 2000 + 📗 Amazon 信用卡 1500」；医院 12 万（商家「圣巴拿巴医院」）由用户一的「📘 Debit」付 5 万、用户二的「📕 Debit」付 7 万。seed 没有「住院费」分类，医院示例用「💉 治疗费 4 万 + 🏥 检查费 8 万」代替 2.1 的「治疗费 4 万 + 住院费 8 万」，金额结构与验收例子一致。

### 3.15 子 Issue 5 实现注记（#915）

表单开放多账户，对本节以上内容与 4.3 的补充如下：

- **多账户提交契约：多账户时不提交 `accountId`。** 单账户只提交 `accountId`；多账户只提交 `paymentAccountId[]` / `paymentAmount[]`，两者同时出现时 `schema.ts` 返回 `account_invalid`，同一信息只有一个来源。付款账户仍先于明细解析，账户错误的提示优先级与单账户一致。转账仍要求 `accountId`。选这一种而不是「`accountId` = 首行账户」，是因为后者需要再校验两处是否一致，且首行被删除、重排时容易出现不一致；HTTP JSON API（3.10）不受影响。
- **编辑视图（普通记录）去掉 `initialValues.accountId`，改由 `payments[0]` 提供首个账户。** 两者重复，表单只读 `payments`。付款金额按记录币种用 `formatEditableAmount` 格式化（JPY 的 `500.00` 回填为 `500`），与明细金额一致；`linkedTransactionEditService` 比较付款明细时按金额数值比较，不受格式影响。
- **记录版本隐藏字段。** 编辑视图返回 `expectedRecordUpdatedAt`（`transaction_record.updated_at`），`TransactionForm` 渲染同名隐藏字段，字段名与 `linkedEditInput.ts` 共用常量，已关联编辑的记录级乐观锁端到端生效；普通编辑路径照常忽略该字段。
- **状态拆分。** `useTransactionPaymentFields`（放在 `TransactionPaymentFields/` 下）管理付款行，多账户由行数派生；`useTransactionForm` 只负责与明细、关联候选的联动（首个付款账户决定记录币种，切换时沿用原来的关联币种检查）、提交禁用与提交前校验。
- **对账与校验。** 对账条按最小单位求和；差额 = 明细合计 − 付款合计，显示绝对值。金额留空或格式不正确的行按 0 计入付款合计，不平衡时禁用保存；平衡但仍有空行、未选账户或含收入明细时，提交前由 `validateTransactionPayments`（与 Service 同一函数）给出字段错误并阻止保存，不自动收起付款明细。含收入明细的提示沿用已有文案「含收入明细的记录只能选择一个付款账户。」。
- **「添加付款账户」入口。** 有收入明细时不显示；没有其他可选的同币种账户时显示为禁用。已归档账户不在表单选项中，含已归档付款账户的记录整笔只读（已决事项第 11 条），表单无需另行处理。删除首行时第二行成为首个付款账户。
- **编辑页切换到另一个收支类型面板时只保留首个付款账户。** 该面板的明细清空重填，而多账户只支持支出明细；转为转账时转出账户取首个付款账户。
- **保存前汇总。** 多账户时账户一栏显示「首个账户 等 N 个账户」，与列表的方案 B 一致。
- **移除 3.13 的临时保护。** 删除 `editRestriction: "multiAccount"`、`requireMultiAccountPaymentsKept`、错误码 `payment_multi_account_edit_unsupported` 及其文案和测试；「不能编辑」提示页恢复为不带删除入口，编辑页的删除按钮恢复为页面内实现（`TransactionDeleteAction` 与 `hasAnyLinkedIncomeItem` 只剩一个调用方，一并内联）。多账户 → 单账户由用户在表单中删到 1 行显式完成。

### 3.16 #909 追加 2 实现注记

#909（按账户持有人筛选 / 分组）合并后人工确认发现两个问题，维护者决定如下（2026-10-27）：

- **「共同支付」标识不再显示份额。** 明细级维度（或记录级维度 + 其他明细级筛选）下主金额是命中明细全额，而份额 X 是整笔记录的份额，不是该明细的份额，会出现「治疗费组 4 万，却写 ¥5 万」、同一个 5 万在多个分类组重复出现的情况。列表行一律显示「共同支付 · 整笔 ¥Y」，组头显示「含共同支付 N 笔 · 整笔 ¥Y」；记录级维度（主金额 = 份额）的显示不变。随之删除：
  - #940 的份额主体（`sharedPaymentSubject` 经 `Transactions → TransactionMonthList → TransactionGroupList → TransactionRowLink → TransactionRow` 的传递链、`resolveSharedPaymentSubject`、文案 `currentAccountSubject` / `accountShareAndRecordTotal`）；
  - 列表行字段 `account_share_amount`（只用于该文案，主金额由 `resolveRecordLevelContribution` 计算，不依赖它）；
  - 组头字段 `sharedPayment.accountShareAmount`，以及 RPC 返回列 `shared_payment_account_share_amount`（新 migration `20261027090000_category_group_summaries_exclude_transfer.sql` 重建函数）。
- **按大分类 / 小分类分组只纳入普通记录。** 转账、余额调整的明细没有分类，原来归入「未知大分类 / 未知小分类」组且金额为 0，像是数据错误。现在 SQL（同一个 migration）与 TS（`isExcludedFromCategoryGroups`，分组 builder 与组内明细匹配共用）都不把它们放进分类组；普通记录的明细缺分类时「未知」组照常保留。其他分组维度不受影响。
- **不改：** 已关联退款收入在分类分组中计 0（「其他收入 ¥0」）是 #605 的既有规则，保持现状。

## 4. 受影响的 RPC / Service / UI 清单

下表列出现有引用 `transaction_item.account_id`（及普通记录的 `balance_delta`）的位置和改法。「子」列对应第 6 节的子 Issue 编号。

### 4.1 数据库函数 / 触发器 / 视图

| 对象                                                                                                                                                              | 改法                                                                                                                                                                                                                                                                                                                                                                                                           | 子  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `create_transaction` / `create_transaction_locked_impl`                                                                                                           | `p_account_id` → `p_payments`（3.4），余额按 3.5。原有的 ledger 锁条件（含关联 / 特殊状态时才锁）不变。                                                                                                                                                                                                                                                                                                        | 1   |
| `update_transaction` / `update_transaction_locked_impl`                                                                                                           | 同上。不再逐条明细回滚 / 应用余额，改为按账户差额。保存明细时，过渡期写镜像 `account_id`，最终状态写 NULL。                                                                                                                                                                                                                                                                                                    | 1   |
| `convert_transaction_type` / `_locked_impl` / `_with_special_status`                                                                                              | `p_account_id` → `p_payments`。旧账户集合 = 付款明细（普通记录）或明细账户（转账）。转账目标分支不变。                                                                                                                                                                                                                                                                                                         | 1   |
| `void_transaction_locked_impl`                                                                                                                                    | 普通记录按付款明细回滚，账户锁集合改为付款账户；转账 / 余额调整分支不变。                                                                                                                                                                                                                                                                                                                                      | 1   |
| `update_linked_transaction_edit`                                                                                                                                  | `p_item_updates[]` 去掉 `accountId`；新增 `p_payments jsonb`，以及 `p_expected_record_updated_at timestamptz`（与 `transaction_record.updated_at` 比较，不一致时返回 `transaction_item_version_conflict`，整体回滚）。付款明细的替换和余额差额应用复用 `update_transaction` 抽出的内部函数 `replace_transaction_payments(...)`，不复制余额逻辑。                                                               | 1   |
| `update_linked_transaction_item` / `_locked_impl`                                                                                                                 | 去掉 `p_account_id`。明细级只改金额 / 分类；余额不再在这里处理，改由付款明细的替换处理（母项金额变化也会改变 `Σ明细`，所以同一事务必须同时提交新的付款明细，否则在 `payment_total_mismatch` 处失败）。账户行锁从这里移到记录级的付款替换。原注释「退款要求同账户」已过时（#899），一并修正。单独调用改金额必然失败，公开 RPC 撤销 authenticated 的执行权限，只由 `update_linked_transaction_edit` 在内部调用。 | 1   |
| `apply_transaction_item_links`                                                                                                                                    | 收入明细和目标明细的币种，由 `join account on ti.account_id` 改为 `transaction_record_currency(...)`。错误码 `refund_currency_mismatch` / `reimbursement_currency_mismatch` 不变。                                                                                                                                                                                                                             | 1   |
| `validate_transaction_item_reimbursement_link`（触发器）                                                                                                          | 同上，币种改为看付款账户。                                                                                                                                                                                                                                                                                                                                                                                     | 1   |
| `validate_linked_transaction_item_mutation`（触发器）                                                                                                             | 删除 `new.account_id is distinct from old.account_id` 分支（普通记录明细不再有账户）；关联记录的币种一致性改由 3.2 的延迟检查在付款明细变化时校验。触发器的监听列 `UPDATE OF amount, account_id, category_id` 去掉 `account_id`。                                                                                                                                                                              | 1   |
| `validate_transaction_item_category_shape`（触发器）                                                                                                              | 扩展为按记录类型校验 `account_id` / `balance_delta` 的形态（3.3）。                                                                                                                                                                                                                                                                                                                                            | 1/4 |
| `transaction_item_with_refund`（视图）                                                                                                                            | 列不变（`account_id` / `balance_delta` 对普通记录变成 NULL）。普通记录的读取方改用付款明细。                                                                                                                                                                                                                                                                                                                   | 4   |
| `load_transaction_group_summaries_with_special_status`、`load_transaction_group_summaries`                                                                        | 见 2.3。                                                                                                                                                                                                                                                                                                                                                                                                       | 4   |
| 新增 `transaction_payment`、`transaction_account_movement`、`validate_transaction_record_payments`、`transaction_record_currency`、`replace_transaction_payments` | 见第 3 节。                                                                                                                                                                                                                                                                                                                                                                                                    | 1   |
| `delete_ledger`                                                                                                                                                   | 先删 `transaction_payment`（3.7）。                                                                                                                                                                                                                                                                                                                                                                            | 1   |
| 转账 RPC、余额调整 RPC、`record_account_initial_balance`、`guard_balance_adjustment_*`                                                                            | **不改**。                                                                                                                                                                                                                                                                                                                                                                                                     | –   |

### 4.2 后端（`src/internal/**`）

| 位置                                                                                                                  | 改法                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 子  |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `db-types.ts`                                                                                                         | 重新生成：新增表 / 视图，RPC 参数变化。                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 1   |
| `transaction/entity/`                                                                                                 | 新增公共类型 `TransactionPayment = { accountId: string; amount: string \| null }`（`amount` 为 null 表示单账户、由 RPC 推导）。前端表单、Service、Repository 都会用到，属于 `entity/` 的范畴。                                                                                                                                                                                                                                                                                                             | 2   |
| `transactionRepository.ts`                                                                                            | `CreateNormalTransactionInput` / `UpdateNormalTransactionInput` / `ConvertTransactionInput` 的 `accountId` → `payments`；`createNormal` / `updateNormal` / `convert` 传 `p_payments`。子 Issue 1 先以 `[{ accountId }]` 适配，保持行为不变。新增 `listPayments(ledgerId, recordIds, page?)`，分块方式与 `listItems` 相同，供列表、编辑视图、导出共用。`loadDashboardRecentlyUsedAccountIds` 改读 `transaction_account_movement`。新 RPC code 加入 `transactionRpcErrorCodes`，并映射到 `ValidationError`。 | 1/2 |
| `linkedTransactionItemRepository.ts`                                                                                  | 读取不再选 `account_id`；保存传 `p_payments` 和记录版本。                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 2   |
| `transactionIncomeLinkRepository.ts`                                                                                  | 关联对方的 `accountId` / 币种改为对方记录的付款明细（首个账户 + 记录币种）。                                                                                                                                                                                                                                                                                                                                                                                                                               | 2   |
| `schema.ts`                                                                                                           | `validateTransactionForm` 的普通记录分支：没有 `paymentAccountId` 时沿用 `accountId`（单账户）；有 `paymentAccountId[]` / `paymentAmount[]` 时解析多账户（≥ 2 行，金额必填、≥ 0）。转账分支不变。                                                                                                                                                                                                                                                                                                          | 2   |
| `errors.ts`                                                                                                           | 新增 `paymentAccountDuplicate`、`paymentTotalMismatch`、`paymentMultiAccountNotAllowed`、`paymentCurrencyMismatch`、`paymentAmountRequired` 等错误码和安全文案（单一权威定义）。                                                                                                                                                                                                                                                                                                                           | 2   |
| `transactionService.ts`                                                                                               | `createNormal` / `updateNormal` / `convert` 在调用 Repository 前执行与数据库相同的业务校验（第二道防线）：账户去重、归档、同币种、多行时全部为支出明细、合计相等（用分为单位的整数比较，复用 `refundAllocation` 的 minor-unit 工具）。这组校验抽成 `util/` 中的纯函数 `validateTransactionPayments`，前端 hook 复用同一函数。`requireActiveTransactionAccounts` 的「已有账户」改为读付款明细。                                                                                                             | 2   |
| `linkedTransactionEditService.ts`                                                                                     | `accountChanged` 改为比较付款明细（账户集合、顺序、金额任一变化即为变化），仍属于「需要同步确认」的字段（与 #574 现行规则一致；付款明细只要求币种一致、不影响关联金额，但改为免确认属于 #574 规则变更，本 Issue 不做）。新旧付款币种不同时，沿用现有的币种不一致拒绝；记录版本冲突映射为 `ConflictError`。                                                                                                                                                                                                 | 2   |
| `service/read/transactionFormService.ts`                                                                              | 编辑视图的 `initialValues.accountId` → `initialValues.payments`（按 `sort_order`）。`hasArchivedAccount` 改为看付款明细（任一已归档即只读，现状语义）。明细 `currency` 改为记录币种。                                                                                                                                                                                                                                                                                                                      | 2   |
| `adapter/next/actions.ts`、`linkedEditInput.ts`                                                                       | 透传 `payments`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 2   |
| `transactionImportService.ts`、`dataImport/service/dataImportExecutionService.ts`                                     | 导入格式不变（不在本 Issue 范围内），只把内部调用的 `accountId` 适配为 `payments: [{ accountId, amount: null }]`。原表标注子 1，但 3.9 已记录 #911 将 Repository 输入类型改造推迟到子 Issue 2（`CreateNormalTransactionInput` 等仍为 `accountId`），实际改动随 Repository 输入类型一起落在子 2；`dataImportExecutionService.ts` 构造的 `ImportNormalTransactionInput` 本身不变，不需要改动。                                                                                                               | 2   |
| `util/buildTransactionListItem.ts`                                                                                    | 普通记录的 `account_name` / `account_color` / `account_currency` 来自付款明细：1 行时与现在一致；≥ 2 行时显示名按方案 B 拼接（首个账户的现有显示名 +「等 N 个账户」，文案集中在 `transactionFallbackLabels` 或模块级常量），颜色取首个账户。`categoryItems[].accountId` 删除（见 `TransactionGroupList`）。转账 / 余额调整分支不变。                                                                                                                                                                       | 4   |
| `util/grouping/*`、`transactionGroupBuilder.ts`、`service/read/groupLoaders.ts`、`service/read/transactionContext.ts` | 见 2.3。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 4   |
| `service/transactionExportQueryService.ts`、`entity/transactionExportRecord.ts`                                       | 普通记录的 `items[].accountId` 删除；`TransactionExportRecord` 新增 `payments: { accountId; amount; balanceDelta }[]`。转账 / 余额调整仍由 `items[].accountId` 表达。                                                                                                                                                                                                                                                                                                                                      | 3   |
| `dataExport/service/dataExportService.ts`                                                                             | 收集导出账户 ID 时同时取 `payments[].accountId`。                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 3   |
| 余额调整（`balanceAdjustment.ts`、相关 Service / Repository）                                                         | **不改**，单账户，语义不变。                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | –   |
| 转账（`createTransfer` / `updateTransfer`、`TransferTransactionForm`）                                                | **不改**。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | –   |

### 4.3 前端

| 位置                                                                                                                           | 改法                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 子  |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `TransactionForm/useTransactionForm.ts`、`TransactionForm.types.ts`                                                            | `selectedAccountId` 扩展为 `payments` 状态（`{ key, accountId, amount }[]`），`mode = payments.length > 1 ? "multi" : "single"` 由数组长度派生，不另设状态。点「添加付款账户」展开为多账户时，第一行金额预填当前的明细合计（单账户时它实际承担的金额；编辑已有记录时就是数据库里的值），新增行金额留空；之后不再自动计算。删到 1 行自动回到单账户（丢弃该行金额）。对账数据由明细合计与付款合计派生，`submitDisabled` 合并「不平衡」条件。币种取首个付款账户的币种，退款 / 报销候选的币种校验同样使用它（替换现在的 `selectedAccount.currency`）。业务校验复用 `validateTransactionPayments`。                              | 5   |
| 新组件 `organisms/transactions/TransactionPaymentFields/`（组件 + `useTransactionPaymentFields.ts`（如需要）+ test + stories） | 单账户：渲染现有的账户选择，外加一个「添加付款账户」文字按钮（`AddIcon`），有收入明细时不显示。已经是多账户时仍允许在明细里选收入分类，但提交时由 `validateTransactionPayments` 在表单内提示「含收入明细的记录只能选择一个账户」并阻止保存，不自动收起付款明细（避免静默丢失输入）。多账户：每行是账户选择（已选账户、已归档账户、与首行币种不同的账户不可选）、金额输入、删除按钮（`DeleteOutlineIcon`），下方是对账条「付款合计 X / 明细合计 Y」，不平衡时显示差额并用 `error` 色。表单提交字段：单账户 `accountId`；多账户 `paymentAccountId[]` + `paymentAmount[]`（不提交 `accountId`，见 3.15）。文案集中到模块常量。 | 5   |
| `TransactionForm.tsx`、`templates/transactions/TransactionFormPage.tsx`                                                        | 用 `TransactionPaymentFields` 替换现有账户字段，编辑页用 `initialValues.payments` 初始化。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 5   |
| `TransactionGroupList/TransactionGroupList.tsx`                                                                                | Picker 候选的 `accountId` 不再取自明细；候选只需要 `accountCurrency`（记录币种）来判断是否可选。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 4   |
| 交易列表行（`TransactionListItem` 系列）                                                                                       | 只消费 `account_name`，方案 B 的拼接在 `buildTransactionListItem` 完成，组件不改；Storybook 新增多账户 story。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 4   |
| `templates/transactions/TransactionFilterDialog.tsx`、`transactionFilterUtils.ts`                                              | 筛选 UI 不变（仍选一个账户），只是后端语义改为「付款明细包含该账户」。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | –   |
| `utils/dataExportWorkbook.ts`                                                                                                  | 见第 4.4 节。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 3   |

### 4.4 导入导出格式（#921）

- 只输出「收支」「转账」「余额变更」三个工作表，不再输出「付款明细」sheet。列定义与导入共用 `incomeExpenseColumns`。
- 单账户格式与 #913 之前一致，付款金额必须留空。只有导出含多账户记录时才增加可选列「付款金额」，否则连表头也不输出。
- 多账户记录仅允许全部为支出明细、付款账户同币种：首行的「账户」「账户持有人」「账户类型」「付款金额」用分号按付款顺序一一对应，个数必须一致。例如账户「礼品卡；信用卡」、持有人「；小明」、类型「其他；信用卡」、付款金额「2000；1500」。账户币种只填写一个；「金额」仍是每条分类明细的金额。
- 导入接受中英文分号，拆分后去掉首尾空格，保留持有人的空位置；持有人整格留空表示全部无持有人。导出统一使用中文分号并保留付款数组顺序。账户名含分号时拒绝导出并提示；导入按分隔符解析后不符合规则时报行错误，不做名称转义。
- 非空「账单关联」相同的所有行合并成一笔，每行的收支由分类决定，允许单账户记录收支混合。共享字段由首行提供，后续行填写「-」或原样复述；多账户导出的后续行账户四列和付款金额为「-」。账单关联为空的行各自独立。
- 复用 `validateTransactionPayments` 校验账户不重复、同币种、全支出、付款金额非负（含 0）及付款合计等于支出合计。每个账户独立复用名称、币种、类型、持有人匹配与映射、新建逻辑。
- `create_transaction_locked_impl` 的 `p_type` 接受 expense / income / normal，只作普通记录类型入口校验；记录存为 normal，明细收支由分类决定。App 表单提交当前所选 expense / income 并可带混合明细；导入按收入减支出的净额推导（正数 income、负数 expense；零净额含支出时 expense，纯收入时 income），查重金额取净额绝对值，不取首行类型。
- #914 解除过渡期单付款行限制之前，多账户写入用 Service mock 验证（PR 2 起补充真实导入 Service → 交易 Service → 仓储链路的测试，以及按导入入参形态经 `create_transaction` 写入的 pgTAP）；格式、校验、导出和单账户收支混合往返可以先验证。退款 / 报销关联关系及待报销状态仍不在导入导出范围内。
- 转账 / 余额调整格式保持不变。不认识的 sheet 继续忽略，无需兼容曾经的「付款明细」sheet。

### 4.5 #836「按商家推荐账户」的影响（只记录，不实现）

#836 计划按「某商家最近 20 次交易」推荐前 3 个账户。付款明细上线后：

- 账户来源必须是 `transaction_account_movement`（或付款明细），不能读 `transaction_item.account_id`（最终状态下普通记录为 NULL）。
- 需要在 #836 中确定：一笔多账户记录对每个付款账户各计 1 次，还是按金额加权；金额为 0 的付款行是否计入；推荐结果是单个账户还是「账户组合」。本 Issue 只提供数据，不决定这些问题。

### 4.6 #909「按账户持有人统计」的影响（只记录，不实现）

[#909](https://github.com/toushobun/kuranote/issues/909) 计划让交易统计支持按账户持有人筛选和分组（例：退款进入我的礼品卡时，我 = −5 万 + 1 万 = −4 万）。它以 `transaction_account_movement` 为基础，按持有人汇总各账户的实际收付，不需要分摊。因此本 Issue 的视图需要能支撑这种汇总：保留 `account_id` 和 `balance_delta`，可以直接连接 `account_holder` 按持有人聚合，不在视图里预先过滤或合并账户。具体的视图扩展和统计实现在 #909 中完成，不在本 Issue 实现。

## 5. 已决事项记录

初稿第 5 节「未决事项」的 12 条已于 2026-10-15 经维护者确认，结论已写入正文对应章节。第 13 条起是之后的追加确认。此处只留一句话记录，方便追溯。

1. 统计口径采用方案 D：筛选账户时，多账户记录在记录级维度下取该账户的付款份额，明细级维度显示明细全额并标识「共同支付」（第 2 节）。（2026-10-15，维护者确认）
2. 基础版 `load_transaction_group_summaries` 已无调用方，删除（2.3、子 Issue 4）。（2026-10-15，维护者确认）
3. 按账户分组时，单账户记录（含退款 / 报销收入侧）同样取实际收付金额；余额不变，收入 / 支出两列拆分变化（2.1、2.2）。（2026-10-15，维护者确认）
4. 已关联编辑增加 `p_expected_record_updated_at` 记录版本校验，普通编辑保持现状（3.1、4.1）。（2026-10-15，维护者确认）
5. 付款明细的任何变化在已关联编辑中仍需「同步修改关联数据」确认（4.2）。（2026-10-15，维护者确认）
6. 最初使用独立「付款明细」sheet（2026-10-15）；维护者评审后认为普通用户难以理解，#921 改为「收支」sheet 内分号格式（3.12、4.4）。
7. 展开多账户时第一行金额预填明细合计，新增行留空（4.3）。（2026-10-15，维护者确认）
8. 「有交易的账户禁止改币种」另开 Issue，作为子 Issue 4 合并前的前置条件（3.2、第 6 节）。（2026-10-15，维护者确认）
9. 转账 / 余额调整不迁入付款明细表，用 `transaction_account_movement` 视图统一读取（3.3）。（2026-10-15，维护者确认）
10. 子 Issue 1 的 migration 附带幂等的本地库回填（3.8）。（2026-10-15，维护者确认）
11. 含已归档付款账户的记录保持整笔只读（3.5）。（2026-10-15，维护者确认）
12. 有收入明细时不显示「添加付款账户」；多账户状态下选了收入分类时提交报错并阻止保存，不自动收起（4.3）。（2026-10-15，维护者确认）
13. 「筛选账户 + 其他明细级筛选」时金额为明细全额，多账户记录必须带「共同支付」标识，并显示该账户出资份额和整笔金额（#909 追加 2 改为只显示整笔金额，见 3.16）；标识样式以设计图为准，设计图确定是子 Issue 4 UI 部分开工的前置条件（2.1、2.4、第 6 节）。（2026-10-15，维护者确认）
14. 按账户持有人统计另开 #909，不在本 Issue 范围内；本 Issue 中「筛选单个账户只看该账户自己的收付」的规则不变（2.1、4.6）。（2026-10-15，维护者确认）

## 6. 子 Issue 拆分方案

按 AI_RULES 的 PR 规则：每个子 Issue 一个 PR，都以 `main` 为 base、独立通过 CI，不堆叠。后一个子 Issue 等前一个合并后再从最新 `main` 开分支。另有两个本 Issue 之外的关联 Issue：「有交易的账户禁止改币种」（子 Issue 4 合并前必须完成）和「导入支持付款明细 sheet」（子 Issue 3 完成时创建，优先级高）。顺序与建议方向相比做了一处调整：**表单 UI 放到最后**。原因是只有所有读取方（列表、统计、导出）都认识付款明细、过渡期结束后，才能允许保存多账户记录；否则 `main` 上会出现「能保存多账户，但列表 / 导出显示错误」的窗口。表单 UI 可以提前并行开发，但最后合并。

| #   | 标题                                                 | label                   | 范围                                                                                                                                                                                                                                                                                                                                                                                                                       | 依赖                                                                                      | 验收要点                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `feat: 新增交易付款明细表并改为按付款明细更新余额`   | `enhancement`           | migration：`transaction_payment`、`transaction_account_movement`、`validate_transaction_record_payments`、`transaction_record_currency`、`replace_transaction_payments`；改写 4.1 中标记为 1 的全部函数；进入过渡期（单行限制 + 账户镜像）；`delete_ledger`、seed、pgTAP helper；db-types 重新生成；Repository 与导入调用以 `[{ accountId }]` 适配；`docs/database-schema.md`、`docs/security-definer-functions.md` 同步。 | –                                                                                         | 单账户创建 / 编辑 / 删除 / 类型转换 / 已关联编辑的余额与现在一致；余额只来自付款明细；pgTAP 覆盖：不变量各错误码、多行在过渡期被拒、多账户锁顺序的双会话无死锁（参照 `issue_574_pr1_concurrency.sh`）、失败整体回滚、币种校验改看付款账户、`delete_ledger` 清理；`npm run check` 与 `db:schema:snapshot:check` 通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2   | `feat: Service 与表单解析支持付款明细并补充校验`     | `enhancement`           | `entity` 新增 `TransactionPayment`；`schema.ts` 解析多账户字段；`errors.ts`；`validateTransactionPayments` 纯函数；`transactionService` / `linkedTransactionEditService` / `transactionFormService` / Repository 读写付款明细（`listPayments`）；已关联编辑的记录版本。                                                                                                                                                    | 1                                                                                         | Service 单测覆盖第 1 节的每条校验（≥ 0、0 行保留、重复、合计、归档、同币种、含收入）；编辑视图返回 `payments`；已关联编辑的确认 / 冲突路径（`linkedTransactionEditFlow.integration.test.tsx` 扩展）；由于过渡期限制，多账户在端到端层仍被数据库拒绝，Service 层用 mock 验证。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3   | `feat: 导出增加付款明细 sheet`                       | `enhancement`           | `transactionExportQueryService`、`TransactionExportRecord`、`dataExportService`、`dataExportWorkbook` 按 4.4 调整；普通记录不再读明细 `account_id`。                                                                                                                                                                                                                                                                       | 1、2                                                                                      | 单账户记录导出后用现有导入可以原样导入；「付款明细」sheet 的行数和金额与数据库一致；导入忽略新 sheet；多账户记录在「收支」sheet 的账户列为空。**备注：** 含多账户记录的导出文件无法用现有导入还原，备份还原会受影响。本子 Issue 完成时另开 Issue「导入支持付款明细 sheet」（优先级高）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4   | `feat: 交易列表显示多账户并按付款明细筛选和分组账户` | `enhancement`、`design` | 列表方案 B 与「共同支付」标识（2.4）；Picker 候选改用记录币种；`load_transaction_group_summaries_with_special_status` 和 TS grouping 按 2.3 实现方案 D；删除基础版 `load_transaction_group_summaries`；最近使用账户；**结束过渡期**的 migration（普通记录明细 `account_id` 置 NULL、类型约束、解除单行限制、更新 RLS policy）；seed 加多账户示例。                                                                         | 1、2、3，以及「有交易的账户禁止改币种」Issue；UI 部分开工前需「共同支付」标识的设计图确定 | pgTAP（RPC）与 TS（grouping / builder）各自覆盖以下例子，用医院 12 万（治疗费 4 万 + 住院费 8 万；我 5 万、妻子 7 万）：无筛选按月 = 12 万；无筛选按分类 = 住院费 8 万、治疗费 4 万；按账户分组 = 我 5 万、妻子 7 万；**筛选我的账户 + 按月 = 5 万**；筛选我的账户 + 按商家 / 成员 = 5 万；**筛选我的账户 + 按分类 = 住院费 8 万、治疗费 4 万，并带「共同支付」标识**（`shared_payment_record_count = 1`）；筛选我的账户 + 按账户分组 = 只有「我的账户」组 5 万；**筛选我的账户 + 分类住院费 + 按月：显示 8 万，并带共同支付标识、我出资 5 万、整笔 12 万**（明细级筛选优先；列表行与组头的 `shared_payment_*` 字段）。单账户记录在各种筛选和分组下与现状一致（含已退款记录的业务净额），只有按账户分组改为实际收付金额（退款收入侧 +R、余额不变）。列表行：单账户显示不变；多账户显示「X 等 N 个账户」，筛选账户时主金额为份额（Storybook）。grep 确认普通记录路径不再读明细 `account_id`。 |
| 5   | `feat: 新建和编辑记账支持添加多个付款账户`           | `enhancement`、`design` | `TransactionPaymentFields` 组件（+ hook / test / stories）；`useTransactionForm` 的付款状态、对账条、提交禁用；编辑页初始化；文案常量。                                                                                                                                                                                                                                                                                    | 1～4                                                                                      | 默认 UI 与现在一致；展开 / 删到 1 行自动收起；新增行金额为空；对账条不平衡时不能保存；已选 / 已归档 / 异币种账户不可选；含收入明细时不显示入口；退款 / 报销候选按记录币种过滤；组件测试与 Storybook（单账户、多账户平衡、不平衡、含 0 金额行）。人工验收：「礼品卡 + 信用卡」「卡 1 + 卡 2」「普通单账户」三个场景（#834 TODO）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

`documentation` 相关内容（`docs/database-schema.md`、`docs/security-definer-functions.md`、本文档的落地注记）随各子 Issue 一起修改，不单独开 Issue。全部子 Issue 合并并通过人工验收后，再在本文档顶部补充「最终落地」注记。
