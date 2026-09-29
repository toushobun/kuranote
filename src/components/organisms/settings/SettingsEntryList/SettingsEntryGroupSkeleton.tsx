import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { SectionCard } from "molecules/ui/SectionCard";
import { userThemeCardBorder } from "theme/userThemeCardSx";

type SettingsEntryGroupSkeletonProps = {
  count: number;
};

/** 与 SettingsEntryGroupCard 结构一致的加载骨架。 */
export function SettingsEntryGroupSkeleton({
  count,
}: SettingsEntryGroupSkeletonProps) {
  return (
    <SectionCard sx={settingsLoadingCardSx}>
      {Array.from({ length: count }, (_, index) => (
        <Stack
          direction="row"
          key={index}
          spacing={1.5}
          sx={settingsLoadingRowSx(index === count - 1)}
        >
          <Skeleton variant="circular" width={30} height={30} />
          <Skeleton width="38%" sx={{ fontSize: 16 }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton width={20} sx={{ fontSize: 16 }} />
        </Stack>
      ))}
    </SectionCard>
  );
}

const settingsLoadingCardSx = {
  overflow: "hidden",
  p: 0,
};

function settingsLoadingRowSx(isLast: boolean) {
  return {
    alignItems: "center",
    borderBottom: isLast ? 0 : userThemeCardBorder,
    minHeight: 52,
    px: 2,
    py: 1.25,
  } as const;
}
