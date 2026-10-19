import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type TransactionSharedPaymentNoteProps = {
  label: string;
};

/**
 * 「共同支付」提示：金额下方一行小号次要文字 + 小图标，右对齐，空间不够时换行。
 * 只用中性色，不用收支的红 / 绿。列表行与组头共用。
 */
export function TransactionSharedPaymentNote({
  label,
}: TransactionSharedPaymentNoteProps) {
  return (
    <Stack
      direction="row"
      spacing={0.4}
      sx={{ alignItems: "center", justifyContent: "flex-end", minWidth: 0 }}
    >
      <GroupsOutlinedIcon
        aria-hidden
        sx={{ color: "text.secondary", flexShrink: 0, fontSize: 14 }}
      />
      <Typography
        component="span"
        sx={{
          color: "text.secondary",
          fontSize: 11,
          lineHeight: 1.3,
          overflowWrap: "anywhere",
          textAlign: "right",
        }}
        variant="caption"
      >
        {label}
      </Typography>
    </Stack>
  );
}
