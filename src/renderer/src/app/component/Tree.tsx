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
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { AppBoxTree } from "../style/AppStyle";

// ==========================================
// ВСЯ ТИПИЗАЦИЯ В ОДНОМ МЕСТЕ
// ==========================================

export interface FileItemStats {
  size: number;
  createdAt: Date;
  updatedAt: Date;
  isFile: boolean;
  isDirectory: boolean;
  extension: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;
      openFolderDialog: () => Promise<string | null>;
      getItemStats: (path: string) => Promise<FileItemStats>;
      getDirectoryTree: (path: string) => Promise<FileTreeNode>;
      readDirectoryContent: (path: string) => Promise<FileTreeNode[]>;
    };
  }
}

// ==========================================
// ВНУТРЕННИЙ РЕКУРСИВНЫЙ КОМПОНЕНТ ДЕРЕВА
// ==========================================

interface FileTreeItemProps {
  node: FileTreeNode;
  level?: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const isDirectory = node.type === "directory";

  const handleClick = () => {
    if (isDirectory) {
      setOpen(!open);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          pl: level * 2 + 1, // Отступ для вложенности
          py: 0.5,
          minHeight: 32,
          borderRadius: 1,
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 28 }}>
          {isDirectory ? (
            open ? (
              <FolderOpenIcon fontSize="small" color="primary" />
            ) : (
              <FolderIcon fontSize="small" color="primary" />
            )
          ) : (
            <InsertDriveFileIcon fontSize="small" color="action" />
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

        {isDirectory &&
          node.children &&
          node.children.length > 0 &&
          (open ? (
            <ExpandMore fontSize="small" color="action" />
          ) : (
            <ChevronRight fontSize="small" color="action" />
          ))}
      </ListItemButton>

      {/* Вложенный список для дочерних элементов */}
      {isDirectory && node.children && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child) => (
              <FileTreeItem key={child.id} node={child} level={level + 1} />
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

export const Tree = () => {
  const [treeData, setTreeData] = useState<FileTreeNode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLoadFolder = async () => {
    try {
      setLoading(true);

      // 1. Вызываем диалог выбора папки Electron
      const folderPath = await window.api.openFolderDialog();

      // Если пользователь отменил выбор папки
      if (!folderPath) {
        return;
      }

      // 2. Строим дерево выбранной папки
      const tree = await window.api.getDirectoryTree(folderPath);
      setTreeData(tree);
    } catch (error) {
      console.error("Ошибка при загрузке файловой системы:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        ...AppBoxTree,
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
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, color: "text.secondary" }}
        >
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

      {/* Дерево файлов */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {treeData ? (
          <List component="nav" disablePadding>
            <FileTreeItem node={treeData} />
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", mt: 4 }}
          >
            Папка не выбрана
          </Typography>
        )}
      </Box>
    </Box>
  );
};