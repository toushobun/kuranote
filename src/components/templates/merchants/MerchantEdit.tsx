"use client";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useCallback, useState } from "react";

import { routePaths } from "config/paths";
import { merchantText } from "config/merchantText";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantDisplayNameEditor } from "organisms/merchants/MerchantDisplayNameEditor/MerchantDisplayNameEditor";
import { MerchantEditForm } from "organisms/merchants/MerchantEditForm/MerchantEditForm";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type { Merchant, MerchantStateAction } from "types/merchants";

import { useMerchantsActionState } from "./useMerchantsActionState";

type MerchantEditTemplateProps = {
  archiveMerchantAction: MerchantStateAction;
  archiveMerchantAliasAction: MerchantStateAction;
  createMerchantAliasAction: MerchantStateAction;
  ledgerId: string;
  ledgerName: string;
  merchant: Merchant;
  setPreferredMerchantAliasAction: MerchantStateAction;
  updateMerchantAction: MerchantStateAction;
};

export function MerchantEditTemplate({
  archiveMerchantAction,
  archiveMerchantAliasAction,
  createMerchantAliasAction,
  ledgerId,
  ledgerName,
  merchant,
  setPreferredMerchantAliasAction,
  updateMerchantAction,
}: MerchantEditTemplateProps) {
  const [formalName, setFormalName] = useState(merchant.name);
  const handleFormalNameChange = useCallback(
    (name: string) => setFormalName(name),
    [],
  );
  const update = useMerchantsActionState(updateMerchantAction, {
    merchantId: merchant.id,
    operation: "update",
  });
  const archive = useMerchantsActionState(archiveMerchantAction, {
    merchantId: merchant.id,
    operation: "archive",
  });
  const createAlias = useMerchantsActionState(createMerchantAliasAction, {
    merchantId: merchant.id,
    operation: "createAlias",
  });
  const archiveAlias = useMerchantsActionState(archiveMerchantAliasAction, {
    merchantId: merchant.id,
    operation: "archiveAlias",
  });
  const setPreferred = useMerchantsActionState(
    setPreferredMerchantAliasAction,
    { merchantId: merchant.id, operation: "setPreferred" },
  );
  const aliasPending =
    createAlias.pending || archiveAlias.pending || setPreferred.pending;

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
              <span>{merchantText.edit}</span>
            </Breadcrumbs>
            <Typography color="text.secondary" variant="body2">
              当前账本：{ledgerName}
            </Typography>
          </Stack>
        }
        title={merchantText.edit}
      />

      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantEditForm
          action={update.action}
          ledgerId={ledgerId}
          merchant={merchant}
          onNameChange={handleFormalNameChange}
          pending={update.pending}
        />
      </SectionCard>

      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantDisplayNameEditor
          archiveAliasAction={archiveAlias.action}
          createAliasAction={createAlias.action}
          formalName={formalName}
          merchant={merchant}
          pending={aliasPending}
          setPreferredAliasAction={setPreferred.action}
        />
      </SectionCard>

      <SectionCard sx={{ borderColor: "error.light", p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {merchantText.archive}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {merchantText.archiveDescription}
          </Typography>
          <form action={archive.action}>
            <input name="merchantId" type="hidden" value={merchant.id} />
            <Button
              color="error"
              disabled={archive.pending}
              type="submit"
              variant="outlined"
            >
              {merchantText.archive}
            </Button>
          </form>
        </Stack>
      </SectionCard>

      <MerchantFailureFeedback
        state={update.state}
        title={merchantText.editErrorTitle}
      />
      <MerchantFailureFeedback
        state={archive.state}
        title={merchantText.archiveErrorTitle}
      />
      <MerchantFailureFeedback
        state={createAlias.state}
        title={merchantText.createAliasErrorTitle}
      />
      <MerchantFailureFeedback
        state={archiveAlias.state}
        title={merchantText.archiveAliasErrorTitle}
      />
      <MerchantFailureFeedback
        state={setPreferred.state}
        title={merchantText.preferredErrorTitle}
      />
    </PageShell>
  );
}
