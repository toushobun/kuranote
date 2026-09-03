"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

import { routePaths } from "config/paths";
import { merchantText } from "config/merchantText";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { MerchantForm } from "organisms/merchants/MerchantForm/MerchantForm";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type {
  MerchantIconStateAction,
  MerchantStateAction,
  MerchantTag,
} from "types/merchants";

import { useMerchantsActionState } from "./useMerchantsActionState";

type MerchantCreateTemplateProps = {
  createMerchantAction: MerchantStateAction;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  ledgerName: string;
  tags: MerchantTag[];
};

export function MerchantCreateTemplate({
  createMerchantAction,
  fetchIconAction,
  ledgerId,
  ledgerName,
  tags,
}: MerchantCreateTemplateProps) {
  const create = useMerchantsActionState(createMerchantAction, {
    operation: "create",
  });

  return (
    <PageShell
      maxWidth="sm"
      sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
    >
      <PageHeader
        leading={
          <IconButton
            aria-label="返回商家管理"
            component={Link}
            href={routePaths.merchants}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        }
        subtitle={`商家管理 〉 新增商家 · ${ledgerName}`}
        title={merchantText.create}
      />
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantForm
          action={create.action}
          fetchIconAction={fetchIconAction}
          ledgerId={ledgerId}
          pending={create.pending}
          tags={tags}
        />
      </SectionCard>
      <MerchantFailureFeedback
        state={create.state}
        title={merchantText.createErrorTitle}
      />
    </PageShell>
  );
}
