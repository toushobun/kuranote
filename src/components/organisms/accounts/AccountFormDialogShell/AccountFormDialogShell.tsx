import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Slide, { type SlideProps } from "@mui/material/Slide";
import { forwardRef, type ReactNode } from "react";

import { useUserTheme } from "theme/UserThemeProvider";
import type { UserThemeKey } from "theme/userThemeTokens";

const accountIllustrationByTheme = {
  amberWarmth:
    "/assets/kura-account-form/account_illustration_amber_warmth.png",
  deepSeaStarlight:
    "/assets/kura-account-form/account_illustration_deep_sea.png",
  emeraldMorning:
    "/assets/kura-account-form/account_illustration_emerald_morning.png",
  flameRed: "/assets/kura-account-form/account_illustration_crimson_flame.png",
  lavenderDream:
    "/assets/kura-account-form/account_illustration_lavender_dream.png",
  sakuraStory:
    "/assets/kura-account-form/account_illustration_sakura_story.png",
} satisfies Record<UserThemeKey, string>;

type AccountFormDialogShellProps = {
  children: ReactNode;
  illustrationSlot?: ReactNode;
  onClose: () => void;
  open: boolean;
};

const BottomSheetTransition = forwardRef<unknown, SlideProps>(
  function BottomSheetTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  },
);

export function AccountFormDialogShell({
  children,
  illustrationSlot,
  onClose,
  open,
}: AccountFormDialogShellProps) {
  return (
    <Dialog
      disableEnforceFocus
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
      slots={{ transition: BottomSheetTransition }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "28px 28px 0 0",
            m: 0,
            maxHeight: "calc(100% - 24px)",
            overflow: "visible",
            position: "relative",
            width: { xs: "100%", sm: 444 },
          },
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "flex-end",
        },
      }}
    >
      {illustrationSlot != null && (
        <Box
          aria-hidden="true"
          sx={{
            pointerEvents: "none",
            position: "absolute",
            right: { xs: 16, sm: 24 },
            top: { xs: 8, sm: 4 },
            zIndex: 1,
          }}
        >
          {illustrationSlot}
        </Box>
      )}
      <DialogContent sx={{ overflow: "auto", px: { xs: 2.4, sm: 3 }, py: 2.4 }}>
        <Box
          aria-hidden="true"
          sx={{
            bgcolor: "divider",
            borderRadius: 999,
            height: 4,
            mb: 2.4,
            mx: "auto",
            width: 48,
          }}
        />
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function AccountDialogIllustrationSlot() {
  const { themeKey } = useUserTheme();
  const illustrationSrc = accountIllustrationByTheme[themeKey];

  return (
    <Box
      alt=""
      aria-hidden="true"
      component="img"
      src={illustrationSrc}
      sx={{
        display: "block",
        height: { xs: 120, sm: 136 },
        objectFit: "contain",
        width: { xs: 120, sm: 136 },
      }}
    />
  );
}
