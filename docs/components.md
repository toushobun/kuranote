# KuraNote Components

## ResultFeedback

`ResultFeedback` 用于统一展示操作后的结果反馈。它覆盖成功、错误、空结果、通知或确认中状态。

### Usage

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

### Design reference

#272 的设计图需要参考，但不参考其中 No.2 筛选图。

组件默认构成保持为：插图区域 → 标题 → 说明文 → 操作按钮。

PC 端保持中央对齐和最大宽度限制。移动端保持纵向堆叠和充足留白。

### Variants

- `success`：操作完成。
- `error`：操作没有完成，需要用户恢复或重试。
- `empty`：没有结果，但不是错误。
- `info`：通知、确认中、处理中。

### Actions

简单场景使用 `actionLabel` / `onAction`。按钮默认是 `outlined`，避免在反馈区域中过度强调。

需要调整按钮强度时传 `actionVariant`。需要多个按钮或特殊布局时传 `action` slot。

### Icon

默认图标会根据 `variant` 自动切换。需要业务图标或贴近具体设计稿时传 `icon`，组件仍保留统一的柔和插图区块、居中宽度和间距。

### Layout

组件自身限制最大宽度并居中，不依赖页面级 padding 或背景。放入 `SectionCard`、Dialog、普通页面区域时都应保持一致节奏。
