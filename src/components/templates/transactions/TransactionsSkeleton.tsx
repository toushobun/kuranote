import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { designTokens } from "theme/theme";
import { userThemeCardBorder } from "theme/userThemeCardSx";

export function TransactionsSkeleton() {
  return (
    <Stack spacing={1.2}>
      {[0, 1, 2].map((index) => (
        <Stack
          key={index}
          spacing={1.2}
          sx={{
            borderBottom: userThemeCardBorder,
            py: 1.1,
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Skeleton
              height={24}
              sx={{ borderRadius: `${designTokens.radius.md}px` }}
              width="36%"
            />
            <Skeleton
              height={24}
              sx={{ borderRadius: `${designTokens.radius.md}px` }}
              width="42%"
            />
          </Stack>
          <Skeleton
            height={60}
            sx={{ borderRadius: `${designTokens.radius.item}px` }}
            variant="rounded"
          />
          <Skeleton
            height={60}
            sx={{ borderRadius: `${designTokens.radius.item}px` }}
            variant="rounded"
          />
        </Stack>
      ))}
    </Stack>
  );
}
