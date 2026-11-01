import Slide, { type SlideProps } from "@mui/material/Slide";
import { forwardRef } from "react";

export const BottomSlideTransition = forwardRef<unknown, SlideProps>(
  function BottomSlideTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  },
);
