# 未保存离开守卫：真实 Next 兼容性验证

独立验证应用直接引用仓库里的 AccountEdit、编辑小票、编辑转账和真实 AppShell，使用虚构数据与验证专用 Server Action。它不需要登录、不访问生产数据库、不加入正式应用的路由。

验证应用也提供底部导航的静态目标页及空的商家记账建议 API，让真实 AppShell 的生产预取与组件初始化请求正常完成；这些测试路由不属于正式应用。

所有页面代码均为 TypeScript，组件 props 同时受根目录 `tsc --noEmit` 和验证目录 tsconfig 检查。现有 CI 的 Type check 会覆盖这些文件；浏览器验证脚本使用环境提供的 Playwright 和 Chrome，不新增 npm 依赖。

在仓库根目录启动开发模式，然后在另一个终端执行检查：

```sh
npm run guard:dev
npm run guard:check
```

生产模式（先停止验证应用的 dev 服务）：

```sh
npm run guard:build
npm run guard:start
npm run guard:check -- http://localhost:3098
```

`guard:dev` / `guard:build` 会创建指向仓库 public 的本地目录链接，使 AppShell 使用真实图标与静态资源；生成的链接已忽略，不提交复制的资源。`guard:check` 先检查验证应用类型，再执行 Playwright。Storybook 构建与本地静态服务启动后，可用 `npm run guard:storybook -- http://127.0.0.1:6006` 验证三个现有页面 story。

## 验证内容

- AppShell 包含真实底部导航、`useScrollTopOnPathnameChange` 和 z-index 为 1 的 main；验证对话框通过 body Portal 显示。
- 后退、前进使用 `page.goBack()` / `page.goForward()`，不以 `evaluate(history.back)` 代替浏览器导航。
- 账户在 200px 首次修改，继续滚到 2000px 后验证后退取消、还原字段、重新修改、失效哨兵前进、保存失败的清理与恢复。记录每一步的 scrollX/Y、scrollRestoration 和期间的 scroll 事件；内部往返不应出现中间跳动。
- 在来源页 320px 点击固定验证入口，先断言点击本身没有触发自动滚动；放弃后必须恢复 320px，普通跳转与保存成功应回到顶部。固定入口只存在于测试页，底部导航来自 AppShell。
- 账户、小票、转账都验证实际 Next 路由中的后退取消、放弃、原组件实例与历史数量。金额／明细选择器草稿的语义仍由对应单元测试覆盖。
- 为防止 Playwright 自动将屏幕外字段滚入视口掩盖回归，还原账户字段通过原生 value setter 和 input 事件触发。刷新仍验证原生 beforeunload 提示。

结果和截图默认写入 `.next/976-evidence/`，可通过 `UNSAVED_GUARD_OUTPUT` 指定目录。JSON 记录按账户、小票、转账分组，包括 history.length、当前索引、挂载／卸载计数、表单 DOM 是否保留、RSC 请求数和滚动信息。进入页面并等待正常导航／预取稳定后才清零 RSC 计数；之后哨兵往返阶段必须为零。

开发模式初始的挂载／卸载包含 Strict Mode 重执行；只比较操作前后的增量。history.length 包含前进分支，后退本身不会减少记录数。保护有效时只将内部基准／哨兵设为 manual；还原为干净状态、真正离开或成功保存时恢复原模式，来源页的记录保持原生恢复。

## PR2 工具栏验收

PR2 新增 `/new` 路由，直接使用真实 `NewTransactionStepFlow`（包括 × 的跳转回调、商家建议与 `MerchantPresetLauncher`）、`ReceiptCreationProvider` 与 AppShell。`/new?empty=1` 使用无商家的初始数据覆盖常用商家全屏层。新增商家／账户的 Server Action 只返回虚构实体，不连接数据库。

PR2 的后退与前进必须点击 Chrome 工具栏按钮。原有 `guard:check` 使用 `page.goBack()` / `page.goForward()` 的脚本用于 PR1 回归，不作为 PR2 工具栏验收的替代。验证代码不调用 `history.back()`；生产守卫确认放弃后的真实离开仍保留该正常实现。

验证布局通过 `ToolbarMetrics` 将只读 JSON 写入隐藏的 `output#toolbar-probe`。`toolbarProbe.ts` 受根目录 TypeScript 检查，记录 URL、窗口滚动、Probe 挂载／卸载、历史条数／Navigation API 索引、基准／哨兵位置、表单实例及字段、弹层 Portal／层级和资源时间线中的 RSC 请求。进入页面后的正常导航／预取稳定后取基线，再比较操作前后的 RSC 请求增量；表单实例号不变表示 DOM 仍被保留。`Probe` 计数用于路由是否重挂载，两者需一起核对。

