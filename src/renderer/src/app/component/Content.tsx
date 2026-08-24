import React from "react";
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
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { FileDetailItem } from "./Tree";

interface ContentProps {
  files: FileDetailItem[];
  currentPath: string | null;
  selectedFileId?: string;
  onSelectFile: (file: FileDetailItem) => void;
  onOpenFolder: (folderPath: string) => void;
  onGoBack: () => void;
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
}) => {
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
      {/* Шапка с текущим путем */}
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
          Путь:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            wordBreak: "break-all",
            fontWeight: 500,
          }}
        >
          {currentPath || "Папка не выбрана"}
        </Typography>
      </Box>

      {/* Отрисовка контента */}
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
              Папка пуста или не выбрана
            </Typography>
            {currentPath && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={onGoBack}
                sx={{ textTransform: "none" }}
              >
                Вернуться на папку назад
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
                  <TableCell sx={{ fontWeight: 600 }}>Имя</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Дата изменения</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Размер
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Строка ".." для перехода на уровень вверх */}
                {currentPath && (
                  <TableRow
                    hover
                    onClick={onGoBack}
                    sx={{ cursor: "pointer", backgroundColor: "action.hover" }}
                  >
                    <TableCell colSpan={4}>
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

                {/* Список файлов и папок */}
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
                            ? "Папка"
                            : item.stats?.extension
                            ? `${item.stats.extension.toUpperCase()} файл`
                            : "Файл"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.type === "directory"
                            ? "--"
                            : formatFileSize(item.stats?.size)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};