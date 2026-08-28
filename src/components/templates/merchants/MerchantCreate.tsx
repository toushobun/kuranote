"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { routePaths } from "config/paths";
import { merchantText } from "config/merchantText";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { MerchantForm } from "organisms/merchants/MerchantForm/MerchantForm";
import { PageShell } from "templates/layout/PageShell";
import type { MerchantStateAction } from "types/merchants";

import { useMerchantsActionState } from "./useMerchantsActionState";

type MerchantCreateTemplateProps = {
  createMerchantAction: MerchantStateAction;
  ledgerId: string;
  ledgerName: string;
};

export function MerchantCreateTemplate({
  createMerchantAction,
  ledgerId,
  ledgerName,
}: MerchantCreateTemplateProps) {
  const create = useMerchantsActionState(createMerchantAction, {
    operation: "create",
  });

  return (
    <PageShell
      maxWidth="sm"
      sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <IconButton
          aria-label="返回商家管理"
          component={Link}
          href={routePaths.merchants}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 900 }}>
            {merchantText.create}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            商家管理 〉 新增商家 · {ledgerName}
          </Typography>
        </Box>
      </Stack>
      <SectionCard sx={{ borderRadius: 3.5, p: { xs: 2, sm: 3 } }}>
        <MerchantForm
          action={create.action}
          ledgerId={ledgerId}
          pending={create.pending}
        />
      </SectionCard>
      <MerchantFailureFeedback
        state={create.state}
        title={merchantText.createErrorTitle}
      />
    </PageShell>
  );
}
