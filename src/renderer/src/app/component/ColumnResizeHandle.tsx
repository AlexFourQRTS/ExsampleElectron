import React, { useCallback, useRef } from "react";
import { Box } from "@mui/material";

interface ColumnResizeHandleProps {
  onResize: (deltaX: number) => void;
}

export const ColumnResizeHandle: React.FC<ColumnResizeHandleProps> = ({ onResize }) => {
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
      e.stopPropagation();
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
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: "absolute",
        top: 0,
        right: -3,
        width: "6px",
        height: "100%",
        cursor: "col-resize",
        zIndex: 1,
        "&:hover": {
          backgroundColor: "primary.main",
          opacity: 0.5,
        },
      }}
    />
  );
};
