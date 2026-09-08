import React, { useCallback, useRef } from "react";
import { Box } from "@mui/material";

interface ResizeHandleProps {
  onResize: (deltaX: number) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize }) => {
  const lastX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onResize(deltaX);
    },
    [onResize]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      lastX.current = e.clientX;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        width: "6px",
        flexShrink: 0,
        cursor: "col-resize",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          backgroundColor: "action.hover",
        },
        "&:hover::after": {
          backgroundColor: "primary.main",
        },
        "&::after": {
          content: '""',
          width: "2px",
          height: "100%",
          backgroundColor: "divider",
        },
      }}
    />
  );
};
