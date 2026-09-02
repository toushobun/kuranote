"use client";

import {
  categoryEmojiGroups,
  categoryEmojiOptions,
} from "config/categoryEmojis";
import { EmojiIconField } from "molecules/ui/EmojiIconField/EmojiIconField";

type CategoryIconFieldProps = {
  onChange: (emoji: string) => void;
  value: string;
};

export function CategoryIconField({ onChange, value }: CategoryIconFieldProps) {
  return (
    <EmojiIconField
      fieldLabel="分类图标"
      groups={categoryEmojiGroups}
      helperText="从内置图标库中选择，方便在记账时快速识别分类。"
      inputName="iconName"
      onChange={onChange}
      options={categoryEmojiOptions}
      searchPlaceholder="例如：咖啡、交通、宝宝"
      value={value}
    />
  );
}
