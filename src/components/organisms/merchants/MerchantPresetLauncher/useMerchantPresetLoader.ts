"use client";

import { useEffect, useState } from "react";
import { merchantErrorCodes, merchantErrorMessages } from "internal/merchant";
import type {
  MerchantPresetLoadAction,
  MerchantPresetLoadState,
} from "types/merchants";

/** 每次打开重新读取；关闭后忽略仍在执行的请求，避免旧数据覆盖新弹框。 */
export function useMerchantPresetLoader(loadAction: MerchantPresetLoadAction) {
  const [state, setState] = useState<MerchantPresetLoadState>({});
  useEffect(() => {
    let active = true;
    loadAction()
      .then((result) => {
        if (active) setState(result);
      })
      .catch(() => {
        if (active)
          setState({
            error:
              merchantErrorMessages[
                merchantErrorCodes.merchantPresetLoadFailed
              ],
          });
      });
    return () => {
      active = false;
    };
  }, [loadAction]);
  return state;
}
