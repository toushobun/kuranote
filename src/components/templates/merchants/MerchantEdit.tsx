"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRef, useState } from "react";

import { routePaths } from "config/paths";
import { merchantText } from "config/merchantText";
import { DeleteConfirmationDialog } from "molecules/ui/OperationFeedbackDialogs";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantDisplayNameEditor } from "organisms/merchants/MerchantDisplayNameEditor/MerchantDisplayNameEditor";
import { MerchantEditForm } from "organisms/merchants/MerchantEditForm/MerchantEditForm";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";
import type { Merchant, MerchantStateAction } from "types/merchants";
import { getMerchantInitial, merchantIconSrc } from "utils/merchants";

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
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const archiveFormRef = useRef<HTMLFormElement>(null);
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
    <PageShell
      maxWidth="sm"
      sx={{ pb: { xs: 3, sm: 5 }, pt: { xs: 2, sm: 4 } }}
    >
      <PageHeader
        action={
          <form action={archive.action} ref={archiveFormRef}>
            <input name="merchantId" type="hidden" value={merchant.id} />
            <Button
              color="error"
              disabled={archive.pending}
              onClick={() => setIsArchiveConfirmOpen(true)}
              size="small"
              sx={{ borderRadius: 999 }}
              type="button"
              variant="outlined"
            >
              {merchantText.archive}
            </Button>
          </form>
        }
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
        subtitle={`商家管理 〉 编辑商家 · ${ledgerName}`}
        title={merchantText.edit}
      />

      <SectionCard sx={{ borderRadius: 3.5, p: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            src={merchantIconSrc(ledgerId, merchant.website_url)}
            sx={{
              bgcolor: "var(--user-theme-icon-badge-bg)",
              border: "1px solid var(--user-theme-card-border)",
              height: 68,
              width: 68,
            }}
          >
            {getMerchantInitial(merchant.display_name)}
          </Avatar>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>
              商家名称　{merchant.name}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ overflowWrap: "anywhere" }}
            >
              商家网址　{merchant.website_url || "未设置"}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              备注　{merchant.note || "未设置"}
            </Typography>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard sx={{ borderRadius: 3.5, p: { xs: 2, sm: 3 } }}>
        <MerchantEditForm
          action={update.action}
          ledgerId={ledgerId}
          merchant={merchant}
          pending={update.pending}
        />
      </SectionCard>

      <SectionCard sx={{ borderRadius: 3.5, p: { xs: 2, sm: 3 } }}>
        <MerchantDisplayNameEditor
          archiveAliasAction={archiveAlias.action}
          createAliasAction={createAlias.action}
          merchant={merchant}
          pending={aliasPending}
          setPreferredAliasAction={setPreferred.action}
        />
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
      {isArchiveConfirmOpen ? (
        <DeleteConfirmationDialog
          confirmLabel={merchantText.archive}
          description={merchantText.archiveDescription}
          onCancel={() => setIsArchiveConfirmOpen(false)}
          onConfirm={() => {
            setIsArchiveConfirmOpen(false);
            archiveFormRef.current?.requestSubmit();
          }}
          open={isArchiveConfirmOpen}
          title={merchantText.archiveConfirmTitle}
        />
      ) : null}
    </PageShell>
  );
}
