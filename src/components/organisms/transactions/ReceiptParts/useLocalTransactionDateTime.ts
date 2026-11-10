"use client";
import { useEffect, useState } from "react";

import {
  composeTransactionDateTimeLocalValue,
  formatDateTimeLocalInputValue,
  getNowDateTimeLocalValue,
  splitDateTimeLocalValue,
} from "utils/transactions";

/**
 * 小票的交易时间（账户周转、余额调整）：客户端挂载后按本地时区还原，
 * 没有初始时间时用现在；同时给出提交用的时区偏移。
 */
export function useLocalTransactionDateTime(initialTransactionAt?: string) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeZoneOffsetMinutes, setTimeZoneOffsetMinutes] = useState("");
  useEffect(() => {
    const localValue = initialTransactionAt
      ? formatDateTimeLocalInputValue(initialTransactionAt)
      : getNowDateTimeLocalValue();
    const next = splitDateTimeLocalValue(localValue);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载后同步本地时区时间，避免服务端水合差异。
    setDate(next.date);
    setTime(next.time);
    setTimeZoneOffsetMinutes(String(new Date().getTimezoneOffset()));
  }, [initialTransactionAt]);
  return {
    date,
    time,
    setDate,
    setTime,
    timeZoneOffsetMinutes,
    transactionAtValue: composeTransactionDateTimeLocalValue(date, time),
  };
}
