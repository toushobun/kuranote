# Issue #551：明细级特殊状态设计

> [!IMPORTANT]
> 本文档保留 Issue #551 当时的设计决策，仅用于历史追溯。以下关于报销 / 退款关联的数据结构、Picker、状态流转、业务净额、冻结编辑和账本开关的设计，已经由 #572 / #598 的实现取代；#574 继续负责已关联交易的受控编辑、确认式同步、解除 / 重建关联、清理流程与并发保护。当前开发不得再以本文中的 `settled_by_item_id`、报销多选、退款单选等旧模型作为实现依据，应以最新 migration、schema snapshot 及上述 Issue 为准。

## 目标与边界

解决"一笔支出之后被报销 / 被退款，钱不再是自己真正花掉的"这个记账场景。核心原则：
原始消费记录不能被抹掉或改写（用户既要看到"当时花了多少"，也要看到"后来报销 /
退款了多少"），报销和退款的状态流转由程序在关联发生时自动完成，不允许用户手动
把一条明细直接标成"已报销"或"已退款"。

报销和退款是两个不同的用户心智，采用不同机制：

- **报销**：花钱当下就知道这笔以后要走报销流程，所以支出记账时可以提前打勾
  "待报销"；报销到账时，在记收入的页面里关联对应的"待报销"明细，明细自动变成
  "已报销"。
- **退款**：往往是买完之后才决定要退，没法要求提前标记。所以退款不要求支出侧
  做任何提前操作，而是在记录退款收入时，直接从历史明细里搜索并关联要退款的
  那一条。

这一版设计替换了之前"5 选项状态标签 / 支持不计入支出"的方案。

## 明细行展示与编辑

### 支出明细

- "状态标签"不再是多选，只有一个可勾选项：**待报销**。取消之前的"待退款"
  "不计入支出"选项，这两个语义分别被"退款关联"机制和产品范围收窄取代。
- UI 上是一个简单的 Checkbox（或等效的单开关），不需要 RadioGroup、不需要
  "折叠再展开"的交互——本来就只有一个选项，折叠反而多一次点击。
- 勾选后 `special_status = pending_reimbursement`；取消勾选清空为 `NULL`。
- 展示位置沿用 `TransactionItemsSection` 金额下方的徽标位置：有 `pending_reimbursement`
  时显示"待报销"徽标，被关联报销后自动变成"已报销"徽标；两者都由
  `TransactionBusinessBadge` 渲染。

### 收入明细

选中收入类分类后，`TransactionItemPickerDrawer` 内新增两个区块（原来"状态
标签"所在的位置）：

- **报销关联**：列出当前账本里所有 `special_status = pending_reimbursement`
  的明细，多选。这是一个数量有限的过滤集合，做成抽屉内嵌的可展开列表就够，
  不需要单独开一个新页面（交互上可以参考"选择更多分类"那种展开态，但内容
  是明细列表而不是分类树）。
- **退款关联**：从当前账本的历史支出明细里搜索并选择一条要退款的记录，单选。
  这个不受"待报销"之类的预先标记限制，任意一条支出明细都可以被选中。因为
  要在全部历史里翻找，量级和"报销关联"不是一个数量级，需要独立的检索页面，
  见下面"退款关联选择器"一节。

选中并确认后：

- 报销关联：这笔收入创建的同时，把被选中的每条明细的 `special_status` 从
  `pending_reimbursement` 自动改成 `reimbursed`，写入关联字段。用户不能在
  任何界面手动把状态直接设成"已报销"。
- 退款关联：写入一条退款关联记录（金额 = 这笔收入的金额），不改变被关联明细
  的 `special_status`，而是让被关联明细所在的**整张交易记录**重新计算合计
  金额（见"退款对合计金额的影响"一节）。

## 退款关联选择器

这是本次唯一需要新建的独立页面/大弹层，其余都是在已有的"添加明细"抽屉里做
区块级别的增补。

不从零设计，直接复用现成的明细浏览能力：

- 复用 `TransactionMonthList` / `TransactionGroupList`（`/transactions` 页面
  用的按月分组浏览）和 `TransactionSearch`（`/transactions/search` 的搜索）
  这两套已有组件，做成一个"选择模式"：进入这个弹层时按月分组浏览或者直接
  搜索，但点击一行不是跳转去编辑，而是把这一行选中并关闭弹层、把结果带回
  收入明细的"退款关联"区块。
