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

interface PreviewProps {
  file: FileDetailItem | null;
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

// Расширенный список всех текстовых и код-файлов
const TEXT_EXTS = [
  "txt", "md", "log", "csv", "xml", "json", "yaml", "yml", "toml", "env", "ini", "conf",
  "html", "css", "scss", "sass", "less", "js", "ts", "jsx", "tsx", "vue", "svelte",
  "py", "sh", "bash", "php", "sql", "java", "cs", "cpp", "c", "h", "go", "rs", "rb"
];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov"];
const AUDIO_EXTS = ["mp3", "wav", "ogg", "aac"];

export const Preview: React.FC<PreviewProps> = ({ file }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [readError, setReadError] = useState<boolean>(false);

// Получаем расширение, гарантированно убирая точку и пробелы
  const getCleanExt = (): string => {
    if (!file) return "";
    const raw = file.stats?.extension || file.name.split(".").pop() || "";
    return raw.toLowerCase().replace(/^\./, "").trim();
  };

  const ext = getCleanExt();

  const isImage = IMAGE_EXTS.includes(ext);
  const isVideo = VIDEO_EXTS.includes(ext);
  const isAudio = AUDIO_EXTS.includes(ext);
  const isText = TEXT_EXTS.includes(ext);

  // Чтение текста через IPC
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

  if (!file) {
    return (
      <Box
        sx={{
          width: 320,
          minWidth: 280,
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

  // Корректное формирование file:// URL с заменой Windows слэшей \ на /
  const cleanPath = file.path.replace(/\\/g, "/");
  const fileUrl = cleanPath.startsWith("/") ? `file://${cleanPath}` : `file:///${cleanPath}`;

  return (
    <Box
      sx={{
        width: 340,
        minWidth: 300,
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

      {/* ОКНО ПРЕДПРОСМОТРА */}
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

        {/* 5. Неизвестный формат или ошибка */}
        {(!isImage && !isVideo && !isAudio && !isText) || readError ? (
          <Box sx={{ textAlign: "center", color: "text.secondary" }}>
            <InsertDriveFileIcon sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="caption" display="block">
              Предпросмотр недоступен
            </Typography>
          </Box>
        ) : null}
      </Paper>

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
              secondary={file.type === "directory" ? "--" : formatBytes(file.stats?.size)}
            />
          </ListItem>

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