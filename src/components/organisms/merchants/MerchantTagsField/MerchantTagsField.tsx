"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { merchantText } from "config/merchantText";
import type { MerchantTag } from "types/merchants";

type MerchantTagsFieldProps = {
  initialTagIds?: string[];
  tags: MerchantTag[];
};

export function MerchantTagsField({
  initialTagIds = [],
  tags,
}: MerchantTagsFieldProps) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialTagIds));

  function toggleTag(tagId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  return (
    <Stack spacing={1}>
      <Typography component="span" sx={{ fontWeight: 700 }}>
        {merchantText.tagsLabel}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {merchantText.tagsHelper}
      </Typography>
      {tags.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {tags.map((tag) => {
            const selected = selectedIds.has(tag.id);
            return (
              <Chip
                aria-pressed={selected}
                color={selected ? "primary" : "default"}
                key={tag.id}
                label={`${tag.icon} ${tag.name}`}
                onClick={() => toggleTag(tag.id)}
                variant={selected ? "filled" : "outlined"}
              />
            );
          })}
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="body2">
          暂无可选标签，可在商家管理页新增。
        </Typography>
      )}
      {[...selectedIds].map((tagId) => (
        <input key={tagId} name="tagIds" type="hidden" value={tagId} />
      ))}
    </Stack>
  );
}
