"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useLayoutEffect, type ReactNode } from "react";

import { subscribeUnsavedChangesHistory } from "molecules/ui/UnsavedChangesDialog/unsavedChangesHistory";

import { theme } from "theme/theme";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useLayoutEffect(() => subscribeUnsavedChangesHistory(), []);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
