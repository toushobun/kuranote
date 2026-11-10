"use client";
import { useRef, useState } from "react";

/**
 * 小票「点保存后才标红」（#1016 / #1040）：点保存时记录当时的问题快照，
 * 提示条与内联红标只显示快照中仍未解决的问题；之后新出现的问题等下一次保存才显示。
 * 再次点保存时提示条闪一下，有问题时滚动到第一条提示。
 */
export function useReceiptIssueCheck() {
  const [checkedKeys, setCheckedKeys] = useState<readonly string[]>([]);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const firstIssueRef = useRef<HTMLDivElement>(null);
  return {
    isChecked: (key: string) => checkedKeys.includes(key),
    pulseCount,
    firstIssueRef,
    /** 点保存时调用：记录当前所有问题的标识；`scroll` 为 true 时滚动到第一条提示。 */
    check(keys: readonly string[], scroll: boolean) {
      setCheckedKeys(keys);
      setSaveAttempts((attempts) => attempts + 1);
      if (saveAttempts > 0) setPulseCount((count) => count + 1);
      if (!scroll) return;
      // 第一条提示挂载后再滚动；底部提交与退出弹窗提交共用此入口。
      window.setTimeout(() => {
        firstIssueRef.current?.scrollIntoView?.({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
    },
  };
}