- 列表只展示支出类型的明细（收入、转账不可能被"退款"）。
- 每一行除了原有的金额、分类、日期信息，额外展示"剩余可退金额"（原始金额 −
  已经被退过的金额总和），方便用户判断这一条还能不能继续退、还能退多少。
- 已经退完（剩余可退金额为 0）的明细在列表里置灰或者不可选，避免选中一条
  没法再退的记录。

## 退款对合计金额的影响

退款不复用报销那套"改状态 + 从统计里排除"的逻辑，而是直接影响这笔支出所在
**整张交易记录**（`transaction_record`，即一次记账里可能包含多条明细的那笔
"大账单"）的展示金额：

- 原始明细的 `amount` 字段永远不变，作为"当时确实花了这么多钱"的历史事实。
- 交易列表 / 明细展示需要同时看到两个数字：**退款前总金额**（该交易记录
  下所有明细金额之和，不受退款影响）和**退款后金额**（退款前总金额 − 该交易
  记录下所有明细已退款金额之和）。两个数字都要看得到，不能只留退款后的、
  把原始记录"抹平"。
- **实现落地时的调整**：编辑页对已关联报销/退款的交易采用整体只读拦截
  （`canEdit = false`，展示 `TransactionPermissionDenied`），不单独渲染
  "退款前/退款后"金额明细区块；这两个数字目前只在交易列表/分组汇总
  （`TransactionItemsSection`、`TransactionGroupList`）里以"已退款 ¥X"
  标注的形式呈现。原因：金额、账户、分类一旦关联即冻结，编辑页本身没有
  可操作项，团队评估后认为"整体只读 + 引导返回列表查看金额"比"半开放的
  只读表单"更简单、出错面更小，代价是编辑页本身不重复展示这两个数字。
  如果后续要在编辑页也展示只读金额明细，作为独立的 follow-up 处理。
- 月度汇总、Dashboard、账户余额等统计口径，使用"退款后金额"参与计算，
  避免多算已经拿回来的钱；明细本身在列表里仍然完整显示原始金额 + 一个
  "已退款 ¥X" 的小标注（不是 `TransactionBusinessBadge` 的一个新状态，是
  基于退款关联记录金额计算出来的展示文案，因为退款可能是分批的，用金额
  标注比用一个固定徽标更准确）。

## 数据结构设计

放弃"一个字段承载 5 种状态"的模型，拆成两套独立机制：

### 报销

