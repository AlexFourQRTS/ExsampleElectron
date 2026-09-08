import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { AppBoxTree } from "../style/AppStyle";

import "../types/api";

// ==========================================
// ТИПИЗАЦИЯ
// ==========================================

export interface FileItemStats {
  size: number;
  createdAt: Date;
  updatedAt: Date;
  isFile: boolean;
  isDirectory: boolean;
  extension: string;
}

export interface FileDetailItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  stats?: FileItemStats;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

interface TreeProps {
  onFilesChange: (files: FileDetailItem[]) => void;
  onFolderSelect?: (path: string) => void;
  width?: number;
}

// ==========================================
// ЭЛЕМЕНТ ДЕРЕВА (ПАПКИ)
// ==========================================

interface FileTreeItemProps {
  node: FileTreeNode;
  level?: number;
  onSelectFolder: (folderPath: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level = 0,
  onSelectFolder,
}) => {
  const [open, setOpen] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    setOpen(!open);
    onSelectFolder(node.path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/x-explorer-paths");
    if (!raw) return;

    try {
      const paths: string[] = JSON.parse(raw);
      await window.api.moveItems(paths, node.path);
    } catch (error) {
      console.error("Ошибка при перемещении файлов:", error);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        sx={{
          pl: level * 2 + 1,
          py: 0.5,
          minHeight: 32,
          borderRadius: 1,
          "&:hover": { backgroundColor: "action.hover" },
          ...(isDragOver && { backgroundColor: "primary.main", opacity: 0.3 }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          {open ? (
            <FolderOpenIcon fontSize="small" color="primary" />
          ) : (
            <FolderIcon fontSize="small" color="primary" />
          )}
        </ListItemIcon>

        <ListItemText
          primary={node.name}
          primaryTypographyProps={{
            variant: "body2",
            noWrap: true,
            fontSize: "0.85rem",
          }}
        />

        {node.children && node.children.length > 0 && (
          open ? <ExpandMore fontSize="small" color="action" /> : <ChevronRight fontSize="small" color="action" />
        )}
      </ListItemButton>

      {node.children && node.children.length > 0 && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                onSelectFolder={onSelectFolder}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// ==========================================
// ОСНОВНОЙ КОМПОНЕНТ TREE
// ==========================================

export const Tree: React.FC<TreeProps> = ({ onFilesChange, onFolderSelect, width = 280 }) => {
  const [treeData, setTreeData] = useState<FileTreeNode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadSavedPath = () => {
    try {
      const saved = localStorage.getItem("explorer_last_path");
      if (saved) {
        return saved;
      }
    } catch {
      // Игнорируем ошибки localStorage
    }
    return null;
  };

  const savePath = (path: string) => {
    try {
      localStorage.setItem("explorer_last_path", path);
    } catch {
      // Игнорируем ошибки localStorage
    }
  };

  const handleSelectFolder = async (folderPath: string) => {
    try {
      if (onFolderSelect) {
        onFolderSelect(folderPath);
      }

      savePath(folderPath);

      const items = await window.api.getFolderFilesFiltered(folderPath);

      const itemsWithStats = await Promise.all(
        items.map(async (item) => {
          try {
            const stats = await window.api.getItemStats(item.path);
            return { ...item, stats };
          } catch {
            return item;
          }
        })
      );

      onFilesChange(itemsWithStats);
    } catch (error) {
      console.error("Ошибка при получении файлов:", error);
    }
  };

  React.useEffect(() => {
    const initializeTree = async () => {
      try {
        const savedPath = loadSavedPath();
        if (savedPath) {
          setLoading(true);
          const tree = await window.api.getOnlyDirectoriesTreeFiltered(savedPath);
          setTreeData(tree);
          await handleSelectFolder(savedPath);
        }
      } catch (error) {
        console.error("Ошибка при инициализации дерева:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeTree();
  }, []);

  const loadTreeFromPath = async (folderPath: string) => {
    try {
      setLoading(true);
      const tree = await window.api.getOnlyDirectoriesTreeFiltered(folderPath);
      setTreeData(tree);
      await handleSelectFolder(folderPath);
    } catch (error) {
      console.error("Ошибка при загрузке дерева:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFolder = async () => {
    try {
      setLoading(true);
      const folderPath = await window.api.openFolderDialog();

      if (!folderPath) return;

      await loadTreeFromPath(folderPath);
    } catch (error) {
      console.error("Ошибка при загрузке дерева:", error);
    } finally {
      setLoading(false);
    }
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
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary", mb: 1.5 }}>
        Папки
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {treeData ? (
          <List component="nav" disablePadding>
            <FileTreeItem node={treeData} onSelectFolder={handleSelectFolder} />
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
            Папка не выбрана
          </Typography>
        )}
      </Box>
    </Box>
  );
};