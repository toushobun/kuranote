"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useActionState } from "react";

import { login, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <Box
      component="form"
      action={formAction}
      sx={{
        display: "grid",
        gap: 2,
      }}
    >
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}

      <TextField
        label="邮箱"
        name="email"
        type="email"
        autoComplete="email"
        required
        fullWidth
      />

      <TextField
        label="密码"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        fullWidth
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isPending}
        fullWidth
      >
        {isPending ? "登录中..." : "登录"}
      </Button>
    </Box>
  );
}
