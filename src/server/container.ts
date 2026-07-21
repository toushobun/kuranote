import { createSupabaseAuthRepository } from "server/auth/repository/authRepository";
import { createSupabaseAuthSecurityRepository } from "server/auth/repository/authSecurityRepository";
import { createCloudflareTurnstileRepository } from "server/auth/repository/turnstileRepository";
import { createAuthService } from "server/auth/service/authService";
import { isGoogleAuthEnabled } from "server/auth/googleAuthConfig";
import { createSupabaseCategoryRepository } from "server/category/repository/categoryRepository";
import { createCategoryService } from "server/category/service/categoryService";
import { createSupabaseCurrentLedgerRepository } from "server/ledger/repository/currentLedgerRepository";
import { createSupabaseLedgerInviteRepository } from "server/ledger/repository/ledgerInviteRepository";
import { createSupabaseLedgerRepository } from "server/ledger/repository/ledgerRepository";
import { createSupabaseLedgerSettingsRepository } from "server/ledger/repository/ledgerSettingsRepository";
import { createCurrentLedgerService } from "server/ledger/service/currentLedgerService";
import { createLedgerAccessService } from "server/ledger/service/ledgerAccessService";
import { createLedgerInviteService } from "server/ledger/service/ledgerInviteService";
import { createLedgerService } from "server/ledger/service/ledgerService";
import { createLedgerSettingsService } from "server/ledger/service/ledgerSettingsService";
import type { RequestDependencies } from "server/shared/context/requestDependencies";
import { createSupabaseUserRepository } from "server/user/repository/userRepository";
import { createUserService } from "server/user/service/userService";

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
  };
  readonly category: {
    readonly service: ReturnType<typeof createCategoryService>;
  };
  readonly user: {
    readonly service: ReturnType<typeof createUserService>;
  };
};

export function createRequestContainer(
  dependencies: RequestDependencies,
): RequestContainer {
  let authContainer: RequestContainer["auth"] | undefined;
  let ledgerContainer: RequestContainer["ledger"] | undefined;
  let categoryContainer: RequestContainer["category"] | undefined;
  let userContainer: RequestContainer["user"] | undefined;

  return {
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
        const categoryRepository = createSupabaseCategoryRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const ledgerSettingsRepository = createSupabaseLedgerSettingsRepository(
          dependencies.supabase,
          dependencies.logger,
        );

        categoryContainer = {
          service: createCategoryService({
            categoryRepository,
            ledgerAccessService: createLedgerAccessService(
              ledgerSettingsRepository,
            ),
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
        const ledgerSettingsRepository = createSupabaseLedgerSettingsRepository(
          dependencies.supabase,
          dependencies.logger,
        );
        const ledgerInviteRepository = createSupabaseLedgerInviteRepository(
          dependencies.supabase,
          dependencies.logger,
        );

        ledgerContainer = {
          currentLedgerService: createCurrentLedgerService({
            currentLedgerRepository,
          }),
          inviteService: createLedgerInviteService({ ledgerInviteRepository }),
          service: createLedgerService({ ledgerRepository }),
          settingsService: createLedgerSettingsService({
            ledgerSettingsRepository,
          }),
        };
      }

      return ledgerContainer;
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
