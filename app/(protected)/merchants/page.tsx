import { MerchantsHome } from "merchants-page/Merchants";
import { getMerchantErrorMessage } from "utils/pageErrors";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; merchantId?: string; q?: string }>;
}) {
  const params = await searchParams;

  return (
    <MerchantsHome
      errorMerchantId={params.merchantId ?? null}
      errorMessage={getMerchantErrorMessage(params.error)}
      keyword={params.q ?? ""}
    />
  );
}
