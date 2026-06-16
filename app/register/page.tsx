import { register, validateRegisterEmailFormat } from "server/actions/auth";
import { redirectIfAuthenticated } from "server/loaders/login";
import { RegisterTemplate } from "templates/register/Register";

export default async function RegisterRoute() {
  await redirectIfAuthenticated();

  return (
    <RegisterTemplate
      action={register}
      validateEmailFormatAction={validateRegisterEmailFormat}
    />
  );
}
