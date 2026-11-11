import { useRef, useState } from "react";

import type { TransactionTimeGroupViewData } from "types/transactions";

/** 关联选择器首次打开才取候选；同一个选择器实例反复打开复用首屏。 */
export function useLazyTransactionLinkView(
  loadInitialViewAction?: () => Promise<TransactionTimeGroupViewData>,
) {
  const [view, setView] = useState<TransactionTimeGroupViewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = () => {
    if (view || loadingRef.current || !loadInitialViewAction) return;

    loadingRef.current = true;
    setIsLoading(true);
    void loadInitialViewAction()
      .then(setView)
      .catch(() => {
        // 失败态由选择器现有的错误文案呈现；下次打开或点击重试重新读取。
      })
      .finally(() => {
        loadingRef.current = false;
        setIsLoading(false);
      });
  };

  return { view, isLoading, load };
}
