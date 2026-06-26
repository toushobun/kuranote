# KuraIcon

`KuraIcon` 是 KuraNote 自定义图标资产的第一版基础层。

## 目的

- 统一自定义图标的名称、导出方式和使用入口。
- 先通过 Storybook 展示图标资产，不在本 PR 中替换业务页面。
- 保持图标实现为 React component，避免新增 SVG loader / SVGR 配置。

## 使用方式

```tsx
<KuraIcon name="quickRecord" title="快速记账图标" />
```

## 当前范围

- `quickRecord`：快速记账
- `photoRecord`：拍照记账
- `account`：账户
- `category`：分类
- `tag`：标签
- `merchant`：商家

## 后续

页面接入和替换在 #291 后续 PR 中继续处理。
