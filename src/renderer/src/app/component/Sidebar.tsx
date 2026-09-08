import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import ImageIcon from "@mui/icons-material/Image";
import MovieIcon from "@mui/icons-material/Movie";
import FolderIcon from "@mui/icons-material/Folder";
import StorageIcon from "@mui/icons-material/Storage";
import UsbIcon from "@mui/icons-material/Usb";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Tree, FileDetailItem } from "./Tree";
import { BookmarksService, Bookmark } from "@services";
import { AppBoxTree } from "../style/AppStyle";
import "../types/api";

interface SidebarProps {
  width: number;
  currentPath: string | null;
  onFilesChange: (files: FileDetailItem[]) => void;
  onFolderSelect: (path: string) => void;
  onOpenFolder: (path: string) => void;
}

const PLACE_ICON_MAP: Record<string, React.ReactNode> = {
  home: <HomeIcon fontSize="small" />,
  desktop: <DesktopWindowsIcon fontSize="small" />,
  documents: <DescriptionIcon fontSize="small" />,
  downloads: <DownloadIcon fontSize="small" />,
  music: <MusicNoteIcon fontSize="small" />,
  pictures: <ImageIcon fontSize="small" />,
  videos: <MovieIcon fontSize="small" />,
};

interface SidebarEntry {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const bookmarksService = new BookmarksService();

export const Sidebar: React.FC<SidebarProps> = ({
  width,
  currentPath,
  onFilesChange,
  onFolderSelect,
  onOpenFolder,
}) => {
  const [places, setPlaces] = useState<SidebarEntry[]>([]);
  const [devices, setDevices] = useState<SidebarEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    loadPlaces();
    loadDevices();
    setBookmarks(bookmarksService.getAll());
  }, []);

  const loadPlaces = async () => {
    try {
      const standardPlaces = await window.api.getStandardPlaces();
      setPlaces(
        standardPlaces.map((p) => ({
          id: p.id,
          label: p.label,
          path: p.path,
          icon: PLACE_ICON_MAP[p.icon] || <FolderIcon fontSize="small" />,
        }))
      );
    } catch (error) {
      console.error("Ошибка при загрузке мест:", error);
    }
  };

  const loadDevices = async () => {
    try {
      const [root, mounted] = await Promise.all([
        window.api.getRootDevice(),
        window.api.getMountedDevices(),
      ]);

      const entries: SidebarEntry[] = [
        { id: root.id, label: root.label, path: root.mountPoint, icon: <StorageIcon fontSize="small" /> },
        ...mounted.map((d) => ({
          id: d.id,
          label: d.label,
          path: d.mountPoint,
          icon: <UsbIcon fontSize="small" />,
        })),
      ];
      setDevices(entries);
    } catch (error) {
      console.error("Ошибка при загрузке устройств:", error);
    }
  };

  const handleNavigate = (path: string) => {
    onOpenFolder(path);
  };

  const handleAddBookmark = () => {
    if (!currentPath) return;
    bookmarksService.add(currentPath);
    setBookmarks(bookmarksService.getAll());
  };

  const handleRemoveBookmark = (id: string) => {
    bookmarksService.remove(id);
    setBookmarks(bookmarksService.getAll());
  };

  const isCurrentBookmarked = currentPath ? bookmarksService.isBookmarked(currentPath) : false;

  const renderEntry = (entry: SidebarEntry, onRemove?: () => void) => {
    const isActive = currentPath === entry.path;

    return (
      <ListItemButton
        key={entry.id}
        selected={isActive}
        onClick={() => handleNavigate(entry.path)}
        sx={{
          pl: 2,
          py: 0.4,
          minHeight: 30,
          borderRadius: 1,
          "&:hover .bookmark-remove": { opacity: 1 },
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>{entry.icon}</ListItemIcon>
        <ListItemText
          primary={entry.label}
          primaryTypographyProps={{ variant: "body2", noWrap: true, fontSize: "0.85rem" }}
        />
        {onRemove && (
          <IconButton
            size="small"
            className="bookmark-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{ opacity: 0, transition: "opacity 0.15s", p: 0.3 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </ListItemButton>
    );
  };

  return (
    <Box
      sx={{
        ...AppBoxTree,
        width: `${width}px`,
        minWidth: 180,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        userSelect: "none",
        p: 1.5,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* Секция: Места */}
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, px: 1 }}>
        Места
      </Typography>
      <List component="nav" disablePadding dense sx={{ mb: 1 }}>
        {places.map((place) => renderEntry(place))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Секция: Закладки */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Закладки
        </Typography>
        <Tooltip title={isCurrentBookmarked ? "Уже в закладках" : "Добавить текущую папку"}>
          <span>
            <IconButton
              size="small"
              onClick={handleAddBookmark}
              disabled={!currentPath || isCurrentBookmarked}
              sx={{ p: 0.3 }}
            >
              {isCurrentBookmarked ? (
                <StarIcon sx={{ fontSize: 16 }} color="primary" />
              ) : (
                <AddIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <List component="nav" disablePadding dense sx={{ mb: 1 }}>
        {bookmarks.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: "block", py: 0.5 }}>
            Нет закладок
          </Typography>
        ) : (
          bookmarks.map((bookmark) =>
            renderEntry(
              { id: bookmark.id, label: bookmark.label, path: bookmark.path, icon: <StarBorderIcon fontSize="small" /> },
              () => handleRemoveBookmark(bookmark.id)
            )
          )
        )}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Секция: Устройства */}
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, px: 1 }}>
        Устройства
      </Typography>
      <List component="nav" disablePadding dense sx={{ mb: 1 }}>
        {devices.map((device) => renderEntry(device))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Секция: Дерево папок текущего места */}
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, px: 1, mb: 0.5 }}>
        Папки
      </Typography>
      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
        <Tree onFilesChange={onFilesChange} onFolderSelect={onFolderSelect} width={width} embedded />
      </Box>
    </Box>
  );
};
