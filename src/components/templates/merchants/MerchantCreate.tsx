"use client";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

import { routePaths } from "config/paths";
import { merchantText } from "config/merchantText";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { MerchantForm } from "organisms/merchants/MerchantForm/MerchantForm";
import { PageHeader } from "templates/layout/PageHeader";
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
    <PageShell maxWidth="sm">
      <PageHeader
        subtitle={
          <Stack spacing={0.5}>
            <Breadcrumbs aria-label="面包屑">
              <Link
                component={NextLink}
                href={routePaths.merchants}
                underline="hover"
              >
                商家管理
              </Link>
              <span>{merchantText.create}</span>
            </Breadcrumbs>
            <Typography color="text.secondary" variant="body2">
              当前账本：{ledgerName}
            </Typography>
          </Stack>
        }
        title={merchantText.create}
      />
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
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
