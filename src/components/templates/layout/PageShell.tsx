import Container, { type ContainerProps } from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

import { designTokens } from "theme/theme";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: ContainerProps["maxWidth"];
  sx?: ContainerProps["sx"];
};

export function PageShell({ children, maxWidth = "lg", sx }: PageShellProps) {
  return (
    <Container
      component="main"
      maxWidth={maxWidth}
      sx={[
        {
          px: {
            xs: designTokens.spacing.page.mobile,
            sm: designTokens.spacing.page.desktop,
          },
          py: {
            xs: designTokens.spacing.page.mobile,
            sm: designTokens.spacing.page.desktop,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>{children}</Stack>
    </Container>
  );
}
