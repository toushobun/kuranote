import { createSupabaseAccountRepository } from "internal/account/repository/accountRepository";
import {
  createAccountService,
  type AccountQueryService,
} from "internal/account/service/accountService";
import { isGoogleAuthEnabled } from "internal/auth/googleAuthConfig";
import { createSupabaseAuthRepository } from "internal/auth/repository/authRepository";
import { createSupabaseAuthSecurityRepository } from "internal/auth/repository/authSecurityRepository";
import { createCloudflareTurnstileRepository } from "internal/auth/repository/turnstileRepository";
import { createAuthService } from "internal/auth/service/authService";
import { createSupabaseCategoryRepository } from "internal/category/repository/categoryRepository";
import {
  createCategoryService,
  type CategoryQueryService,
} from "internal/category/service/categoryService";
import { createSupabaseCurrentLedgerRepository } from "internal/ledger/repository/currentLedgerRepository";
import { createSupabaseLedgerInviteRepository } from "internal/ledger/repository/ledgerInviteRepository";
import { createSupabaseLedgerInvitePreviewRepository } from "internal/ledger/repository/ledgerInvitePreviewRepository";
import { createSupabaseLedgerRepository } from "internal/ledger/repository/ledgerRepository";
import { createSupabaseLedgerSettingsRepository } from "internal/ledger/repository/ledgerSettingsRepository";
import { createCurrentLedgerService } from "internal/ledger/service/currentLedgerService";
import { createLedgerAccessService } from "internal/ledger/service/ledgerAccessService";
import { createLedgerInvitePreviewService } from "internal/ledger/service/ledgerInvitePreviewService";
import { createLedgerInviteService } from "internal/ledger/service/ledgerInviteService";
import { createLedgerService } from "internal/ledger/service/ledgerService";
import { createLedgerSettingsService } from "internal/ledger/service/ledgerSettingsService";
import { createSupabaseMerchantRepository } from "internal/merchant/repository/merchantRepository";
import {
  createMerchantService,
  type MerchantQueryService,
} from "internal/merchant/service/merchantService";
import type { RequestDependencies } from "internal/shared/context/requestDependencies";
import { createSupabaseStatisticsRepository } from "internal/statistics/repository/statisticsRepository";
import { createStatisticsService } from "internal/statistics/service/statisticsService";
import { createSupabaseLinkedTransactionItemRepository } from "internal/transaction/repository/linkedTransactionItemRepository";
import { createSupabaseTransactionIncomeLinkRepository } from "internal/transaction/repository/transactionIncomeLinkRepository";
import { createSupabaseTransactionRepository } from "internal/transaction/repository/transactionRepository";
import { createLinkedTransactionItemService } from "internal/transaction/service/linkedTransactionItemService";
import { createTransactionDashboardQueryService } from "internal/transaction/service/transactionDashboardQueryService";
import { createTransactionService } from "internal/transaction/service/transactionService";
import { createSupabaseUserRepository } from "internal/user/repository/userRepository";
import { createUserService } from "internal/user/service/userService";

/**
 * 请求级依赖容器。Hono middleware 和 Server Component 都可以调用
 * createRequestContainer(dependencies) 得到同一形状的 Container，
 * 再直接调用目标模块的 Service——不经过内部 HTTP、不发起自请求。
 *
 * Container 只负责创建 Repository / Service 并完成依赖注入，
 * 不负责 URL、HTTP 状态码、数据库查询本身、业务逻辑、权限规则或缓存失效。
 *
 * 每个模块字段惰性求值：未被访问的模块不会创建对应的 Repository / Service。
 */
export type RequestContainer = {
  readonly account: {
    readonly service: ReturnType<typeof createAccountService>;
  };
  readonly auth: {
    readonly service: ReturnType<typeof createAuthService>;
  };
  readonly ledger: {
    readonly service: ReturnType<typeof createLedgerService>;
    readonly currentLedgerService: ReturnType<
      typeof createCurrentLedgerService
    >;
    readonly settingsService: ReturnType<typeof createLedgerSettingsService>;
    readonly inviteService: ReturnType<typeof createLedgerInviteService>;
    readonly invitePreviewService: ReturnType<
      typeof createLedgerInvitePreviewService
    >;
  };
  readonly category: {
    readonly service: ReturnType<typeof createCategoryService>;
  };
  readonly merchant: {
    readonly service: ReturnType<typeof createMerchantService>;
  };
  readonly statistics: {
    readonly service: ReturnType<typeof createStatisticsService>;
  };
  readonly transaction: {
    readonly service: ReturnType<typeof createTransactionService>;
    readonly linkedTransactionItemService: ReturnType<
      typeof createLinkedTransactionItemService
    >;
  };
  readonly user: {
    readonly service: ReturnType<typeof createUserService>;
  };
};

