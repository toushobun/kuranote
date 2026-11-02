"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import { UnsavedChangesGuardProvider } from "./UnsavedChangesGuardProvider/UnsavedChangesGuardProvider";

import { theme } from "theme/theme";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UnsavedChangesGuardProvider>{children}</UnsavedChangesGuardProvider>
    </ThemeProvider>
  );
}
