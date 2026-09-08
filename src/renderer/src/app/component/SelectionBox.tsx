import React from "react";
import { Box } from "@mui/material";
import { SelectionRect } from "../hooks/useRubberBandSelection";

interface SelectionBoxProps {
  rect: SelectionRect | null;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ rect }) => {
  if (!rect) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: "primary.main",
        opacity: 0.15,
        border: "1px solid",
        borderColor: "primary.main",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
};
