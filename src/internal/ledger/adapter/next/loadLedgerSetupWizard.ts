import {
  createRequestContainer,
  type RequestContainer,
} from "internal/container";
import { getCurrentLedgerContext } from "internal/ledger/adapter/next/currentLedger";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import type {
  LedgerSetupInProgressSummary,
  LedgerSetupProgress,
  LedgerSetupWizardView,
} from "types/ledgers";

/** 读取当前用户的创建中账本（草稿已补全）及其默认货币对应的预设模板。 */
export async function readLedgerSetupProgress(
  setupService: Pick<
    RequestContainer["ledger"]["setupService"],
    "getCurrentUserSetup" | "getTemplate"
  >,
): Promise<LedgerSetupProgress | null> {
  const setup = await setupService.getCurrentUserSetup();

  return setup
    ? { setup, template: setupService.getTemplate(setup.baseCurrency) }
    : null;
}

/**
 * 创建账本向导的初始数据：第 1 步的默认值、当前用户的创建中账本进度，
 * 以及确认一览展示的默认大分类。默认大分类与账本无关、不随向导操作变化，
 * 因此在打开向导时与其他数据并行读取一次，确认一览无需再单独请求。
 */
export async function loadLedgerSetupWizard(): Promise<LedgerSetupWizardView> {
  // redirect() 属于页面边界，未登录时由 currentLedger 解析跳转登录页。
  const { currentLedger, email, userId } = await getCurrentLedgerContext();
  const dependencies = await createServerRequestDependencies();
  const container = createRequestContainer(dependencies);
  const [{ defaults }, progress, defaultRootCategoryNames] = await Promise.all([
    container.ledger.service.getCreateDefaults({
      email,
      inheritedCurrency: currentLedger?.baseCurrency,
      userId,
    }),
    readLedgerSetupProgress(container.ledger.setupService),
    container.ledger.setupService.listDefaultRootCategoryNames(),
  ]);

  return { defaultRootCategoryNames, defaults, progress };
}

/**
 * 首页「继续创建」与账本管理页「创建中」条目只需要账本名与步骤，
 * 不读取模板与默认分类；完整的向导数据在打开向导时再读取。
 */
export async function loadLedgerSetupInProgressSummary(): Promise<LedgerSetupInProgressSummary | null> {
  // redirect() 属于页面边界，未登录时由 currentLedger 解析跳转登录页。
  await getCurrentLedgerContext();
  const dependencies = await createServerRequestDependencies();
  const setup =
    await createRequestContainer(
      dependencies,
    ).ledger.setupService.getCurrentUserSetup();

  return setup ? { id: setup.id, name: setup.name, step: setup.step } : null;
}
