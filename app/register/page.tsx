import {
  checkRegisterEmailAvailability,
  requestRegisterOtp,
  submitRegisterOtp,
} from "server/actions/auth";
import { getTurnstileSiteKey } from "server/auth/turnstileKeys";
import { redirectIfAuthenticated } from "server/loaders/login";
import { RegisterTemplate } from "templates/register/Register";

export default async function RegisterRoute() {
  await redirectIfAuthenticated();

  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <RegisterTemplate
      checkEmailAvailabilityAction={checkRegisterEmailAvailability}
      requestOtpAction={requestRegisterOtp}
      submitOtpAction={submitRegisterOtp}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
