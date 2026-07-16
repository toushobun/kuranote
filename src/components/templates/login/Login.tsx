import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { routePaths } from "config/paths";
import { GoogleAuthSection } from "molecules/auth/GoogleAuthSection";
import { LoginForm } from "organisms/auth/LoginForm";

type LoginTemplateProps = {
  action: Parameters<typeof LoginForm>[0]["action"];
  defaultEmail?: string;
  googleAction?: () => Promise<void>;
  googleErrorMessage?: string;
  registerHref?: string;
};

export function LoginTemplate({
  action,
  defaultEmail = "",
  googleAction,
  googleErrorMessage,
  registerHref = routePaths.register,
}: LoginTemplateProps) {
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
            登录后开始使用记账功能
          </Typography>

          {googleAction || googleErrorMessage ? (
            <GoogleAuthSection
              action={googleAction}
              errorMessage={googleErrorMessage}
            />
          ) : null}

          <LoginForm action={action} defaultEmail={defaultEmail} />

          <Typography
            color="text.secondary"
            sx={{ mt: 3, textAlign: "center" }}
          >
            还没有账号？ <Link href={registerHref}>注册</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
