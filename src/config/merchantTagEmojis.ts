export const defaultMerchantTagEmoji = "🏷️";

export const merchantTagEmojiGroups = [
  { id: "retail", label: "零售" },
  { id: "food", label: "餐饮" },
  { id: "travel", label: "出行" },
  { id: "service", label: "生活服务" },
] as const;

export const merchantTagEmojiOptions = [
  {
    emoji: "🛒",
    groupId: "retail",
    keywords: ["超市", "采购", "购物"],
    label: "超市",
  },
  {
    emoji: "🏪",
    groupId: "retail",
    keywords: ["便利店", "商店"],
    label: "便利店",
  },
  {
    emoji: "🏬",
    groupId: "retail",
    keywords: ["百货", "商场"],
    label: "百货店",
  },
  {
    emoji: "📦",
    groupId: "retail",
    keywords: ["电商", "网购", "包裹"],
    label: "电商",
  },
  { emoji: "🛍️", groupId: "retail", keywords: ["购物", "零售"], label: "购物" },
  {
    emoji: "💊",
    groupId: "retail",
    keywords: ["药妆", "药店", "医药"],
    label: "药妆店",
  },
  {
    emoji: "👕",
    groupId: "retail",
    keywords: ["服饰", "服装", "衣服"],
    label: "服饰",
  },
  {
    emoji: "🔌",
    groupId: "retail",
    keywords: ["家电", "数码", "电器"],
    label: "家电数码",
  },
  {
    emoji: "🍽️",
    groupId: "food",
    keywords: ["餐饮", "吃饭", "外卖"],
    label: "餐饮",
  },
  {
    emoji: "☕",
    groupId: "food",
    keywords: ["咖啡", "茶饮"],
    label: "咖啡茶饮",
  },
  {
    emoji: "🍰",
    groupId: "food",
    keywords: ["烘焙", "甜品"],
    label: "烘焙甜品",
  },
  {
    emoji: "✈️",
    groupId: "travel",
    keywords: ["旅行", "飞机", "出行"],
    label: "旅行",
  },
  {
    emoji: "🚃",
    groupId: "travel",
    keywords: ["铁路", "电车", "交通"],
    label: "铁路交通",
  },
  { emoji: "🏨", groupId: "travel", keywords: ["酒店", "住宿"], label: "酒店" },
  {
    emoji: "📶",
    groupId: "service",
    keywords: ["通讯", "网络", "订阅"],
    label: "通讯",
  },
  {
    emoji: "🏠",
    groupId: "service",
    keywords: ["生活", "住房", "水电燃气"],
    label: "生活",
  },
  {
    emoji: "🎬",
    groupId: "service",
    keywords: ["订阅", "影音", "会员"],
    label: "订阅服务",
  },
  {
    emoji: "⚡",
    groupId: "service",
    keywords: ["水电燃气", "电费", "燃气费"],
    label: "水电燃气",
  },
  {
    emoji: "🏛️",
    groupId: "service",
    keywords: ["政府", "公共服务", "税费"],
    label: "政府公共服务",
  },
  {
    emoji: "💡",
    groupId: "service",
    keywords: ["电费", "能源"],
    label: "电力",
  },
  {
    emoji: "🏷️",
    groupId: "service",
    keywords: ["默认", "分类", "其他"],
    label: "分类",
  },
] as const;

export const merchantTagEmojiValues: ReadonlySet<string> = new Set(
  merchantTagEmojiOptions.map((option) => option.emoji),
);
