"use client";

import {
  merchantTagEmojiGroups,
  merchantTagEmojiOptions,
} from "config/merchantTagEmojis";
import { EmojiIconField } from "molecules/ui/EmojiIconField/EmojiIconField";

type MerchantTagIconFieldProps = {
  onChange: (emoji: string) => void;
  value: string;
};

export function MerchantTagIconField({
  onChange,
  value,
}: MerchantTagIconFieldProps) {
  return (
    <EmojiIconField
      fieldLabel="标签图标"
      groups={merchantTagEmojiGroups}
      helperText="选择能代表商家业态的 Emoji，方便快速筛选。"
      inputName="icon"
      onChange={onChange}
      options={merchantTagEmojiOptions}
      searchPlaceholder="例如：超市、餐饮、旅行"
      value={value}
    />
  );
}
