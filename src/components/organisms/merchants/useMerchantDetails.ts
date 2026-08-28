"use client";

import { useState } from "react";

export function useMerchantDetails({
  name: initialName = "",
  note: initialNote = "",
  websiteUrl: initialWebsiteUrl = "",
}: {
  name?: string;
  note?: string;
  websiteUrl?: string;
} = {}) {
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);

  return { name, note, setName, setNote, setWebsiteUrl, websiteUrl };
}
