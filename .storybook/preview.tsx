import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import type { Preview } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";

import { defaultUserThemeCssVariables } from "../src/theme/userThemeCssVariables";
import { theme } from "../src/theme/theme";

const preview: Preview = {
  decorators: [
    (Story): ReactNode => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* html/body 是下面这层 div 的祖先，取不到 div 上的 CSS 变量，这里补一份到 :root 上 */}
        <GlobalStyles
          styles={{ ":root": defaultUserThemeCssVariables as CSSProperties }}
        />
        <div style={defaultUserThemeCssVariables as CSSProperties}>
          <Story />
        </div>
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
