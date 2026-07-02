# KuraNote Components

## ResultFeedback

`ResultFeedback` 用于统一展示操作后的结果反馈。它覆盖成功、错误、空结果、通知或确认中状态。

旧 `EmptyState` / `ErrorState` 已迁移删除。页面结果反馈统一使用
`ResultFeedback`；`LoadingState` 仅用于读取中或处理中状态。

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

### 设计图参考

#272 的设计图需要参考，但不参考其中 No.2 筛选图。组件默认构成保持为：插图区域 → 标题 → 说明文 → 操作按钮。

PC 端保持中央对齐和最大宽度限制。移动端保持纵向堆叠和充足留白。

### 状态类型

- `success`：操作完成。
- `error`：操作没有完成，需要用户恢复或重试。
- `empty`：没有结果，但不是错误。
- `info`：通知、确认中、处理中。

### 外层形态

- `surface="plain"`：默认形态，用于页面中央、Dialog、已有卡片内部。
- `surface="card"`：带 `SectionCard` 外壳，用于页面区块内的结果反馈。

### 操作按钮

简单场景使用 `actionLabel` / `onAction`。按钮默认是
`outlined`，避免在反馈区域中过度强调。

需要调整按钮强度时传 `actionVariant`。需要多个按钮或特殊布局时传 `action` slot。

### 图标与插图

默认图标会根据 `variant` 自动切换。需要替换圆形图标时传 `icon`。

需要完整替换插图区时传 `illustration`，它优先于 `icon`。

`icon` 与 `illustration`
都是装饰性视觉元素，不应承载额外可访问语义。可访问语义请放在 `title` / `message`
中。

### 布局

组件自身限制内容最大宽度并居中，不依赖页面级 padding 或背景。放入普通页面、Dialog、已有卡片或
`surface="card"` 的区块状态时都应保持一致节奏。
