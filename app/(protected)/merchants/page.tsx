import { MerchantsHome } from "merchants-page/Merchants";
import { getMerchantErrorMessage } from "utils/pageErrors";

type MerchantsPageProps = {
  searchParams: Promise<{
    error?: string;
    merchantId?: string;
    q?: string;
  }>;
};

export default async function MerchantsPage({
  searchParams,
}: MerchantsPageProps) {
  const params = await searchParams;

  return (
    <MerchantsHome
      errorMerchantId={params.merchantId ?? null}
      errorMessage={getMerchantErrorMessage(params.error)}
      keyword={params.q ?? ""}
    />
  );
}
