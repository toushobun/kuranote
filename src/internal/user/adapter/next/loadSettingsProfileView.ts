import { createRequestContainer } from "internal/container";
import { createServerRequestDependencies } from "internal/shared/context/createServerRequestDependencies";
import type { UserLedgerDisplayName } from "internal/user/entity/userLedgerDisplayName";
import type { UserProfile } from "internal/user/entity/userProfile";

export type SettingsProfileView = {
  ledgerDisplayNames: UserLedgerDisplayName[];
  profile: UserProfile;
};

/** 个人主页读取：用户资料与所属账本内的昵称，加载失败交给页面错误边界处理。 */
export async function loadSettingsProfileView(): Promise<SettingsProfileView> {
  const dependencies = await createServerRequestDependencies();
  const userService = createRequestContainer(dependencies).user.service;
  const [profile, ledgerDisplayNames] = await Promise.all([
    userService.getCurrentProfile(),
    userService.listCurrentLedgerDisplayNames(),
  ]);

  return { ledgerDisplayNames, profile };
}