工具栏验收步骤（开发与生产分别执行）：

1. 来源页滚到 320px，经固定链接进入编辑账户、小票和转账；在表单修改并滚到 2000px，后退 → 继续编辑，连续快速后退 → 继续编辑，最后放弃。确认保护期间表单实例和滚动不变、RSC 无增加，放弃只回来源页一次；前进进入页面不恢复草稿。
2. 进入新增流程首屏，无修改时不压哨兵；工具栏后退必须返回真正来源页，不能 push 明细页。× 保留页面原有跳到明细的语义。选商家后仍在等待建议时关闭不弹确认；进入小票后才保护可保存的表单。页面放弃后只后退一次，前进重新进入时是初始内容。
3. 选择商家进入小票，打开商家抽屉并输入搜索词，再打开新增商家。修改后点击后退，确认只处理商家；继续编辑保留子层输入，放弃只关闭子层，父表单实例、字段和抽屉搜索保持。
4. 再次后退只关商家抽屉，再次后退才确认小票。重复验证新增账户、金额键盘、备注、时间、明细和方式切换抽屉；无商家首屏同时验证常用商家读取中及读取完成后的全屏层。以各层原有取消语义判断草稿是否保留。
5. 分别验证 ×、遮罩、选择后自动关闭的清理；最终无弹层且页面干净时回到基准，内部 popstate 不派发下一层；点击前进不恢复任何已关闭层。
6. 保存新增商家／账户，确认候选已合并并自动选中，父表单中其他字段不变；成功提示位于弹层之上。检查公共确认框也是 body Portal，层级高于全屏新增层。

## PR2 第 1 轮工具栏验收结果

维护者实际点击 Chrome 工具栏，代理准备表单并采集只读指标；本轮没有用脚本后退／前进替代工具栏操作。开发模式复核时重启服务，并停止并发的应用／Storybook 构建。生产模式独立构建运行，均套真实 AppShell。

| 模式／场景                                             | 确认前后窗口滚动                            | 内部操作重挂载／RSC 增量     | 场景内 history.length |
| ------------------------------------------------------ | ------------------------------------------- | ---------------------------- | --------------------- |
| 开发：编辑账户／小票金额键盘／转账                     | 1345.33／0／1072px 保持；放弃恢复来源 736px | 0／0                         | 25                    |
| 生产：编辑账户／小票商家抽屉／转账                     | 1345.33／0／1072px 保持；放弃恢复来源 736px | 0／0                         | 21                    |
| 开发：新增商家子层确认、继续、快速后退、放弃、抽屉关闭 | 0px                                         | 0／0，父表单实例和搜索词保留 | 10                    |
| 生产：新增商家子层、抽屉和父小票后退                   | 0px                                         | 0／0，父表单实例和备注保留   | 21                    |
| 生产：常用商家全屏层 UI 关闭、前进和后退               | 0px                                         | 0／0，父首屏保留             | 23                    |

表格统计同 URL 的确认／关闭操作；真正页面离开会卸载页面，并可能请求页面或预取资源。生产新增小票最后放弃回来源时 RSC 从 14 增至 22，子层和抽屉操作期间保持 14。history.length 包含此前测试及前进分支，仅比较本场景变化；Navigation API 索引按当前源可见记录计。

另已验证：干净新增首屏后退回真实来源；修改后放弃只真正返回一次；第一次前进进入初始首屏，第二次前进跳过失效记录，不恢复旧小票或弹层；商家／账户通过自身确认框保存后自动选中，父备注及实例保留。确认框为 body Portal，1560 高于新增全屏层 1520；成功提示完全显示时 opacity 为 1、body Portal、z-index 为 1580。

编辑页共享抽屉继续保持 PR1 页面后退语义；计算器自己的关闭按钮只关计算器。金额草稿、实时多账户输入、加载中预设层及其他编辑抽屉的细分取消／dirty 规则由 Vitest 覆盖，不以桌面抽样代替全量组件测试。

早期缺少来源、热更新／并发构建会话中的失败与诊断记录也保留，未用作通过依据。工具栏验收发现的正常前进被吞和旧 URL 登记参与新页保护已修正并补回归。

