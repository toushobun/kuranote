import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { routePaths } from "config/paths";
import { GoogleAuthSection } from "molecules/auth/GoogleAuthSection";
import { RegisterForm } from "organisms/auth/RegisterForm/RegisterForm";
import type {
  RegisterEmailAvailabilityState,
  RequestRegisterOtpActionState,
  SubmitRegisterOtpActionState,
} from "types/auth";

type RegisterTemplateProps = {
  checkEmailAvailabilityAction: (
    email: string,
  ) => Promise<RegisterEmailAvailabilityState>;
  googleAction?: () => Promise<void>;
  googleErrorMessage?: string;
  initialRequestOtpState?: RequestRegisterOtpActionState;
  loginHref?: string;
  requestOtpAction: (
    prevState: RequestRegisterOtpActionState,
    formData: FormData,
  ) => Promise<RequestRegisterOtpActionState>;
  submitOtpAction: (
    prevState: SubmitRegisterOtpActionState,
    formData: FormData,
  ) => Promise<SubmitRegisterOtpActionState>;
  turnstileSiteKey: string;
};

export function RegisterTemplate({
  checkEmailAvailabilityAction,
  googleAction,
  googleErrorMessage,
  initialRequestOtpState,
  loginHref = routePaths.login,
  requestOtpAction,
  submitOtpAction,
  turnstileSiteKey,
}: RegisterTemplateProps) {
  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        display: "flex",
        minHeight: "100vh",
        py: 8,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 4, sm: 5 },
          }}
        >
          <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
            KuraNote
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            创建账号后开始使用记账功能
          </Typography>

          {googleAction || googleErrorMessage ? (
            <GoogleAuthSection
              action={googleAction}
              errorMessage={googleErrorMessage}
            />
          ) : null}

          <RegisterForm
            checkEmailAvailabilityAction={checkEmailAvailabilityAction}
            initialRequestOtpState={initialRequestOtpState}
            requestOtpAction={requestOtpAction}
            submitOtpAction={submitOtpAction}
            turnstileSiteKey={turnstileSiteKey}
          />

          <Typography
            color="text.secondary"
            sx={{ mt: 3, textAlign: "center" }}
          >
            已有账号？ <Link href={loginHref}>登录</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
