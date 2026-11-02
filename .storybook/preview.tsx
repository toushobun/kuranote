import { UnsavedChangesGuardProvider } from "../src/components/providers/UnsavedChangesGuardProvider/UnsavedChangesGuardProvider";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { Preview } from "@storybook/nextjs-vite";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { defaultUserThemeCssVariables } from "../src/theme/userThemeCssVariables";
import { theme } from "../src/theme/theme";
import { UserThemeProvider } from "../src/theme/UserThemeProvider";

// Story 通过 parameters.userTheme 指定初始主题 / 收支配色；未指定时使用默认主题。
type UserThemeParameters = Omit<
  ComponentProps<typeof UserThemeProvider>,
  "children"
>;

const preview: Preview = {
  decorators: [
    (Story, { parameters }): ReactNode => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserThemeProvider
          {...(parameters.userTheme as UserThemeParameters | undefined)}
        >
          <div style={defaultUserThemeCssVariables as CSSProperties}>
            <UnsavedChangesGuardProvider>
              <Story />
            </UnsavedChangesGuardProvider>
          </div>
        </UserThemeProvider>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;