- [合成截图](https://raw.githubusercontent.com/toushobun/kuranote/7c4d3b11cc77fddb389c91a209d0d93779b62a82/976-pr2-review1-toolbar.jpg)
- [开发原始记录与失败尝试](https://github.com/toushobun/kuranote/blob/7c4d3b11cc77fddb389c91a209d0d93779b62a82/976-pr2-review1-development.json)
- [生产原始记录](https://github.com/toushobun/kuranote/blob/7c4d3b11cc77fddb389c91a209d0d93779b62a82/976-pr2-review1-production.json)

证据提交在 screenshots/976 分支，业务实现为 051fdcc68。iPhone／Android 实机验收继续由人工处理。

## PR2 第 3 轮补充场景

验证应用的 `/new?empty=1` 提供模拟预设成功的 Server Action。成功时以内联状态关闭弹层，并为当前 **同一个** `NewTransactionStepFlow` 客户端实例补入测试商家；不强制重新挂载。这用来覆盖同页成功后仍然要保护新小票的情形。

开发模式、生产模式分别从来源页进入验证，并通过 **Chrome 工具栏** 的后退按钮完成以下检查（不能把 Vitest 或 `page.goBack()` 当作工具栏实测）：

1. 新增首屏打开「切换方式」，选择「账户周转」；确认先清理哨兵再替换 URL，之后工具栏后退一次直接返回来源页，不落入失效的新增首屏。
2. 从来源页进入 `/new?empty=1`，点击「从预设添加」，选择模板并提交成功；确认弹层关闭、仍在新增页、商家选项已更新、页面实例未重新挂载。
3. 在同一个页面选择商家进入小票，编辑可保存字段（如备注），再点击工具栏后退；必须弹「尚未保存」，「继续编辑」保留内容，「放弃修改」只回来源页一次。
4. 对比操作前后的 `toolbar-probe`：记下 URL、history 条数／索引、base/sentinel、组件挂载／卸载和 RSC 请求数。保存原始记录，并在 PR 正文补上真实结果后才勾选相应验收项。

### 第 3 轮工具栏验收结果

维护者实际点击 Chrome 工具栏后退，代理操作页面内容（含确认框按钮）并采集只读指标；验证脚本不发起后退或前进。基于 `f9ccba5e9`，开发与生产模式分别执行。

| 模式 | 切换方式后退         | 预设成功后的 URL／挂载          | 小票后退 RSC 增量 | 继续编辑                                  | 放弃                 |
| ---- | -------------------- | ------------------------------- | ----------------- | ----------------------------------------- | -------------------- |
| 开发 | 一次回来源页，索引 0 | 同页，mounts 2／unmounts 1 不变 | 0（2→2）          | 备注与表单实例保留，history.length 4 不变 | 一次回来源页，索引 0 |
| 生产 | 一次回来源页，索引 0 | 同页，mounts 1／unmounts 0 不变 | 0（14→14）        | 备注与表单实例保留，history.length 4 不变 | 一次回来源页，索引 0 |

开发模式从 404 页后退到首页时，`output#toolbar-probe` 存在但内容为空（原因未查明，生产模式无此现象）。首轮因断言读取 probe 索引而记为失败，此后改由 Navigation API 读取索引并单独补采；两份记录都保留。

修复前预演发现：`router.refresh()` 经 Next 的 HistoryUpdater 重写当前记录，丢弃自定义 state，抹掉基准标记后守卫后退失效（开发模式直接离开，生产模式后退被吞）。Vitest 当时 mock 了 refresh，未能覆盖；现由 `nextReplaceState` 模拟。预演使用 `page.goBack()`，只用于诊断，不作为工具栏证据。

- [开发原始记录](https://github.com/toushobun/kuranote/tree/5f7337a9c84aa4cf68b470448b68dfd76c53dcde/976-pr2-round3/toolbar-dev) · [开发切换方式补采](https://github.com/toushobun/kuranote/tree/5f7337a9c84aa4cf68b470448b68dfd76c53dcde/976-pr2-round3/toolbar-dev-retake-A) · [生产原始记录](https://github.com/toushobun/kuranote/tree/5f7337a9c84aa4cf68b470448b68dfd76c53dcde/976-pr2-round3/toolbar-prod)
- 修复前失败记录：[开发](https://github.com/toushobun/kuranote/tree/5f7337a9c84aa4cf68b470448b68dfd76c53dcde/976-pr2-round3/pre-fix-rehearsal-dev) · [生产](https://github.com/toushobun/kuranote/tree/5f7337a9c84aa4cf68b470448b68dfd76c53dcde/976-pr2-round3/pre-fix-rehearsal-prod)

上面第 1 轮的截图和 JSON 只代表第 1 轮。iPhone／Android 实机验收继续由人工处理。

## PR3 验证范围与表单语义

- `/merchant-create`、`/merchant-edit` 直接使用新增商家和 MerchantEdit 真实组件，沿用 AppShell、底部导航及滚动恢复；Server Action 使用虚构数据，不访问生产数据库。
- `guard:check` 在开发与生产模式同时检查商家页连续三次后退取消：2000px 滚动保持、表单 DOM 不变、挂载/卸载计数不变、内部导航 RSC 增量为 0，历史仅增加一个哨兵。放弃只返回来源页一次并恢复 320px。
- MerchantEdit 的基本资料和标签共用一个提交表单，别名是另一个表单。两个提交区都有修改时确认框只提供继续编辑和放弃；只有一个提交区 dirty 时，保存提交该表单。
- 有别名草稿时直接保存基本资料，服务端返回同页成功状态并 revalidate；成功只更新该表单的基线，其他草稿仍保护。验证应用执行真实 Next revalidation，再检查后退、滚动、实例和 RSC。
- 标准新增页只保护当前面板，隐藏面板保留输入但不参与确认；切回时按原始快照恢复保护。Vitest 覆盖面板切换、对应保存目标、改回原值和未确认金额草稿。
- 编辑小票显式启用与新增小票相同的弹层栈，PR2 中“编辑页不启用”的说明属于当时记录。Vitest 验证逐层返回，子层放弃保留父小票和抽屉搜索，父页最终只真正返回一次。
- 验证布局中的公共空白填充块仅提供长页滚动空间，禁用其自身的 overflow anchoring，避免异步返回时把测试填充误当成跨路由锚点。真实 AppShell 的滚动实现保持不变。

Next 在同页 revalidation 后会使可见 Link 重新预取，关闭确认框时恢复显示的底部导航也可能触发预取。因此 JSON 同时记录总 RSC、`next-router-prefetch` 请求和真正路由请求，分别报告；不能把正常预取误记为守卫触发的同 URL 路由加载。

JSON 输出仍为 `compatibility.json`，新增 `merchantCreate`、`merchantEdit` 分组。生产验证可用 `UNSAVED_GUARD_OUTPUT` 指向独立目录，保留两种模式的原始结果。

## PR3 第 1 轮 review 补充

新增 `/standard`（含 `?type=income`）、`/new-transfer`、`/account-create`、`/category`、`/balance`，直接组合真实标准记账页、转账页、账户页、分类列表和余额调整表单。`/transactions/new` 提供真实切换方式后的目标，避免只验证一个不存在的路由。

`guard:check` 增加以下自动化场景：

- 标准支出／收入切换到转账再切回，连续三次后退取消；核对滚动、表单实例、单哨兵及内部路由 RSC。随后放弃草稿并切换记账方式，后退一次返回来源。
- 新增账户／转账先后退关闭金额键盘，再连续三次后退取消，最后放弃只回来源一次。
- 编辑小票有草稿时先后退关闭商家抽屉，再后退确认父页；分类编辑放弃只关抽屉，前进不复活，真实保存成功不离开分类列表。
- 余额调整先关闭时间层，再确认父页；商家别名单独 dirty 时，从确认框保存后继续原来的后退／链接动作。

默认运行全部分组；调试单组可设置 `UNSAVED_GUARD_CASES=standard,newAccount`。输出仍为 `compatibility.json`，分组包括既有 PR1 回归与上述新增场景。

本轮开发模式自动化已跑通。生产模式新增场景、PR2 两项原生 Chrome 工具栏操作以及手机实机统一留到最终验收，不能用这里的 Playwright 导航替代工具栏验收。上文历史验证结果只代表各自标注的源码版本。

## #987 账本设置、分类创建与账本创建向导

使用既有 Chrome / Playwright 脚本，设置 `UNSAVED_GUARD_CASES=categoryCreate,ledgerSettings,ledgerSetup` 可只运行以下场景：

- 分类创建：后退先关闭选择菜单，继续编辑保留输入，放弃只关闭新增对话框，前进不恢复已关闭弹层。验证通过公共对话框提交的成功与失败。
- 账本设置：成员保存触发真实 Next `revalidatePath` 后，账本草稿仍受保护。验证账本保存失败后的后退，以及确认保存成功后返回来源。
- 创建向导：从虚构的已保存进度恢复到账户步骤，后退按新增账户和账户步骤的顺序处理。放弃当前输入后重新打开仍能恢复进度，干净关闭沿用「稍后再继续？」提示。
