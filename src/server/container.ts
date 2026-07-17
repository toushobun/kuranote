import { createSupabaseCategoryRepository } from "server/category/repository/categoryRepository";
import { createCategoryService } from "server/category/service/categoryService";
import { createSupabaseLedgerInviteRepository } from "server/ledger/repository/ledgerInviteRepository";
import { createLedgerInviteService } from "server/ledger/service/ledgerInviteService";
import type { RequestDependencies } from "server/shared/context/requestDependencies";

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
  readonly ledger: {
    readonly inviteService: ReturnType<typeof createLedgerInviteService>;
  };
  readonly category: {
    readonly service: ReturnType<typeof createCategoryService>;
  };
};

export function createRequestContainer(
  dependencies: RequestDependencies,
): RequestContainer {
  let ledgerContainer: RequestContainer["ledger"] | undefined;
  let categoryContainer: RequestContainer["category"] | undefined;

  return {
    get category() {
      if (!categoryContainer) {
        const categoryRepository = createSupabaseCategoryRepository(
          dependencies.supabase,
        );

        categoryContainer = {
          service: createCategoryService({ categoryRepository }),
        };
      }

      return categoryContainer;
    },

    get ledger() {
      if (!ledgerContainer) {
        const ledgerInviteRepository = createSupabaseLedgerInviteRepository(
          dependencies.supabase,
        );

        ledgerContainer = {
          inviteService: createLedgerInviteService({ ledgerInviteRepository }),
        };
      }

      return ledgerContainer;
    },
  };
}
