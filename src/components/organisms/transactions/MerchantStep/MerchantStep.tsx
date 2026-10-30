"use client";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { EmptyState } from "molecules/ui/EmptyState";
import { MerchantAvatar } from "organisms/merchants/MerchantAvatar/MerchantAvatar";
import { publicAssetUrl } from "utils/publicAssetUrl";
import { designTokens } from "theme/theme";
import { entrySelectionRowSx as rowSx } from "organisms/transactions/transactionStepFlowStyles";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { useMerchantStep } from "./useMerchantStep";
import type { MerchantStepProps } from "./MerchantStep.types";

export function MerchantStep(props: MerchantStepProps) {
  const w = useMerchantStep(props);
  return props.merchants.length === 0 ? (
    <EmptyState
      title={m.noMerchants}
      description={m.merchantHint}
      illustration={
        <Box
          component="img"
          alt=""
          src={publicAssetUrl(
            "/assets/kura-merchant-empty/merchant_empty_amber_warmth.png",
          )}
          sx={{ width: 180, maxWidth: "100%" }}
        />
      }
      action={
        (props.onAddPresets || props.onAddMerchant) && (
          <Stack spacing={2}>
            {props.onAddPresets && (
              <Button variant="contained" onClick={props.onAddPresets}>
                {m.presets}
              </Button>
            )}
            {props.onAddMerchant && (
              <Button
                variant="outlined"
                onClick={() => props.onAddMerchant?.()}
              >
                {m.addMerchant}
              </Button>
            )}
          </Stack>
        )
      }
    />
  ) : (
    <Stack spacing={2}>
      <TextField
        fullWidth
        size="small"
        label={m.search}
        value={w.search}
        onChange={(event) => w.setSearch(event.target.value)}
      />
      <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
        <Chip
          label={m.all}
          color={w.tagId === null ? "primary" : "default"}
          onClick={() => w.setTagId(null)}
          sx={chipSx}
        />
        {props.merchantTags.map((tag) => (
          <Chip
            key={tag.id}
            label={`${tag.icon} ${tag.name}`}
            color={w.tagId === tag.id ? "primary" : "default"}
            onClick={() => w.setTagId(tag.id)}
            sx={chipSx}
          />
        ))}
      </Stack>
      {!w.keyword && !w.tagId && w.frequent.length > 0 && (
        <>
          <Typography sx={{ fontWeight: "bold" }}>{m.frequent}</Typography>
          <Box
            role="group"
            aria-label={m.frequent}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 2,
            }}
          >
            {w.frequent.map((merchant) => (
              <ButtonBase
                key={merchant.id}
                aria-busy={merchant.id === props.loadingMerchantId || undefined}
                onClick={() => props.onSelect(merchant)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Box sx={{ position: "relative", display: "flex" }}>
                  <MerchantAvatar
                    size={56}
                    toneKey={merchant.id}
                    src={merchant.icon_url ?? undefined}
                  />
                  {merchant.id === props.loadingMerchantId && (
                    <CircularProgress
                      size={64}
                      thickness={2.5}
                      aria-label={m.loadingMerchant(merchant.name)}
                      sx={avatarProgressSx}
                    />
                  )}
                </Box>
                <Typography variant="body2" noWrap sx={{ maxWidth: "100%" }}>
                  {merchant.name}
                </Typography>
              </ButtonBase>
            ))}
          </Box>
        </>
      )}
      {w.filtered.length > 0 ? (
        <>
          <Typography sx={{ fontWeight: "bold" }}>
            {w.keyword || w.tagId ? m.results : m.merchants}
          </Typography>
          <List disablePadding>
            {w.filtered.map((merchant) => (
              <ListItemButton
                key={merchant.id}
                aria-busy={merchant.id === props.loadingMerchantId || undefined}
                onClick={() => props.onSelect(merchant)}
                sx={rowSx}
              >
                <MerchantAvatar
                  size={36}
                  toneKey={merchant.id}
                  src={merchant.icon_url ?? undefined}
                />
                <ListItemText primary={merchant.name} />
                {merchant.tags.map((tag) => (
                  <Chip key={tag.id} label={tag.name} size="small" />
                ))}
                {merchant.id === props.loadingMerchantId ? (
                  <CircularProgress
                    size={20}
                    aria-label={m.loadingMerchant(merchant.name)}
                  />
                ) : (
                  <ChevronRightRoundedIcon />
                )}
              </ListItemButton>
            ))}
          </List>
        </>
      ) : (
        <Stack spacing={2} sx={emptySx}>
          <Typography>{m.notFound(w.keyword)}</Typography>
          {props.onAddMerchant && (
            <Button
              startIcon={<AddRoundedIcon />}
              variant="outlined"
              onClick={() => props.onAddMerchant?.(w.keyword)}
            >
              {m.addSearch(w.keyword)}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

const chipSx = { borderRadius: `${designTokens.radius.full}px`, flexShrink: 0 };
// 加载圈套在头像外圈，不改变网格布局。
const avatarProgressSx = {
  position: "absolute",
  top: -4,
  left: -4,
  pointerEvents: "none",
} as const;
const emptySx = { textAlign: "center", py: 6 } as const;
