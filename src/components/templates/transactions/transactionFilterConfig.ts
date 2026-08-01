import type {
  TransactionFilterRecordType,
  TransactionGroupBy,
  TransactionSpecialStatusFilterValue,
} from "types/transactions";
import {
  transactionBusinessBadgeConfig,
  transactionBusinessBadgeStatuses,
} from "organisms/transactions/TransactionBusinessBadge/transactionBusinessBadgeConfig";

type GroupOption = {
  label: string;
  value: TransactionGroupBy;
};

type RecordTypeOption = {
  label: string;
  value: TransactionFilterRecordType;
};

export const timeGroupOptions = [
  { label: "年", value: "year" },
  { label: "季", value: "quarter" },
  { label: "月", value: "month" },
  { label: "周", value: "week" },
  { label: "日", value: "day" },
] as const satisfies readonly GroupOption[];

export const otherGroupOptions = [
  { label: "大分类", value: "parentCategory" },
  { label: "小分类", value: "category" },
  { label: "账户", value: "account" },
  { label: "商家", value: "merchant" },
  { label: "成员", value: "member" },
  { label: "特殊状态", value: "specialStatus" },
] as const satisfies readonly GroupOption[];

export const recordTypeOptions = [
  { label: "全部", value: "all" },
  { label: "收入", value: "income" },
  { label: "支出", value: "expense" },
  { label: "转账", value: "transfer" },
] as const satisfies readonly RecordTypeOption[];

export const specialStatusFilterOptions = [
  { label: "无特殊状态", value: "none" },
  ...transactionBusinessBadgeStatuses.map((value) => ({
    label: transactionBusinessBadgeConfig[value].label,
    value,
  })),
] satisfies readonly {
  label: string;
  value: TransactionSpecialStatusFilterValue;
}[];
