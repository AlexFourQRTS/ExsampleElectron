import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MovieIcon from "@mui/icons-material/Movie";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import DescriptionIcon from "@mui/icons-material/Description";
import { FileDetailItem } from "./Tree";
import { IMAGE_EXTS, VIDEO_EXTS, AUDIO_EXTS, TEXT_EXTS, getCleanExtension, toFileUrl } from "../utils/fileTypes";
import { ViewMode } from "@services";

interface IconGridViewProps {
  files: FileDetailItem[];
  selectedFiles: FileDetailItem[];
  size: Exclude<ViewMode, "table">;
  dragOverPath: string | null;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onSelectItem: (item: FileDetailItem, index: number, event: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, item: FileDetailItem) => void;
  onDoubleClick: (item: FileDetailItem) => void;
  onDragStart: (e: React.DragEvent, item: FileDetailItem) => void;
  onDragOverItem: (e: React.DragEvent, item: FileDetailItem) => void;
  onDragLeaveItem: () => void;
  onDropItem: (e: React.DragEvent, item: FileDetailItem) => void;
}

const SIZE_CONFIG = {
  "icons-small": { cell: 84, icon: 36, font: "0.7rem" },
  "icons-medium": { cell: 120, icon: 56, font: "0.78rem" },
  "icons-large": { cell: 168, icon: 88, font: "0.85rem" },
};

const FileThumbnail: React.FC<{ item: FileDetailItem; iconSize: number }> = ({ item, iconSize }) => {
  const ext = getCleanExtension(item.name, item.stats?.extension);
  const isImage = IMAGE_EXTS.includes(ext);
  const isVideo = VIDEO_EXTS.includes(ext);
  const isAudio = AUDIO_EXTS.includes(ext);
  const isText = TEXT_EXTS.includes(ext);

  if (item.type === "directory") {
    return <FolderIcon sx={{ fontSize: iconSize }} color="primary" />;
  }

  // Реальный предпросмотр фото прямо в значке
  if (isImage) {
    return (
      <Box
        component="img"
        src={toFileUrl(item.path)}
        alt={item.name}
        loading="lazy"
        sx={{
          width: iconSize,
          height: iconSize,
          objectFit: "cover",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
        }}
        onError={(e) => {
          // Если превью не загрузилось — скрываем img, показывать нечего
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  if (isVideo) return <MovieIcon sx={{ fontSize: iconSize }} color="action" />;
  if (isAudio) return <AudiotrackIcon sx={{ fontSize: iconSize }} color="action" />;
  if (isText) return <DescriptionIcon sx={{ fontSize: iconSize }} color="action" />;
  return <InsertDriveFileIcon sx={{ fontSize: iconSize }} color="action" />;
};

export const IconGridView: React.FC<IconGridViewProps> = ({
  files,
  selectedFiles,
  size,
  dragOverPath,
  registerRef,
  onSelectItem,
  onContextMenu,
  onDoubleClick,
  onDragStart,
  onDragOverItem,
  onDragLeaveItem,
  onDropItem,
}) => {
  const config = SIZE_CONFIG[size];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${config.cell}px, 1fr))`,
        gap: 1,
        p: 1,
        alignContent: "start",
      }}
    >
      {files.map((item, index) => {
        const isSelected = selectedFiles.some((f) => f.id === item.id);

        return (
          <Box
            key={item.id}
            data-selectable-row="true"
            ref={(el: HTMLElement | null) => registerRef(item.id, el)}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDragOver={(e) => onDragOverItem(e, item)}
            onDragLeave={onDragLeaveItem}
            onDrop={(e) => onDropItem(e, item)}
            onClick={(e) => onSelectItem(item, index, e)}
            onContextMenu={(e) => onContextMenu(e, item)}
            onDoubleClick={() => onDoubleClick(item)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              p: 1,
              borderRadius: 1.5,
              cursor: "pointer",
              userSelect: "none",
              textAlign: "center",
              backgroundColor: isSelected ? "action.selected" : "transparent",
              border: 1,
              borderColor: isSelected ? "primary.main" : "transparent",
              "&:hover": { backgroundColor: isSelected ? "action.selected" : "action.hover" },
              ...(dragOverPath === item.path && item.type === "directory" && {
                backgroundColor: "primary.main",
                opacity: 0.7,
              }),
            }}
          >
            <FileThumbnail item={item} iconSize={config.icon} />
            <Typography
              variant="caption"
              sx={{
                fontSize: config.font,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
                lineHeight: 1.2,
                maxWidth: "100%",
              }}
            >
              {item.name}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};
