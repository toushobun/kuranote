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

PR2 新增 `/new` 路由，直接组合真实 `TransactionStepFlow`、`ReceiptCreationProvider` 与 AppShell。新增商家／账户的 Server Action 只返回虚构实体，不连接数据库。

PR2 的后退与前进必须点击 Chrome 工具栏按钮。原有 `guard:check` 使用 `page.goBack()` / `page.goForward()` 的脚本用于 PR1 回归，不作为 PR2 工具栏验收的替代。验证代码不调用 `history.back()`；生产守卫确认放弃后的真实离开仍保留该正常实现。

验证布局通过 `ToolbarMetrics` 将只读 JSON 写入隐藏的 `output#toolbar-probe`。`toolbarProbe.ts` 受根目录 TypeScript 检查，记录 URL、窗口滚动、Probe 挂载／卸载、历史条数／Navigation API 索引、基准／哨兵位置、表单实例及字段、弹层 Portal／层级和资源时间线中的 RSC 请求。进入页面后的正常导航／预取稳定后取基线，再比较操作前后的 RSC 请求增量；表单实例号不变表示 DOM 仍被保留。`Probe` 计数用于路由是否重挂载，两者需一起核对。

工具栏验收步骤（开发与生产分别执行）：

1. 来源页滚到 320px，经固定链接进入编辑账户、小票和转账；在表单修改并滚到 2000px，后退 → 继续编辑，连续快速后退 → 继续编辑，最后放弃。确认保护期间表单实例和滚动不变、RSC 无增加，放弃只回来源页一次；前进进入页面不恢复草稿。
2. 进入新增流程首屏，无修改时点 × 直接关闭。关闭后点前进，应回基准且不复活弹层、不弹确认；重新打开不增加多组哨兵。
3. 选择商家进入小票，打开商家抽屉并输入搜索词，再打开新增商家。修改后点击后退，确认只处理商家；继续编辑保留子层输入，放弃只关闭子层，父表单实例、字段和抽屉搜索保持。
4. 再次后退只关商家抽屉，再次后退才确认小票。重复验证新增账户、金额键盘、备注、时间、明细和方式切换抽屉；以各层原有取消语义判断草稿是否保留。
5. 分别验证 ×、遮罩、选择后自动关闭的清理；最终无弹层且页面干净时回到基准，内部 popstate 不派发下一层；点击前进不恢复任何已关闭层。
6. 保存新增商家／账户，确认候选已合并并自动选中，父表单中其他字段不变；成功提示位于弹层之上。检查公共确认框也是 body Portal，层级高于全屏新增层。

当前尚未完成 PR2 工具栏验收与合成截图：Windows computer-use 无法可靠识别 Chrome 当前 URL，安全检查停止了原生工具栏操作。不得将仅通过单元测试或构建视为该验收通过。iPhone／Android 实机验收继续由人工处理。
