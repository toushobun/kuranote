"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { useFormStatus } from "react-dom";

type GoogleAuthSectionProps = {
  action?: () => Promise<void>;
  errorMessage?: string;
};

function GoogleLogoIcon() {
  return (
    <SvgIcon viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.715v2.259h2.909c1.703-1.568 2.684-3.878 2.684-6.614Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.259c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.584-5.037-3.71H.956v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.963 10.709A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.169.281-1.709V4.959H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.041l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.581c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.893 11.426 0 9 0A9 9 0 0 0 .956 4.959l3.007 2.332C4.672 5.165 6.656 3.581 9 3.581Z"
      />
    </SvgIcon>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outlined"
      size="large"
      disabled={pending}
      startIcon={pending ? <CircularProgress size="1em" /> : <GoogleLogoIcon />}
      fullWidth
      sx={{
        borderColor: "divider",
        color: "text.primary",
        textTransform: "none",
      }}
    >
      {pending ? "正在连接 Google..." : "使用 Google 账号继续"}
    </Button>
  );
}

export function GoogleAuthSection({
  action,
  errorMessage,
}: GoogleAuthSectionProps) {
  return (
    <Box sx={{ display: "grid", gap: 2, mb: 3 }}>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      {action ? (
        <>
          <Box component="form" action={action}>
            <GoogleSubmitButton />
          </Box>

          <Divider>
            <Typography color="text.secondary" variant="body2">
              或
            </Typography>
          </Divider>
        </>
      ) : null}
    </Box>
  );
}
