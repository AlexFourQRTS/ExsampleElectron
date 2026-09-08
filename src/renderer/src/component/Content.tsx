import React, { useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import { FileDetailItem, AppSettings } from "./Tree";

interface ContentProps {
  files: FileDetailItem[];
  currentPath: string | null;
  selectedFileId?: string;
  onSelectFile: (file: FileDetailItem) => void;
  onOpenFolder: (folderPath: string) => void;
  onGoBack: () => void;
  settings?: AppSettings | null;
}

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === 0) return "--";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (dateInput?: Date): string => {
  if (!dateInput) return "--";
  const date = new Date(dateInput);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const Content: React.FC<ContentProps> = ({
  files,
  currentPath,
  selectedFileId,
  onSelectFile,
  onOpenFolder,
  onGoBack,
  settings,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [contextMenuFile, setContextMenuFile] = React.useState<FileDetailItem | null>(null);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, file: FileDetailItem) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setContextMenuFile(file);
    },
    []
  );

  const handleContextMenuClose = useCallback(() => {
    setAnchorEl(null);
    setContextMenuFile(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!contextMenuFile) return;
    try {
      await window.api.context.deleteFile(contextMenuFile.path);
      // Refresh folder
      if (currentPath) {
        const items = await window.api.getFolderFiles(currentPath);
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
        // Update files (this is a hack, should use proper state management)
        window.dispatchEvent(
          new CustomEvent("filesUpdated", { detail: itemsWithStats })
        );
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
    handleContextMenuClose();
  }, [contextMenuFile, currentPath]);

  const handleHideFolder = useCallback(async () => {
    if (!contextMenuFile || contextMenuFile.type !== "directory") return;
    try {
      await window.api.folder.hideFolder(contextMenuFile.path);
      // Refresh folder
      if (currentPath) {
        const items = await window.api.getFolderFiles(currentPath);
        // Filter should apply automatically
      }
    } catch (error) {
      console.error("Failed to hide folder:", error);
    }
    handleContextMenuClose();
  }, [contextMenuFile, currentPath]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Path header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          backgroundColor: "action.hover",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Path:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            fontWeight: 500,
          }}
        >
          {currentPath || "No folder selected"}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {files.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Folder is empty or not selected
            </Typography>
            {currentPath && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={onGoBack}
                sx={{ textTransform: "none" }}
              >
                Go back
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: 1, borderColor: "divider" }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Modified</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Size
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, width: 40 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Back button */}
                {currentPath && (
                  <TableRow
                    hover
                    onClick={onGoBack}
                    sx={{ cursor: "pointer", backgroundColor: "action.hover" }}
                  >
                    <TableCell colSpan={5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          fontWeight: 600,
                        }}
                      >
                        <FolderIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Files list */}
                {files.map((item) => {
                  const isSelected = item.id === selectedFileId;
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      selected={isSelected}
                      onClick={() => onSelectFile(item)}
                      onDoubleClick={() => {
                        if (item.type === "directory") {
                          onOpenFolder(item.path);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {item.type === "directory" ? (
                            <FolderIcon fontSize="small" color="primary" />
                          ) : (
                            <InsertDriveFileIcon
                              fontSize="small"
                              color="action"
                            />
                          )}
                          <Typography variant="body2" noWrap>
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(item.stats?.updatedAt)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.type === "directory"
                            ? "Folder"
                            : item.stats?.extension
                            ? `${item.stats.extension.toUpperCase()} file`
                            : "File"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.type === "directory"
                            ? "--"
                            : formatFileSize(item.stats?.size)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleContextMenu(e, item)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleContextMenuClose}
      >
        {contextMenuFile?.type === "directory" && (
          <>
            <MenuItem onClick={handleHideFolder}>Hide this folder</MenuItem>
            <Divider />
          </>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
        <MenuItem onClick={handleContextMenuClose}>Properties</MenuItem>
      </Menu>
    </Box>
  );
};
