"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { merchantText } from "config/merchantText";
import type { ServerAction } from "types/actions";
import type { Merchant } from "types/merchants";

type MerchantDisplayNameEditorProps = {
  archiveAliasAction: ServerAction;
  createAliasAction: ServerAction;
  formalName: string;
  merchant: Merchant;
  pending?: boolean;
  setPreferredAliasAction: ServerAction;
};

export function MerchantDisplayNameEditor({
  archiveAliasAction,
  createAliasAction,
  formalName,
  merchant,
  pending = false,
  setPreferredAliasAction,
}: MerchantDisplayNameEditorProps) {
  const [alias, setAlias] = useState("");
  const hasPreferredAlias = merchant.aliases.some(
    (candidate) => candidate.is_preferred,
  );

  return (
    <Stack spacing={1.25}>
      <Stack spacing={0.5}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>
          {merchantText.preferredTitle}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {merchantText.preferredHelper}
        </Typography>
      </Stack>

      <NameRow
        label={formalName}
        selected={!hasPreferredAlias}
        setPreferredAliasAction={setPreferredAliasAction}
        merchantId={merchant.id}
        tag={merchantText.formalName}
      />

      {merchant.aliases.map((candidate) => (
        <NameRow
          aliasId={candidate.id}
          archiveAliasAction={archiveAliasAction}
          key={candidate.id}
          label={candidate.alias}
          merchantId={merchant.id}
          selected={candidate.is_preferred}
          setPreferredAliasAction={setPreferredAliasAction}
        />
      ))}

      <Stack
        component="form"
        action={createAliasAction}
        direction="row"
        spacing={1}
      >
        <input name="merchantId" type="hidden" value={merchant.id} />
        <TextField
          autoComplete="off"
          fullWidth
          label={merchantText.aliasLabel}
          name="alias"
          onChange={(event) => setAlias(event.target.value)}
          placeholder="例如：来福、LIFE"
          required
          size="small"
          slotProps={{ htmlInput: { maxLength: 100 } }}
          value={alias}
        />
        <Button
          disabled={pending}
          startIcon={<AddRoundedIcon />}
          sx={{ borderStyle: "dashed", flexShrink: 0 }}
          type="submit"
          variant="outlined"
        >
          {merchantText.addAlias}
        </Button>
      </Stack>
      <Typography color="text.secondary" variant="caption" sx={{ px: 0.5 }}>
        {merchantText.aliasHelper}
      </Typography>
    </Stack>
  );
}

function NameRow({
  aliasId,
  archiveAliasAction,
  label,
  merchantId,
  selected,
  setPreferredAliasAction,
  tag,
}: {
  aliasId?: string;
  archiveAliasAction?: ServerAction;
  label: string;
  merchantId: string;
  selected: boolean;
  setPreferredAliasAction: ServerAction;
  tag?: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 2.5,
        px: 1.25,
        py: 0.5,
      }}
    >
      {tag ? (
        <Chip color="primary" label={tag} size="small" variant="outlined" />
      ) : null}
      <Typography sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
        {label}
      </Typography>
      <form action={setPreferredAliasAction}>
        <input name="merchantId" type="hidden" value={merchantId} />
        <input name="aliasId" type="hidden" value={aliasId ?? ""} />
        <IconButton
          aria-label={
            selected ? `${label}是当前展示名` : `将${label}设为展示名`
          }
          color={selected ? "primary" : "default"}
          type="submit"
        >
          {selected ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
        </IconButton>
      </form>
      {aliasId && archiveAliasAction ? (
        <form action={archiveAliasAction}>
          <input name="aliasId" type="hidden" value={aliasId} />
          <IconButton
            aria-label={`移除别名${label}`}
            color="error"
            type="submit"
          >
            <CloseRoundedIcon />
          </IconButton>
        </form>
      ) : null}
    </Stack>
  );
}
