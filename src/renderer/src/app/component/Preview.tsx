import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { FileDetailItem } from "./Tree";
import { IMAGE_EXTS, VIDEO_EXTS, AUDIO_EXTS, TEXT_EXTS, getCleanExtension, toFileUrl } from "../utils/fileTypes";
import "../types/api";

interface PreviewProps {
  files: FileDetailItem[];
  width?: number;
}

const formatBytes = (bytes?: number): string => {
  if (!bytes) return "--";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateInput?: Date): string => {
  if (!dateInput) return "--";
  return new Date(dateInput).toLocaleString("ru-RU");
};

export const Preview: React.FC<PreviewProps> = ({ files, width = 340 }) => {
  const file = files.length === 1 ? files[0] : null;
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [readError, setReadError] = useState<boolean>(false);
  const [folderSize, setFolderSize] = useState<number | null>(null);
  const [folderFileCount, setFolderFileCount] = useState<number | null>(null);
  const [loadingFolderStats, setLoadingFolderStats] = useState(false);

  const ext = file ? getCleanExtension(file.name, file.stats?.extension) : "";

  const isImage = IMAGE_EXTS.includes(ext);
  const isVideo = VIDEO_EXTS.includes(ext);
  const isAudio = AUDIO_EXTS.includes(ext);
  const isText = TEXT_EXTS.includes(ext);

  useEffect(() => {
    if (file && isText && file.type === "file") {
      setLoadingText(true);
      setReadError(false);

      window.api
        .readFileText(file.path)
        .then((text) => {
          setTextContent(text);
        })
        .catch((err) => {
          console.error("Ошибка чтения файла в Preview:", err);
          setReadError(true);
        })
        .finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
      setReadError(false);
    }
  }, [file?.path, isText]);

  useEffect(() => {
    if (file && file.type === "directory") {
      setLoadingFolderStats(true);
      setFolderSize(null);
      setFolderFileCount(null);

      Promise.all([
        window.api.calculateFolderSize(file.path),
        window.api.countFolderFiles(file.path),
      ])
        .then(([size, count]) => {
          setFolderSize(size);
          setFolderFileCount(count);
        })
        .catch((err) => {
          console.error("Ошибка при расчете размера папки:", err);
        })
        .finally(() => setLoadingFolderStats(false));
    } else {
      setFolderSize(null);
      setFolderFileCount(null);
    }
  }, [file?.path, file?.type]);

  // Множественный выбор — показываем список выбранных элементов
  if (files.length > 1) {
    const totalSize = files.reduce((sum, f) => sum + (f.stats?.size || 0), 0);

    return (
      <Box
        sx={{
          width: `${width}px`,
          minWidth: 220,
          flexShrink: 0,
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          height: "100%",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Выбрано элементов: {files.length}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Общий размер файлов: {formatBytes(totalSize)}
        </Typography>

        <Divider />

        <List disablePadding>
          {files.map((f) => (
            <ListItem key={f.id} disableGutters sx={{ py: 0.5, gap: 1 }}>
              <InsertDriveFileIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
              <ListItemText
                primary={f.name}
                primaryTypographyProps={{ variant: "body2", noWrap: true }}
                secondary={f.type === "directory" ? "Папка" : formatBytes(f.stats?.size)}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  if (!file) {
    return (
      <Box
        sx={{
          width: `${width}px`,
          minWidth: 220,
          flexShrink: 0,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <Typography color="text.secondary" variant="body2" textAlign="center">
          Выберите файл для предпросмотра
        </Typography>
      </Box>
    );
  }

  const fileUrl = toFileUrl(file.path);

  return (
    <Box
      sx={{
        width: `${width}px`,
        minWidth: 220,
        flexShrink: 0,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
        {file.name}
      </Typography>

      {/* ОКНО ПРЕДПРОСМОТРА (скрыто, если нет доступного предпросмотра) */}
      {(file.type === "directory" || isImage || isVideo || isAudio || (isText && !readError)) && (
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          minHeight: 220,
          maxHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "action.hover",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          p: 1,
          boxSizing: "border-box",
        }}
      >
        {/* Папка */}
        {file.type === "directory" &&
          (loadingFolderStats ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", color: "text.secondary", p: 2 }}>
              <InsertDriveFileIcon sx={{ fontSize: 56, mb: 1 }} />
              <Typography variant="body2">Папка</Typography>
              {folderSize !== null && folderFileCount !== null && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {formatBytes(folderSize)} · {folderFileCount} файлов
                </Typography>
              )}
            </Box>
          ))}

        {/* 1. Картинка */}
        {isImage && (
          <Box
            component="img"
            src={fileUrl}
            alt={file.name}
            onError={(e) => console.error("Ошибка загрузки изображения:", e)}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        )}

        {/* 2. Видео */}
        {isVideo && (
          <Box
            component="video"
            controls
            src={fileUrl}
            sx={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        )}

        {/* 3. Аудио */}
        {isAudio && <Box component="audio" controls src={fileUrl} sx={{ width: "100%" }} />}

        {/* 4. Текст / Код */}
        {isText && !readError && (
          <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
            {loadingText ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Typography
                component="pre"
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  m: 0,
                  fontSize: "0.75rem",
                }}
              >
                {textContent}
              </Typography>
            )}
          </Box>
        )}

      </Paper>
      )}

      <Divider />

      {/* ИНФОРМАЦИЯ О ФАЙЛЕ */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Информация о файле
        </Typography>

        <List size="small" disablePadding>
          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemText
              primary="Тип"
              secondary={
                file.type === "directory"
                  ? "Папка"
                  : ext
                  ? `${ext.toUpperCase()} файл`
                  : "Файл"
              }
            />
          </ListItem>

          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemText
              primary="Размер"
              secondary={
                file.type === "directory"
                  ? folderSize !== null
                    ? formatBytes(folderSize)
                    : "--"
                  : formatBytes(file.stats?.size)
              }
            />
          </ListItem>

          {file.type === "directory" && folderFileCount !== null && (
            <ListItem disableGutters sx={{ py: 0.5 }}>
              <ListItemText
                primary="Файлов"
                secondary={folderFileCount}
              />
            </ListItem>
          )}

          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemText
              primary="Создан"
              secondary={formatDate(file.stats?.createdAt)}
            />
          </ListItem>

          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemText
              primary="Изменен"
              secondary={formatDate(file.stats?.updatedAt)}
            />
          </ListItem>

          <ListItem disableGutters sx={{ py: 0.5 }}>
            <ListItemText
              primary="Путь"
              secondary={file.path}
              secondaryTypographyProps={{
                sx: { wordBreak: "break-all", fontSize: "0.75rem" },
              }}
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};