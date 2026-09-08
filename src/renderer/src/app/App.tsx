import React, { useState } from "react";
import { Container, IconButton, Box, Tooltip, Typography, Button, CircularProgress } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { Tree, FileDetailItem } from "./component/Tree";
import { Content } from "./component/Content";
import { Preview } from "./component/Preview";
import { SettingsModal } from "./component/SettingsModal";
import { ResizeHandle } from "./component/ResizeHandle";
import "./types/api";

const TREE_WIDTH_KEY = "explorer_tree_width";
const PREVIEW_WIDTH_KEY = "explorer_preview_width";
const DEFAULT_TREE_WIDTH = 280;
const DEFAULT_PREVIEW_WIDTH = 340;

export default function App(): JSX.Element {
  const [files, setFiles] = useState<FileDetailItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileDetailItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [treeWidth, setTreeWidth] = useState<number>(() => {
    const saved = localStorage.getItem(TREE_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_TREE_WIDTH;
  });
  const [previewWidth, setPreviewWidth] = useState<number>(() => {
    const saved = localStorage.getItem(PREVIEW_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PREVIEW_WIDTH;
  });

  const handleTreeResize = (deltaX: number) => {
    setTreeWidth((prev) => {
      const next = Math.max(180, prev + deltaX);
      localStorage.setItem(TREE_WIDTH_KEY, String(next));
      return next;
    });
  };

  const handlePreviewResize = (deltaX: number) => {
    setPreviewWidth((prev) => {
      const next = Math.max(220, prev - deltaX);
      localStorage.setItem(PREVIEW_WIDTH_KEY, String(next));
      return next;
    });
  };

  React.useEffect(() => {
    const loadInitialPath = async () => {
      try {
        setIsLoading(true);

        // Если окно открыто с явно указанной папкой (Открыть в новом окне) — используем её
        const urlParams = new URLSearchParams(window.location.search);
        const windowPath = urlParams.get("path");

        if (windowPath) {
          await handleOpenFolder(windowPath);
          setIsLoading(false);
          return;
        }

        const savedPath = localStorage.getItem("explorer_last_path");

        if (savedPath) {
          await handleOpenFolder(savedPath);
        } else {
          const homePath = await window.api.getHomeDirectory();
          localStorage.setItem("explorer_last_path", homePath);
          await handleOpenFolder(homePath);
        }
      } catch (error) {
        console.error("Ошибка при загрузке сохраненной папки:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialPath();
  }, []);

  const handleFilesChange = (newFiles: FileDetailItem[]) => {
    setFiles(newFiles);
    setSelectedFiles([]);
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
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
      setCurrentPath(folderPath);
      handleFilesChange(itemsWithStats);
    } catch (error) {
      console.error("Ошибка при открытии папки:", error);
    }
  };

  // Вычисление пути родительской папки (на шаг назад)
  const handleGoBack = () => {
    if (!currentPath) return;
    const parts = currentPath.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length <= 1) return;
    parts.pop();
    const parentPath = currentPath.startsWith("/")
      ? "/" + parts.join("/")
      : parts.join("/");
    handleOpenFolder(parentPath);
  };

  const handleRefresh = async () => {
    if (currentPath) {
      await handleOpenFolder(currentPath);
    }
  };

  return (
    <>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          p: 2,
          boxSizing: "border-box",
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary">
              Загружаем приложение...
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mb: 1,
              }}
            >
              <Tooltip title="Настройки">
                <IconButton
                  onClick={() => setSettingsOpen(true)}
                  size="small"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {!currentPath ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <SettingsIcon sx={{ fontSize: 56, mb: 2, color: "text.secondary" }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Выберите папку для управления
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Откройте настройки и выберите папку
              </Typography>
              <Button
                variant="contained"
                onClick={() => setSettingsOpen(true)}
              >
                Открыть настройки
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              flexGrow: 1,
              gap: 0,
              overflow: "hidden",
            }}
          >
            <Tree
              onFilesChange={(newFiles) => {
                handleFilesChange(newFiles);
              }}
              onFolderSelect={setCurrentPath}
              width={treeWidth}
            />

            <ResizeHandle onResize={handleTreeResize} />

            <Content
              files={files}
              currentPath={currentPath}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
              onOpenFolder={handleOpenFolder}
              onGoBack={handleGoBack}
              onRefresh={handleRefresh}
            />

            <ResizeHandle onResize={handlePreviewResize} />

            <Preview files={selectedFiles} width={previewWidth} />
          </Box>
            )}
          </>
        )}
      </Container>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}