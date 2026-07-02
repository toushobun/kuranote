# KuraNote Components

## ResultFeedback

`ResultFeedback` 用于统一展示用户操作后的结果反馈，例如保存成功、操作失败、空结果、通知或确认中状态。

适用范围：

- 页面级结果反馈
- Dialog 内的操作结果
- Card / Section 内的空结果或通知
- 搜索、筛选、保存、删除等操作后的成功 / 错误 / 空状态

不适用范围：

- Toast / Snackbar
- 表单字段级校验错误
- 全局 Error Boundary

### 基本用法

```tsx
import { ResultFeedback } from "molecules/ui/ResultFeedback";

<ResultFeedback
  variant="success"
  title="保存完成"
  message="这次操作已经保存，可以继续下一步。"
  actionLabel="返回列表"
  onAction={handleBack}
/>;
```

### Variant

| variant | 用途 |
| --- | --- |
| `success` | 操作完成、保存成功 |
| `error` | 操作失败、需要重试 |
| `empty` | 搜索或列表没有结果，不视为错误 |
| `info` | 通知、确认中、处理中 |

### Action

简单场景使用 `actionLabel` / `onAction`。按钮默认是 `outlined`，避免反馈组件里的按钮过度抢视觉。

```tsx
<ResultFeedback
  variant="error"
  title="操作没有完成"
  message="请稍后再试。"
  actionLabel="重试"
  onAction={handleRetry}
/>;
```

需要更强或更弱的按钮样式时，可以传 `actionVariant`。

```tsx
<ResultFeedback
  variant="success"
  title="保存完成"
  actionLabel="继续"
  actionVariant="contained"
/>;
```

多个按钮或特殊布局时，使用 `action` slot。

```tsx
<ResultFeedback
  variant="info"
  title="需要确认"
  message="这个操作会影响后续统计。"
  action={
    <Stack direction="row" spacing={1.5}>
      <Button variant="text">取消</Button>
      <Button variant="contained">继续</Button>
    </Stack>
  }
/>;
```

### Icon

默认图标会根据 `variant` 自动切换。需要业务图标时可传入 `icon`，组件仍保留统一的柔和插图区块、居中宽度和间距。

```tsx
<ResultFeedback
  variant="empty"
  title="没有找到相关记录"
  message="换一个条件再试试。"
  icon={<SearchRoundedIcon />}
/>;
```

### 布局注意

组件自身限制最大宽度并居中，不依赖页面级 padding 或背景。放入 `SectionCard`、Dialog、普通页面区域时都应保持一致节奏。
