import { z } from "zod";

import { ledgerCurrencies } from "internal/ledger/entity/ledgerCurrency";
import {
  ledgerSetupDraftMaxBytes,
  ledgerSetupLimits,
  ledgerSetupStepRange,
} from "internal/ledger/entity/ledgerSetup";
import { ledgerSetupAccountTypes } from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
import {
  ledgerSetupErrorCodes,
  type LedgerSetupErrorCode,
} from "internal/ledger/errors/ledgerSetup";
import {
  invalid,
  valid,
  type ValidationResult,
} from "internal/shared/schema/formValidation";

const ledgerSetupStepSchema = z
  .number()
  .int()
  .min(ledgerSetupStepRange.min)
  .max(ledgerSetupStepRange.max);

const templateKeySchema = z
  .string()
  .min(1)
  .max(ledgerSetupLimits.templateKeyMaxLength);

const ledgerSetupDraftAccountSchema = z.object({
  name: z.string().trim().min(1).max(ledgerSetupLimits.accountNameMaxLength),
  /** 来自模板候选时记录候选名称，用于在候选 Chip 上显示已添加状态。 */
  templateKey: templateKeySchema.optional(),
  type: z.enum(ledgerSetupAccountTypes),
});

/** 草稿结构 v1 的各部分。存储时按部分独立解析，便于局部重置。 */
const ledgerSetupDraftSectionSchemas = {
  accounts: z.object({
    items: z
      .array(ledgerSetupDraftAccountSchema)
      .max(ledgerSetupLimits.maxAccounts),
    skipped: z.boolean(),
  }),
  features: z.object({
    specialStatusEnabled: z.boolean(),
  }),
  /** 以商家为单位存储勾选，标签勾选只是对其下商家的批量操作。 */
  merchants: z.object({
    selectedKeys: z
      .array(templateKeySchema)
      .max(ledgerSetupLimits.maxMerchants),
    skipped: z.boolean(),
  }),
  templateCurrency: z.enum(ledgerCurrencies),
  /** 所选币种没有模板时为 null。 */
  templateVersion: z.number().int().positive().nullable(),
};

/** 向导草稿结构 v1。 */
export const ledgerSetupDraftSchema = z.object(ledgerSetupDraftSectionSchemas);

export type LedgerSetupDraft = z.infer<typeof ledgerSetupDraftSchema>;
export type LedgerSetupDraftAccount = z.infer<
  typeof ledgerSetupDraftAccountSchema
>;

/**
 * 数据库中保存的草稿。刚创建的账本草稿为空对象，修改默认货币后与模板相关的部分
 * 会被移除，因此各部分都可能缺失；缺失部分由 Service 按当前模板补全默认值。
 */
export type StoredLedgerSetupDraft = Partial<LedgerSetupDraft>;

function parseSection<T>(
  schema: z.ZodType<T>,
  value: Record<string, unknown>,
  key: string,
): T | undefined {
  if (!(key in value)) return undefined;

  const result = schema.safeParse(value[key]);
  return result.success ? result.data : undefined;
}

/**
 * 解析数据库中保存的草稿。数据库保证草稿为 JSON object，不是 object 时返回 null；
 * 不符合 v1 结构的部分视为缺失，由 Service 按模板默认值补全。
 */
export function parseStoredLedgerSetupDraft(
  value: unknown,
): StoredLedgerSetupDraft | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const sections = ledgerSetupDraftSectionSchemas;
  const draft: StoredLedgerSetupDraft = {};

  const accounts = parseSection(sections.accounts, record, "accounts");
  if (accounts) draft.accounts = accounts;
  const features = parseSection(sections.features, record, "features");
  if (features) draft.features = features;
  const merchants = parseSection(sections.merchants, record, "merchants");
  if (merchants) draft.merchants = merchants;
  const templateCurrency = parseSection(
    sections.templateCurrency,
    record,
    "templateCurrency",
  );
  if (templateCurrency) draft.templateCurrency = templateCurrency;
  const templateVersion = parseSection(
    sections.templateVersion,
    record,
    "templateVersion",
  );
  if (templateVersion !== undefined) draft.templateVersion = templateVersion;

  return draft;
}

export type LedgerSetupDraftValues = {
  draft: LedgerSetupDraft;
  step: number;
};

/**
 * 保存草稿前的边界校验。大小按 JSON 文本的 UTF-8 字节数粗略判断，
 * 数据库按 jsonb 文本表示做最终判断（两者格式不同，数据库为准）。
 */
export function validateLedgerSetupDraftInput(input: {
  draft: unknown;
  step: unknown;
}): ValidationResult<LedgerSetupDraftValues, LedgerSetupErrorCode> {
  const stepResult = ledgerSetupStepSchema.safeParse(input.step);

  if (!stepResult.success) {
    return invalid(ledgerSetupErrorCodes.stepInvalid);
  }

  const draftResult = ledgerSetupDraftSchema.safeParse(input.draft);

  if (!draftResult.success) {
    return invalid(ledgerSetupErrorCodes.draftInvalid);
  }

  const draftBytes = new TextEncoder().encode(
    JSON.stringify(draftResult.data),
  ).length;

  if (draftBytes > ledgerSetupDraftMaxBytes) {
    return invalid(ledgerSetupErrorCodes.draftTooLarge);
  }

  return valid({ draft: draftResult.data, step: stepResult.data });
}
