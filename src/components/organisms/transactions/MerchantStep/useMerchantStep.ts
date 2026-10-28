"use client";
import { useState } from "react";
import type { MerchantStepProps } from "./MerchantStep.types";

export function useMerchantStep({
  merchants,
  frequentMerchants,
}: Pick<MerchantStepProps, "merchants" | "frequentMerchants">) {
  const [search, setSearch] = useState("");
  const [tagId, setTagId] = useState<string | null>(null);
  const keyword = search.trim();
  const filtered = merchants.filter(
    (item) =>
      (!tagId || item.tags.some((tag) => tag.id === tagId)) &&
      item.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
  );
  const frequent = frequentMerchants.flatMap((item) =>
    merchants.filter((merchant) => merchant.id === item.merchantId),
  );
  return { search, setSearch, tagId, setTagId, keyword, filtered, frequent };
}