| 项目                              | 设计                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transaction_item.special_status` | 专用 enum `transaction_item_special_status`，只保留两个值：`pending_reimbursement`、`reimbursed`                                                      |
| 默认值                            | `NULL`（无待报销标记）                                                                                                                                |
| 自动流转字段                      | 新增 `settled_by_item_id`，可空，自引用 `transaction_item.id`，指向完成报销的那笔收入明细；多对一（一笔报销收入可以结清多条待报销明细）               |
| 写入权限                          | `pending_reimbursement` 由用户在支出明细里手动勾选／取消；`reimbursed` 只能由报销关联流程在同一个数据库事务里写入，不对外暴露可以直接设置这个值的入口 |

不再需要 `pending_refund`、`refunded`、`excluded` 这三个枚举值，`excluded`
（不计入支出）本轮范围里整体去掉，不做了。

### 退款

新增一张关联表，而不是单个字段，因为需要记录"退了多少钱"这个数值，并且要
支持一条明细未来被多笔退款分批关联（先退一部分，商家之后又补退一部分）：

```sql
create table transaction_item_refund_link (
    id uuid primary key default gen_random_uuid(),
    ledger_id uuid not null,
    refunded_item_id uuid not null references transaction_item(id),
    refund_income_item_id uuid not null references transaction_item(id),
    refund_amount numeric(14,2) not null check (refund_amount > 0),
    created_by uuid,
    created_at timestamptz not null default now()
);
```

- 校验规则：写入前检查 `refund_amount` 不超过 `refunded_item_id` 这条明细的
  剩余可退金额（原始金额 − 已有退款记录金额之和），超过直接拒绝，不允许退成
  负数支出。
- "退款前 / 退款后总金额"通过这张表实时聚合计算，不额外冗余存储在
  `transaction_record` 上，避免两处数据不同步。

### 关于 `discount_amount`

数据库里已经有 `transaction_item.discount_amount` 和
`transaction_record.discount_allocation_method` 这两个字段，从迁移历史看是
当年为"购物折扣"预留的，但翻查现在的代码，没有任何业务逻辑或 UI 在用它们，
是完全空转的字段。评估后**不复用**它们来做退款：字段语义写的是"下单当下就
定好的优惠"，跟"事后关联一笔独立退款收入"不是一回事，硬复用会让字段名和
实际用途对不上，以后不好维护。如果以后确实要做真正的购物折扣功能，再单独
设计。

### 账本级开关

`transaction_item_special_status_enabled boolean not null default false`，
账本 owner / admin 可改，其他成员只读。

**实现落地时的调整**：关闭开关时，如果账本内还存在 `active` 且
`special_status is not null` 的明细（待报销或已报销），数据库触发器
（`prevent_disable_special_status_with_active_items`）会直接拒绝关闭，
而不是"隐藏入口但保留数据"。原因：一旦隐藏入口，这些明细的报销/退款状态
就没有正常 UI 路径可以再查看或处理，相当于让数据卡在一个无法触达的中间态；
先禁止关闭、要求用户显式处理完存量数据（结清报销或等退款走完流程）后再关闭，
比"允许关闭但留下够不到的数据"更安全。account 侧没有历史数据时可以正常关闭。
如果后续要支持"允许关闭但保留数据只读可见"，需要先设计这些数据在入口隐藏后
的可访问路径，作为独立 follow-up 处理。

## 筛选与分组

- 明细筛选新增"待报销""已报销"两个选项（不再有"待退款""已退款""不计入
  支出""无特殊状态"）。
- 退款不参与这套筛选，因为退款不是一个状态，是金额层面的调整；如果要看
  "哪些交易被退过款"，走单独的"有退款记录"筛选项，展示时带出退款前 / 后
  金额。

## 空、加载、错误状态

- 支出的"待报销"勾选框：无特殊逻辑，跟普通表单字段一致。
- 报销关联列表为空（账本里没有任何待报销明细）：显示引导文案，不展示空
  列表框。
- 退款关联选择器：复用 `TransactionMonthList` / `TransactionSearch` 现有的
  空状态、加载态（skeleton）、错误态处理，不用重新设计一套。
- 保存失败：沿用 `BaseActionState` 和 `FailureFeedbackDialog`。

## 组件拆分

- `TransactionBusinessBadge`：保留，但状态收窄为"待报销""已报销"两种。
- 原 `TransactionSpecialStatusSelector`（5 选项 RadioGroup）废弃，替换为
  一个简单的"待报销"勾选组件（可以就是复用 MUI `Checkbox`/`FormControlLabel`，
  不需要单独抽出很重的组件）。
- 新增 `TransactionReimbursementLinkPicker`：收入明细里"报销关联"的内嵌列表。
- 新增 `TransactionRefundLinkPicker`（或类似命名）：包一层"选择模式"，内部
  复用 `TransactionMonthList` / `TransactionGroupList` / `TransactionSearch`。
- `TransactionItemsSection`：明细行展示"待报销 / 已报销"徽标 + 有退款记录时
  展示"已退款 ¥X"标注。
- 交易记录详情 / 编辑页：新增"退款前总金额 / 退款后金额"的展示区块。
- `LedgerSpecialStatusSetting`：不变。

## 页面 / 弹层清单

真正需要新建的界面只有一个，其余是在已有两个入口上做区块级增补：

1. **支出的添加 / 编辑明细抽屉**（已有 `TransactionItemPickerDrawer`）——
   增补：一个"待报销"勾选框。
2. **收入的添加 / 编辑明细抽屉**（同一个组件）——增补："报销关联"内嵌列表
   - "退款关联"入口。
3. **报销关联列表**——是第 2 项里的一个可展开区块，不是独立页面。
4. **退款关联选择器**——唯一的新页面/大弹层，复用月份分组浏览 + 搜索组件
   做成选择模式。
5. **交易记录详情 / 编辑页**——增补退款前 / 后总金额的展示，不是新页面。

## 本 Issue 不包含，需另开实现 Issue

- Supabase migration：`transaction_item_special_status` enum 收窄、
  `settled_by_item_id`、`transaction_item_refund_link` 表、约束和 RLS。
- Server Action / Service / Repository 的报销关联、退款关联读写逻辑（含
  事务性的状态自动流转、退款金额校验）。
- 退款关联选择器对现有 `TransactionMonthList` / `TransactionGroupList` /
  `TransactionSearch` 的"选择模式"改造。
- 交易记录详情 / 编辑页退款前 / 后金额的实际展示改动。
- 统计口径（月度汇总、Dashboard、账户余额）改用"退款后金额"参与计算的
  实际代码改动。
- 上述持久化与统计逻辑对应的 Repository / Service / Router / RSC 测试。
