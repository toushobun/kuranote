import { merchantPageMessages, merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { LoadingState } from "molecules/ui/LoadingState";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

export default function MerchantCreateLoading() {
  return (
    <SettingsPageLayout
      back={{
        href: routePaths.merchants,
        label: merchantPageMessages.backToMerchants,
      }}
      subtitle={merchantPageMessages.createSubtitle}
      title={merchantText.create}
    >
      <LoadingState description="新增商家页面准备中，请稍等。" />
    </SettingsPageLayout>
  );
}