export function createRequestContainer(
  dependencies: RequestDependencies,
): RequestContainer {
  let accountContainer: RequestContainer["account"] | undefined;
  let authContainer: RequestContainer["auth"] | undefined;
  let ledgerContainer: RequestContainer["ledger"] | undefined;
  let categoryContainer: RequestContainer["category"] | undefined;
  let merchantContainer: RequestContainer["merchant"] | undefined;
  let statisticsContainer: RequestContainer["statistics"] | undefined;
  let transactionContainer: RequestContainer["transaction"] | undefined;
  let userContainer: RequestContainer["user"] | undefined;
  let accountRepository:
    | ReturnType<typeof createSupabaseAccountRepository>
    | undefined;
  let accountQueryService: AccountQueryService | undefined;
  let categoryRepository:
    | ReturnType<typeof createSupabaseCategoryRepository>
    | undefined;
  let categoryQueryService: CategoryQueryService | undefined;
  let merchantRepository:
    | ReturnType<typeof createSupabaseMerchantRepository>
    | undefined;
  let merchantQueryService: MerchantQueryService | undefined;
  let ledgerSettingsRepository:
    | ReturnType<typeof createSupabaseLedgerSettingsRepository>
    | undefined;
  let ledgerAccessService:
    | ReturnType<typeof createLedgerAccessService>
    | undefined;

  function getAccountRepository() {
    return (accountRepository ??= createSupabaseAccountRepository(
      dependencies.supabase,
      dependencies.logger,
    ));
  }

  function getAccountQueryService() {
    return (accountQueryService ??= createAccountService({
      accountRepository: getAccountRepository(),
      ledgerAccessService: getLedgerAccessService(),
    }));
  }

  function getCategoryRepository() {
    return (categoryRepository ??= createSupabaseCategoryRepository(
      dependencies.supabase,
      dependencies.logger,
    ));
  }

  function getCategoryQueryService() {
    return (categoryQueryService ??= createCategoryService({
      categoryRepository: getCategoryRepository(),
      ledgerAccessService: getLedgerAccessService(),
    }));
  }

  function getMerchantRepository() {
    return (merchantRepository ??= createSupabaseMerchantRepository(
      dependencies.supabase,
      dependencies.logger,
    ));
  }

  function getMerchantQueryService() {
    return (merchantQueryService ??= createMerchantService({
      currentUserId: dependencies.auth.isAuthenticated
        ? dependencies.auth.userId
        : null,
      ledgerAccessService: getLedgerAccessService(),
      merchantRepository: getMerchantRepository(),
    }));
  }

  function getLedgerSettingsRepository() {
    return (ledgerSettingsRepository ??= createSupabaseLedgerSettingsRepository(
      dependencies.supabase,
      dependencies.logger,
    ));
  }

  function getLedgerAccessService() {
    return (ledgerAccessService ??= createLedgerAccessService(
      getLedgerSettingsRepository(),
    ));
  }

  return {
    get account() {
      if (!accountContainer) {
        accountContainer = {
          service: createAccountService({
            accountRepository: getAccountRepository(),
            ledgerAccessService: getLedgerAccessService(),
          }),
        };
      }
      return accountContainer;
    },

    get auth() {
      if (!authContainer) {
        const authRepository = createSupabaseAuthRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const authSecurityRepository = createSupabaseAuthSecurityRepository(
          dependencies.logger,
        );
        const turnstileRepository = createCloudflareTurnstileRepository(
          dependencies.logger,
        );

        authContainer = {
          service: createAuthService({
            authRepository,
            authSecurityRepository,
            createUserDisplayNameSyncService(userId) {
              const userRepository = createSupabaseUserRepository(
                dependencies.supabase,
                dependencies.logger,
              );
              return createUserService({
                currentUserId: userId,
                userRepository,
              });
            },
            isGoogleAuthEnabled,
            logger: dependencies.logger,
            turnstileRepository,
          }),
        };
      }

      return authContainer;
    },

    get category() {
      if (!categoryContainer) {
        categoryContainer = {
          service: createCategoryService({
            categoryRepository: getCategoryRepository(),
            ledgerAccessService: getLedgerAccessService(),
          }),
        };
      }

      return categoryContainer;
    },

    get ledger() {
      if (!ledgerContainer) {
        const ledgerRepository = createSupabaseLedgerRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const currentLedgerRepository = createSupabaseCurrentLedgerRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const ledgerInviteRepository = createSupabaseLedgerInviteRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const ledgerInvitePreviewRepository =
          createSupabaseLedgerInvitePreviewRepository(
            dependencies.supabase,
            dependencies.logger,
          );

        ledgerContainer = {
          currentLedgerService: createCurrentLedgerService({
            currentLedgerRepository,
          }),
          inviteService: createLedgerInviteService({
            ledgerAccessService: getLedgerAccessService(),
            ledgerInviteRepository,
          }),
          invitePreviewService: createLedgerInvitePreviewService(
            ledgerInvitePreviewRepository,
          ),
          service: createLedgerService({ ledgerRepository }),
          settingsService: createLedgerSettingsService({
            ledgerSettingsRepository: getLedgerSettingsRepository(),
          }),
        };
      }

      return ledgerContainer;
    },

    get merchant() {
      if (!merchantContainer) {
        merchantContainer = {
          service: createMerchantService({
            currentUserId: dependencies.auth.isAuthenticated
              ? dependencies.auth.userId
              : null,
            ledgerAccessService: getLedgerAccessService(),
            merchantRepository: getMerchantRepository(),
          }),
        };
      }

      return merchantContainer;
    },

    get statistics() {
      if (!statisticsContainer) {
        const statisticsRepository = createSupabaseStatisticsRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const transactionRepository = createSupabaseTransactionRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const ledgerAccessService = getLedgerAccessService();
        const currentUserId = dependencies.auth.isAuthenticated
          ? dependencies.auth.userId
          : null;

        statisticsContainer = {
          service: createStatisticsService({
            currentUserId,
            ledgerAccessService,
            statisticsRepository,
            transactionDashboardQueryService:
              createTransactionDashboardQueryService({
                accountQueryService: getAccountQueryService(),
                categoryQueryService: getCategoryQueryService(),
                currentUserId,
                ledgerAccessService,
                merchantQueryService: getMerchantQueryService(),
                transactionRepository,
              }),
          }),
        };
      }

      return statisticsContainer;
    },

    get transaction() {
      if (!transactionContainer) {
        const transactionRepository = createSupabaseTransactionRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const linkedTransactionItemRepository =
          createSupabaseLinkedTransactionItemRepository(
            dependencies.supabase,
            dependencies.logger,
          );
        const transactionIncomeLinkRepository =
          createSupabaseTransactionIncomeLinkRepository(
            dependencies.supabase,
            dependencies.logger,
          );
        const ledgerAccessService = getLedgerAccessService();
        const currentUserId = dependencies.auth.isAuthenticated
          ? dependencies.auth.userId
          : null;

        transactionContainer = {
          linkedTransactionItemService: createLinkedTransactionItemService({
            currentUserId,
            ledgerAccessService,
            linkedTransactionItemRepository,
            transactionRepository,
          }),
          service: createTransactionService({
            accountQueryService: getAccountQueryService(),
            categoryQueryService: getCategoryQueryService(),
            currentUserId,
            ledgerAccessService,
            merchantQueryService: getMerchantQueryService(),
            transactionIncomeLinkRepository,
            transactionRepository,
          }),
        };
      }

      return transactionContainer;
    },

    get user() {
      if (!userContainer) {
        const userRepository = createSupabaseUserRepository(
          dependencies.supabase,
          dependencies.logger,
        );

        userContainer = {
          service: createUserService({
            currentUserId: dependencies.auth.isAuthenticated
              ? dependencies.auth.userId
              : null,
            userRepository,
          }),
        };
      }

      return userContainer;
    },
  };
}
