import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Divider as MuiDivider,
} from "@mui/material";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AppsIcon from "@mui/icons-material/Apps";
import TerminalIcon from "@mui/icons-material/Terminal";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import ShareIcon from "@mui/icons-material/Share";
import LinkIcon from "@mui/icons-material/Link";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import LockIcon from "@mui/icons-material/Lock";
import AlbumIcon from "@mui/icons-material/Album";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PushPinIcon from "@mui/icons-material/PushPin";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DescriptionIcon from "@mui/icons-material/Description";
import CodeIcon from "@mui/icons-material/Code";
import DataObjectIcon from "@mui/icons-material/DataObject";
import HtmlIcon from "@mui/icons-material/Html";
import CssIcon from "@mui/icons-material/Css";
import TableChartIcon from "@mui/icons-material/TableChart";
import { FileDetailItem } from "./Tree";
import { ContextMenuConfigService, ContextMenuItem, CreateFileTypesService, CreateFileType } from "@services";
import "../types/api";

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  item: FileDetailItem | null;
  selectedFiles?: FileDetailItem[];
  onClose: () => void;
  onRefresh: () => void;
  currentPath?: string | null;
  hiddenCount?: number;
  onOpenFolder?: (path: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  "open": <OpenInNewIcon fontSize="small" />,
  "open-with": <AppsIcon fontSize="small" />,
  "open-new": <OpenInNewIcon fontSize="small" />,
  "terminal": <TerminalIcon fontSize="small" />,
  "cut": <ContentCutIcon fontSize="small" />,
  "copy": <ContentCopyIcon fontSize="small" />,
  "paste": <ContentPasteIcon fontSize="small" />,
  "edit": <EditIcon fontSize="small" />,
  "delete": <DeleteIcon fontSize="small" />,
  "delete-forever": <DeleteForeverIcon fontSize="small" color="error" />,
  "share": <ShareIcon fontSize="small" />,
  "folder": <CreateNewFolderIcon fontSize="small" />,
  "file": <InsertDriveFileIcon fontSize="small" />,
  "link": <LinkIcon fontSize="small" />,
  "archive": <ArchiveIcon fontSize="small" />,
  "unarchive": <UnarchiveIcon fontSize="small" />,
  "visibility-off": <VisibilityOffIcon fontSize="small" />,
  "visibility": <VisibilityIcon fontSize="small" />,
  "lock": <LockIcon fontSize="small" />,
  "disc": <AlbumIcon fontSize="small" />,
  "package": <Inventory2Icon fontSize="small" />,
  "pin": <PushPinIcon fontSize="small" />,
  "info": <InfoIcon fontSize="small" />,
  "add": <AddIcon fontSize="small" />,
  "refresh": <RefreshIcon fontSize="small" />,
};

const CREATE_TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  "folder": <CreateNewFolderIcon fontSize="small" />,
  "text": <DescriptionIcon fontSize="small" />,
  "markdown": <DescriptionIcon fontSize="small" />,
  "json": <DataObjectIcon fontSize="small" />,
  "html": <HtmlIcon fontSize="small" />,
  "css": <CssIcon fontSize="small" />,
  "js": <CodeIcon fontSize="small" />,
  "python": <CodeIcon fontSize="small" />,
  "terminal": <TerminalIcon fontSize="small" />,
  "table": <TableChartIcon fontSize="small" />,
  "link": <LinkIcon fontSize="small" />,
};

