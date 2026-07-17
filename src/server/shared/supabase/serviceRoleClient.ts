import { createServiceRoleClient } from "lib/supabase/serviceRole";

/**
 * 显式创建 service-role Client，绕过 RLS。
 *
 * 只能在服务端使用；只有确有必要、经过明确审查的后台操作才允许调用，
 * 禁止把它当作默认 Client 使用，也不得自动降级或自动切换。
 * 复用 lib/supabase/serviceRole 现有实现，不重复定义 key 读取逻辑。
 */
export const createServiceRoleSupabaseClient = createServiceRoleClient;
