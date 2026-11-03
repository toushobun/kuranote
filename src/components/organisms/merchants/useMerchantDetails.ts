"use client";

import { useState } from "react";

export function useMerchantDetails({
  previewIconUrl: initialPreviewIconUrl = "",
  name: initialName = "",
  note: initialNote = "",
  websiteUrl: initialWebsiteUrl = "",
}: {
  previewIconUrl?: string;
  name?: string;
  note?: string;
  websiteUrl?: string;
} = {}) {
  const [previewIconUrl, setPreviewIconUrl] = useState(initialPreviewIconUrl);
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);

  return {
    snapshot: JSON.stringify([name, note, websiteUrl, previewIconUrl]),
    previewIconUrl,
    setPreviewIconUrl,
    name,
    note,
    setName,
    setNote,
    setWebsiteUrl,
    websiteUrl,
  };
}
