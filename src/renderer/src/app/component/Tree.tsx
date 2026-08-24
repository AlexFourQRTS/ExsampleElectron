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
}

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;
      openFolderDialog: () => Promise<string | null>;
      getItemStats: (path: string) => Promise<FileItemStats>;
      getOnlyDirectoriesTree: (path: string) => Promise<FileTreeNode>;
      getFolderFiles: (path: string) => Promise<FileTreeNode[]>;
    };
  }
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

  const handleClick = () => {
    setOpen(!open);
    onSelectFolder(node.path);
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          pl: level * 2 + 1,
          py: 0.5,
          minHeight: 32,
          borderRadius: 1,
          "&:hover": { backgroundColor: "action.hover" },
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

export const Tree: React.FC<TreeProps> = ({ onFilesChange }) => {
  const [treeData, setTreeData] = useState<FileTreeNode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Загрузка списка файлов + их метаданных при выборе папки
  const handleSelectFolder = async (folderPath: string) => {
    try {
      const items = await window.api.getFolderFiles(folderPath);

      // Получаем размеры и даты для каждого файла/папки
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

      // Отправляем файлы в родительский App
      onFilesChange(itemsWithStats);
    } catch (error) {
      console.error("Ошибка при получении файлов:", error);
    }
  };

  const handleLoadFolder = async () => {
    try {
      setLoading(true);
      const folderPath = await window.api.openFolderDialog();

      if (!folderPath) return;

      const tree = await window.api.getOnlyDirectoriesTree(folderPath);
      setTreeData(tree);

      // Загружаем файлы для корневой папки
      await handleSelectFolder(folderPath);
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
        width: 280,
        minWidth: 240,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        userSelect: "none",
        p: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
          Проводник
        </Typography>

        <Button
          variant="contained"
          size="small"
          onClick={handleLoadFolder}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? <CircularProgress size={16} /> : "Open Folder"}
        </Button>
      </Box>

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