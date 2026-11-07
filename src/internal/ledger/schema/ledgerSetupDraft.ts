import { z } from "zod";

import {
  ledgerSetupDraftMaxBytes,
  ledgerSetupLimits,
  ledgerSetupStepRange,
} from "internal/ledger/entity/ledgerSetup";
import {
  ledgerSetupAccountTypes,
  ledgerSetupRegions,
} from "internal/ledger/entity/ledgerSetupTemplate/ledgerSetupTemplate";
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

export const persistLedgerSetupSchema = z.object({
  setup: z.object({
    id: z.uuid(),
    name: z.string(),
    baseCurrency: z.string(),
    displayName: z.string(),
    displayColor: z.string(),
    livingRegion: z.enum(ledgerSetupRegions),
    draft: z.unknown(),
  }),
  expectedUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
  step: ledgerSetupStepSchema,
  complete: z.boolean(),
});

const templateKeySchema = z
  .string()
  .min(1)
  .max(ledgerSetupLimits.templateKeyMaxLength);

const ledgerSetupDraftAccountSchema = z.object({
  name: z.string().trim().min(1).max(ledgerSetupLimits.accountNameMaxLength),
  /** 勾选的模板候选名称（账户只能从候选中勾选，name 与之相同）。 */
  templateKey: templateKeySchema,
  type: z.enum(ledgerSetupAccountTypes),
});

/** 草稿结构 v2 的各部分。存储时按部分独立解析，便于局部重置。 */
const ledgerSetupDraftSectionSchemas = {
  accounts: z.object({
    items: z
      .array(ledgerSetupDraftAccountSchema)
      .max(ledgerSetupLimits.maxAccounts),
    skipped: z.boolean(),
  }),
  features: z.object({
    multiAccountPaymentEnabled: z.boolean(),
    specialStatusEnabled: z.boolean(),
  }),
  /** 以商家为单位存储勾选，标签勾选只是对其下商家的批量操作。 */
  merchants: z.object({
    additionalRegions: z.array(z.enum(ledgerSetupRegions)).max(1).optional(),
    selectedKeys: z
      .array(templateKeySchema)
      .max(ledgerSetupLimits.maxMerchants),
    skipped: z.boolean(),
  }),
  schemaVersion: z.literal(2),
  templateRegion: z.enum(ledgerSetupRegions).nullable(),
  /** 尚未选择地区时为 null。 */
  templateVersion: z.number().int().positive().nullable(),
};

/** 向导草稿结构 v2。 */
export const ledgerSetupDraftSchema = z.object(ledgerSetupDraftSectionSchemas);

export type LedgerSetupDraft = z.infer<typeof ledgerSetupDraftSchema>;
export type LedgerSetupDraftAccount = z.infer<
  typeof ledgerSetupDraftAccountSchema
>;

/**
 * 数据库中保存的草稿。刚创建的账本草稿为空对象，缺失部分由 Service 按地区模板补全。
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
 * 不符合当前结构的部分视为缺失，由 Service 按模板默认值补全。
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
  const templateRegion = parseSection(
    sections.templateRegion,
    record,
    "templateRegion",
  );
  if (templateRegion !== undefined) draft.templateRegion = templateRegion;
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
