import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SectionCard } from "molecules/ui/SectionCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { dashboardHeroLayout as heroLayout } from "templates/dashboard/dashboardLayout";
import { userThemeCardBorder } from "theme/userThemeCardSx";

export default function DashboardLoadingPage() {
  return (
    <SectionCard
      role="status"
      aria-label="页面数据加载中"
      aria-busy="true"
      sx={dashboardLoadingFrameSx}
    >
      <DashboardHeroBackgroundSkeleton />
      <Stack spacing={1.8} sx={{ position: "relative", zIndex: 2 }}>
        <DashboardHeroPanelSkeleton />
        <AccountBalanceSkeleton />
        <QuickActionsSkeleton />
        <RecentTransactionsSkeleton />
      </Stack>
    </SectionCard>
  );
}

function DashboardHeroBackgroundSkeleton() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        height: heroLayout.backgroundHeight,
        left: 0,
        maskImage: "linear-gradient(to bottom, black 68%, transparent 100%)",
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        right: 0,
        top: 0,
        WebkitMaskImage:
          "linear-gradient(to bottom, black 68%, transparent 100%)",
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          background: "var(--user-theme-dashboard-hero-image)",
          backgroundPosition: { xs: "center top", sm: "center center" },
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          bottom: 0,
          left: 0,
          opacity: 0.32,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />
      <Box
        sx={{
          background:
            "linear-gradient(to right, var(--user-theme-card-bg), transparent)",
          bottom: 0,
          left: 0,
          opacity: heroLayout.overlayOpacity,
          position: "absolute",
          top: 0,
          width: heroLayout.overlayWidth,
        }}
      />
    </Box>
  );
}

function DashboardHeroPanelSkeleton() {
  return (
    <Stack spacing={0}>
      <Stack
        sx={{
          height: heroLayout.welcomeHeight,
          maxWidth: heroLayout.welcomeMaxWidth,
          pl: heroLayout.welcomePaddingLeft,
          pr: heroLayout.welcomePaddingRight,
          pt: heroLayout.welcomePaddingTop,
        }}
      >
        <Skeleton width={128} sx={{ fontSize: heroLayout.titleFontSize }} />
        <Stack
          spacing={heroLayout.greetingSpacing}
          sx={{
            flex: 1,
            justifyContent: "center",
            pl: heroLayout.greetingPaddingLeft,
          }}
        >
          <Skeleton
            width="72%"
            sx={{ fontSize: heroLayout.greetingFontSize }}
          />
          <Skeleton
            width="86%"
            sx={{ fontSize: heroLayout.subtitleFontSize }}
          />
        </Stack>
      </Stack>

      <Box sx={summaryGridSx}>
        {[0, 1, 2].map((index) => (
          <SectionCard key={index} sx={summaryPillSkeletonSx}>
            <Skeleton width="54%" sx={{ fontSize: 11, mx: "auto", mb: 0.3 }} />
            <Skeleton
              width="78%"
              sx={{ fontSize: { xs: 14, sm: 18 }, mx: "auto" }}
            />
          </SectionCard>
        ))}
      </Box>
    </Stack>
  );
}

function AccountBalanceSkeleton() {
  return (
    <SectionCard sx={panelSkeletonSx}>
      <Stack spacing={1.1}>
        <Stack direction="row" sx={betweenSx}>
          <Skeleton width={72} sx={{ fontSize: 15 }} />
          <Skeleton width={64} sx={{ fontSize: 12 }} />
        </Stack>
        <Stack spacing={0}>
          {[0, 1, 2].map((index) => (
            <Stack
              key={index}
              direction="row"
              spacing={1.1}
              sx={accountRowSkeletonSx}
            >
              <Skeleton
                variant="rounded"
                width={28}
                height={28}
                sx={{ borderRadius: 0.75 }}
              />
              <Skeleton width="38%" sx={{ flex: 1, fontSize: 13 }} />
              <Skeleton width={92} sx={{ fontSize: 13 }} />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </SectionCard>
  );
}

function QuickActionsSkeleton() {
  return (
    <Box sx={quickActionGridSx}>
      {[0, 1, 2, 3].map((index) => (
        <SectionCard key={index} sx={quickActionSkeletonSx}>
          <Stack spacing={0.7} sx={{ alignItems: "center" }}>
            <Skeleton
              variant="rounded"
              width={28}
              height={28}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton width="72%" sx={{ fontSize: 11 }} />
          </Stack>
        </SectionCard>
      ))}
    </Box>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <Stack spacing={1}>
      <Stack direction="row" sx={betweenSx}>
        <Typography sx={{ fontSize: 15, fontWeight: 900 }}>最近记录</Typography>
        <Skeleton width={48} sx={{ fontSize: 12 }} />
      </Stack>
      <SectionCard sx={recentListSkeletonSx}>
        <Stack spacing={0}>
          {[0, 1, 2].map((index) => (
            <Stack
              key={index}
              direction="row"
              spacing={1.2}
              sx={recentRowSkeletonSx}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <Stack spacing={0.3} sx={{ flex: 1 }}>
                <Skeleton width="58%" sx={{ fontSize: 13 }} />
                <Skeleton width="42%" sx={{ fontSize: 11 }} />
              </Stack>
              <Skeleton width={64} sx={{ fontSize: 13 }} />
            </Stack>
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}

const dashboardLoadingFrameSx = {
  background: "var(--user-theme-page-bg)",
  border: 0,
  borderRadius: heroLayout.containerBorderRadius,
  boxShadow: "none",
  mb: bottomNavigationLayout.shellPaddingBottomOffset,
  minHeight: "100dvh",
  mx: { xs: -2, sm: "calc(50% - 50vw)" },
  mt: -4,
  overflow: "hidden",
  px: heroLayout.containerPadding,
  pb: bottomNavigationLayout.dashboardContentPaddingBottom,
  pt: heroLayout.containerPadding,
  position: "relative",
  width: { xs: "calc(100% + 32px)", sm: "100vw" },
};

const summaryGridSx = {
  display: "grid",
  gap: 0.7,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  mt: { xs: 1.8, sm: 2 },
};

const summaryPillSkeletonSx = {
  borderRadius: 1.25,
  minWidth: 0,
  px: { xs: 0.8, sm: 1.2 },
  py: 1.05,
};

const panelSkeletonSx = {
  borderRadius: 1.25,
  overflow: "hidden",
  p: 1.5,
};

const betweenSx = {
  alignItems: "center",
  justifyContent: "space-between",
};

const accountRowSkeletonSx = {
  alignItems: "center",
  borderTop: userThemeCardBorder,
  minHeight: 40,
  py: 0.75,
};

const quickActionGridSx = {
  display: "grid",
  gap: 0.75,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
};

const quickActionSkeletonSx = {
  borderRadius: 1.25,
  minHeight: 68,
  px: 0.7,
  py: 1,
};

const recentListSkeletonSx = {
  borderRadius: 1.25,
  overflow: "hidden",
  px: 1.2,
  py: 0,
};

const recentRowSkeletonSx = {
  alignItems: "center",
  borderBottom: userThemeCardBorder,
  py: 1.1,
};
