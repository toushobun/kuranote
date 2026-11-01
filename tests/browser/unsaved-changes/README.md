# 未保存离开守卫：真实 Next 兼容性验证

独立验证应用直接引用仓库里的 AccountEdit 与编辑小票组件，使用虚构数据和验证专用 Server Action，不需要登录，不访问生产数据库，也不会加入正式应用的路由。

在仓库根目录执行：

```sh
node node_modules/next/dist/bin/next dev tests/browser/unsaved-changes --port 3097
node tests/browser/unsaved-changes/check.mjs http://localhost:3097
```

生产模式（先停止同一验证应用的 dev 服务）：

```sh
node node_modules/next/dist/bin/next build tests/browser/unsaved-changes
node node_modules/next/dist/bin/next start tests/browser/unsaved-changes --port 3098
node tests/browser/unsaved-changes/check.mjs http://localhost:3098
```

浏览器脚本使用环境提供的 Playwright 和 Chrome，没有增加项目依赖。结果与截图写入 `.next/976-evidence/`。记录 `history.length`、当前历史索引、组件挂载／卸载计数、输入 DOM 是否保持同一个实例、RSC 请求数。RSC 计数在进入编辑页后清零，普通页面导航及真实保存请求会继续累加；哨兵往返阶段必须为零。

开发模式的初始挂载／卸载计数包含 React Strict Mode 重执行；兼容性判断比较操作前后的增量。`history.length` 包含前进分支，后退本身不会减少记录总数。