export const ContextMenu: React.FC<ContextMenuProps> = ({
  open,
  x,
  y,
  item,
  selectedFiles = [],
  onClose,
  onRefresh,
  currentPath,
  hiddenCount = 0,
  onOpenFolder,
}) => {
  const pathsForClipboard = selectedFiles.length > 1 ? selectedFiles.map((f) => f.path) : item ? [item.path] : [];
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCreateType, setSelectedCreateType] = useState<CreateFileType | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(item?.name || "");
  const [hiddenFolders, setHiddenFolders] = useState<string[]>([]);
  const [showHiddenOpen, setShowHiddenOpen] = useState(false);
  const [compressOpen, setCompressOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [createSubmenuAnchor, setCreateSubmenuAnchor] = useState<HTMLElement | null>(null);
  const [createTypes, setCreateTypes] = useState<CreateFileType[]>([]);

  const configService = new ContextMenuConfigService();
  const createTypesService = new CreateFileTypesService();

  useEffect(() => {
    if (open) {
      const enabledItems = configService.getEnabledItems(item ? "item" : "empty");
      setMenuItems(enabledItems);
      setCreateTypes(createTypesService.getEnabledTypes());
      window.api.clipboardHasContent().then(setHasClipboard);
    } else {
      setCreateSubmenuAnchor(null);
    }
  }, [open, item]);

  const getParentPath = (): string | null => {
    if (item) {
      return item.type === "directory"
        ? item.path
        : item.path.substring(0, item.path.lastIndexOf("/"));
    }
    return currentPath || null;
  };

  const handleAction = async (actionId: string) => {
    onClose();

    switch (actionId) {
      case "open":
        if (item?.type === "directory" && onOpenFolder) {
          onOpenFolder(item.path);
        } else if (item) {
          await window.api.openWithSystem(item.path);
        }
        break;

      case "open-with":
        if (item) await window.api.openWithSystem(item.path);
        break;

      case "open-new-window":
        if (item) {
          const dirToOpen = item.type === "directory" ? item.path : getParentPath();
          if (dirToOpen) await window.api.openNewWindow(dirToOpen);
        }
        break;

      case "open-terminal": {
        const dirPath = item?.type === "directory" ? item.path : getParentPath();
        if (dirPath) await window.api.openTerminalAt(dirPath);
        break;
      }

      case "cut":
        if (pathsForClipboard.length > 0) await window.api.clipboardCut(pathsForClipboard);
        break;

      case "copy":
        if (pathsForClipboard.length > 0) await window.api.clipboardCopy(pathsForClipboard);
        break;

      case "paste": {
        const targetDir = item?.type === "directory" ? item.path : currentPath;
        if (targetDir) {
          await window.api.clipboardPaste(targetDir);
          onRefresh();
        }
        break;
      }

      case "rename":
        setNewName(item?.name || "");
        setRenameOpen(true);
        break;

      case "delete-trash":
      case "delete-permanent":
        await handleDelete();
        break;

      case "compress":
        setArchiveName(item ? `${item.name}.zip` : "archive.zip");
        setCompressOpen(true);
        break;

      case "extract":
        await handleExtract();
        break;

      case "hide-folder":
        await handleHideFolder();
        break;

      case "show-hidden":
        await loadHiddenFolders();
        break;

      case "make-executable":
        await handleMakeExecutable();
        break;

      case "properties":
        setPropertiesOpen(true);
        break;

      case "refresh":
        onRefresh();
        break;

      default:
        console.log(`Действие "${actionId}" пока не реализовано`);
    }
  };

  const handleCreateClick = (event: React.MouseEvent<HTMLElement>) => {
    setCreateSubmenuAnchor(event.currentTarget);
  };

  const handleSelectCreateType = (type: CreateFileType) => {
    setSelectedCreateType(type);
    setNewItemName(type.defaultName);
    setCreateSubmenuAnchor(null);
    setCreateDialogOpen(true);
    onClose();
  };

  const handleCreateConfirm = async () => {
    if (!newItemName.trim() || !selectedCreateType) return;
    const parentPath = getParentPath();
    if (!parentPath) return;

    try {
      if (selectedCreateType.isFolder) {
        await window.api.createFolder(parentPath, newItemName);
      } else {
        await window.api.createFile(parentPath, newItemName);
      }
      setNewItemName("");
      setCreateDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при создании:", error);
    }
  };

  const handleDelete = async () => {
    if (pathsForClipboard.length === 0) return;

    const confirmMessage =
      selectedFiles.length > 1
        ? `Вы уверены, что хотите удалить ${selectedFiles.length} элементов?`
        : `Вы уверены, что хотите удалить "${item?.name}"?`;

    const confirmed = confirm(confirmMessage);
    if (!confirmed) return;

    try {
      for (const path of pathsForClipboard) {
        await window.api.deleteItem(path);
      }
      onRefresh();
    } catch (error) {
      console.error("Ошибка при удалении:", error);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || !item) return;

    try {
      await window.api.renameItem(item.path, newName);
      setNewName("");
      setRenameOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при переименовании:", error);
    }
  };

  const loadHiddenFolders = async () => {
    if (!currentPath) return;
    try {
      const hidden = await window.api.getHiddenFolders(currentPath);
      setHiddenFolders(hidden);
      setShowHiddenOpen(true);
    } catch (error) {
      console.error("Ошибка при загрузке скрытых папок:", error);
    }
  };

  const handleHideFolder = async () => {
    if (!item || item.type !== "directory") return;

    try {
      await window.api.hideFolder(item.path);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при скрытии папки:", error);
    }
  };

  const handleShowFolder = async (folderPath: string) => {
    try {
      await window.api.showFolder(folderPath);
      const updated = hiddenFolders.filter((p) => p !== folderPath);
      setHiddenFolders(updated);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при отображении папки:", error);
    }
  };

  const handleCompress = async () => {
    if (!item || !archiveName.trim()) return;
    const parentPath = item.path.substring(0, item.path.lastIndexOf("/"));
    const outputPath = `${parentPath}/${archiveName}`;

    try {
      await window.api.compressItems([item.path], outputPath);
      setCompressOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при создании архива:", error);
      alert("Ошибка при создании архива. Убедитесь, что установлен zip/tar.");
    }
  };

  const handleExtract = async () => {
    if (!item) return;

    try {
      const isArchive = await window.api.isArchive(item.path);
      if (!isArchive) {
        alert("Этот файл не является архивом");
        return;
      }
      const outputDir = item.path.substring(0, item.path.lastIndexOf("/"));
      await window.api.extractArchive(item.path, outputDir);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при извлечении архива:", error);
      alert("Ошибка при извлечении архива");
    }
  };

  const handleMakeExecutable = async () => {
    if (!item) return;

    try {
      await window.api.makeExecutable(item.path);
      onRefresh();
    } catch (error) {
      console.error("Ошибка при установке прав выполнения:", error);
      alert("Не удалось установить права выполнения");
    }
  };

  const isItemDisabled = (menuItem: ContextMenuItem): boolean => {
    if (menuItem.id === "paste") return !hasClipboard;
    if (menuItem.id === "hide-folder") return !item || item.type !== "directory";
    if (menuItem.id === "show-hidden") return hiddenCount === 0;
    if (menuItem.id === "extract") return !item || !item.name.match(/\.(zip|tar|tar\.gz|tgz)$/i);
    return false;
  };

  return (
    <>
      <Menu
        open={open}
        onClose={onClose}
        anchorReference="anchorPosition"
        anchorPosition={{ top: y, left: x }}
      >
        {item && selectedFiles.length > 1 && (
          <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Выбрано элементов: {selectedFiles.length}
            </Typography>
          </Box>
        )}

        {item && selectedFiles.length <= 1 && (
          <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {item.type === "directory" ? (
                <CreateNewFolderIcon fontSize="small" color="primary" />
              ) : (
                <InsertDriveFileIcon fontSize="small" color="action" />
              )}
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {item.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.type === "directory"
                ? "Папка"
                : item.stats?.extension
                ? `${item.stats.extension.toUpperCase()} файл`
                : "Файл"}
            </Typography>
          </Box>
        )}
        {item && <MuiDivider sx={{ my: 0.5 }} />}

        {menuItems.map((menuItem) => {
          if (menuItem.type === "divider") {
            return <MuiDivider key={menuItem.id} sx={{ my: 0.5 }} />;
          }

          if (menuItem.id === "show-hidden" && hiddenCount > 0) {
            return (
              <MenuItem
                key={menuItem.id}
                onClick={() => handleAction(menuItem.id)}
              >
                <ListItemIcon>{ICON_MAP[menuItem.icon || ""]}</ListItemIcon>
                <ListItemText>Показать скрытые ({hiddenCount})</ListItemText>
              </MenuItem>
            );
          }

          if (menuItem.id === "show-hidden") return null;

          if (menuItem.type === "submenu" && menuItem.id === "create") {
            return (
              <MenuItem key={menuItem.id} onClick={handleCreateClick}>
                <ListItemIcon>{ICON_MAP[menuItem.icon || ""]}</ListItemIcon>
                <ListItemText>{menuItem.label}</ListItemText>
                <ChevronRightIcon fontSize="small" sx={{ ml: 1, color: "text.secondary" }} />
              </MenuItem>
            );
          }

          return (
            <MenuItem
              key={menuItem.id}
              onClick={() => handleAction(menuItem.id)}
              disabled={isItemDisabled(menuItem)}
              sx={
                menuItem.id.includes("delete")
                  ? { color: "error.main" }
                  : undefined
              }
            >
              <ListItemIcon>{ICON_MAP[menuItem.icon || ""]}</ListItemIcon>
              <ListItemText>{menuItem.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Подменю "Создать" */}
      <Menu
        anchorEl={createSubmenuAnchor}
        open={!!createSubmenuAnchor}
        onClose={() => setCreateSubmenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {createTypes.map((type) => (
          <MenuItem key={type.id} onClick={() => handleSelectCreateType(type)}>
            <ListItemIcon>{CREATE_TYPE_ICON_MAP[type.icon]}</ListItemIcon>
            <ListItemText>{type.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Диалог создания элемента */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Создать: {selectedCreateType?.label}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label={selectedCreateType?.isFolder ? "Имя папки" : "Имя файла"}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleCreateConfirm();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateConfirm} variant="contained">
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог переименования */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)}>
        <DialogTitle>Переименовать</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Старое имя: {item?.name}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Новое имя"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Отмена</Button>
          <Button onClick={handleRename} variant="contained">
            Переименовать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог показа скрытых папок */}
      <Dialog open={showHiddenOpen} onClose={() => setShowHiddenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Скрытые папки ({hiddenFolders.length})</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {hiddenFolders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет скрытых папок
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {hiddenFolders.map((folderPath) => (
                  <Box
                    key={folderPath}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1,
                      backgroundColor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ wordBreak: "break-all", flexGrow: 1 }}>
                      {folderPath}
                    </Typography>
                    <Button size="small" onClick={() => handleShowFolder(folderPath)} variant="outlined">
                      Показать
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHiddenOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог сжатия в архив */}
      <Dialog open={compressOpen} onClose={() => setCompressOpen(false)}>
        <DialogTitle>Создать архив</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Имя архива"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              helperText="Поддерживаются форматы .zip и .tar.gz"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompressOpen(false)}>Отмена</Button>
          <Button onClick={handleCompress} variant="contained">
            Создать архив
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог свойств */}
      <Dialog open={propertiesOpen} onClose={() => setPropertiesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Свойства</DialogTitle>
        <DialogContent>
          {item && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Имя</Typography>
                <Typography variant="body2">{item.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Путь</Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>{item.path}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Тип</Typography>
                <Typography variant="body2">
                  {item.type === "directory" ? "Папка" : `${item.stats?.extension?.toUpperCase() || ""} файл`}
                </Typography>
              </Box>
              {item.stats && (
                <>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Размер</Typography>
                    <Typography variant="body2">{item.stats.size} байт</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Создан</Typography>
                    <Typography variant="body2">{new Date(item.stats.createdAt).toLocaleString("ru-RU")}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Изменен</Typography>
                    <Typography variant="body2">{new Date(item.stats.updatedAt).toLocaleString("ru-RU")}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPropertiesOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
