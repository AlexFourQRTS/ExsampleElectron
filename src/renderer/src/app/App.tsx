import React, { useState, useMemo } from "react";
import { Container, IconButton, Box, Tooltip, Typography, Button, CircularProgress, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AppsIcon from "@mui/icons-material/Apps";
import GridViewIcon from "@mui/icons-material/GridView";
import SortIcon from "@mui/icons-material/Sort";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckIcon from "@mui/icons-material/Check";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { FileDetailItem } from "./component/Tree";
import { Sidebar } from "./component/Sidebar";
import { Content } from "./component/Content";
import { Preview } from "./component/Preview";
import { SettingsModal } from "./component/SettingsModal";
import { ResizeHandle } from "./component/ResizeHandle";
import { createAppTheme } from "./theme/theme";
import { ThemeService, ThemeMode, ViewModeService, ViewMode, SortService, SortKey, SortDirection } from "@services";
import "./types/api";

const TREE_WIDTH_KEY = "explorer_tree_width";
const PREVIEW_WIDTH_KEY = "explorer_preview_width";
const DEFAULT_TREE_WIDTH = 280;
const DEFAULT_PREVIEW_WIDTH = 340;

// Заметно крупные иконки для показать/скрыть панель — по просьбе пользователя
// в разы больше обычных toolbar-иконок, чтобы сразу бросались в глаза
const PANEL_TOGGLE_ICON_SIZE = 48;

const SORT_LABELS: Record<SortKey, string> = {
  name: "По алфавиту",
  size: "По размеру",
  type: "По типу",
};

const themeService = new ThemeService();
const viewModeService = new ViewModeService();
const sortService = new SortService();

export default function App(): JSX.Element {
  const [files, setFiles] = useState<FileDetailItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileDetailItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => themeService.getMode());
  const [viewMode, setViewMode] = useState<ViewMode>(() => viewModeService.getViewMode());
  const [sidebarVisible, setSidebarVisible] = useState(() => viewModeService.isSidebarVisible());
  const [previewVisible, setPreviewVisible] = useState(() => viewModeService.isPreviewVisible());

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode(themeService.toggle());
  };

  const handleViewModeChange = (_: React.MouseEvent, newMode: ViewMode | null) => {
    if (!newMode) return;
    setViewMode(newMode);
    viewModeService.setViewMode(newMode);
  };

  const handleToggleSidebar = () => {
    setSidebarVisible((prev) => {
      const next = !prev;
      viewModeService.setSidebarVisible(next);
      return next;
    });
  };

  const handleTogglePreview = () => {
    setPreviewVisible((prev) => {
      const next = !prev;
      viewModeService.setPreviewVisible(next);
      return next;
    });
  };

  const [sortKey, setSortKey] = useState<SortKey>(() => sortService.getSortKey());
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => sortService.getSortDirection());
  const [sortMenuAnchor, setSortMenuAnchor] = useState<HTMLElement | null>(null);

  const sortedFiles = useMemo(
    () => sortService.sortFiles(files, sortKey, sortDirection),
    [files, sortKey, sortDirection]
  );

  const handleSelectSortKey = (key: SortKey) => {
    setSortKey(key);
    sortService.setSortKey(key);
    setSortMenuAnchor(null);
  };

  const handleToggleSortDirection = () => {
    setSortDirection((prev) => {
      const next: SortDirection = prev === "asc" ? "desc" : "asc";
      sortService.setSortDirection(next);
      return next;
    });
  };

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mb: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title={sidebarVisible ? "Скрыть боковую панель" : "Показать боковую панель"}>
                  <IconButton onClick={handleToggleSidebar} color={sidebarVisible ? "primary" : "default"}>
                    <ViewSidebarIcon sx={{ fontSize: PANEL_TOGGLE_ICON_SIZE }} />
                  </IconButton>
                </Tooltip>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                >
                  <ToggleButton value="table">
                    <Tooltip title="Таблица">
                      <TableRowsIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="icons-small">
                    <Tooltip title="Мелкие значки">
                      <AppsIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="icons-medium">
                    <Tooltip title="Средние значки">
                      <GridViewIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="icons-large">
                    <Tooltip title="Крупные значки (с предпросмотром фото)">
                      <GridViewIcon fontSize="medium" />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                <Tooltip title={`Сортировка: ${SORT_LABELS[sortKey]}`}>
                  <IconButton size="small" onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
                    <SortIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title={sortDirection === "asc" ? "По возрастанию" : "По убыванию"}>
                  <IconButton size="small" onClick={handleToggleSortDirection}>
                    {sortDirection === "asc" ? (
                      <ArrowUpwardIcon fontSize="small" />
                    ) : (
                      <ArrowDownwardIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={sortMenuAnchor}
                  open={!!sortMenuAnchor}
                  onClose={() => setSortMenuAnchor(null)}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <MenuItem key={key} onClick={() => handleSelectSortKey(key)}>
                      <ListItemIcon>
                        {sortKey === key ? <CheckIcon fontSize="small" /> : null}
                      </ListItemIcon>
                      <ListItemText>{SORT_LABELS[key]}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title={themeMode === "dark" ? "Светлая тема" : "Графитовая тема"}>
                  <IconButton onClick={handleToggleTheme} size="small">
                    {themeMode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Настройки">
                  <IconButton
                    onClick={() => setSettingsOpen(true)}
                    size="small"
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={previewVisible ? "Скрыть панель предпросмотра" : "Показать панель предпросмотра"}>
                  <IconButton onClick={handleTogglePreview} color={previewVisible ? "primary" : "default"}>
                    <ViewSidebarIcon sx={{ fontSize: PANEL_TOGGLE_ICON_SIZE, transform: "scaleX(-1)" }} />
                  </IconButton>
                </Tooltip>
              </Box>
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
            {sidebarVisible && (
              <>
                <Sidebar
                  currentPath={currentPath}
                  onFilesChange={(newFiles) => {
                    handleFilesChange(newFiles);
                  }}
                  onFolderSelect={setCurrentPath}
                  onOpenFolder={handleOpenFolder}
                  width={treeWidth}
                />

                <ResizeHandle onResize={handleTreeResize} />
              </>
            )}

            <Content
              files={sortedFiles}
              currentPath={currentPath}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
              onOpenFolder={handleOpenFolder}
              onGoBack={handleGoBack}
              onRefresh={handleRefresh}
              viewMode={viewMode}
            />

            {previewVisible && (
              <>
                <ResizeHandle onResize={handlePreviewResize} />
                <Preview files={selectedFiles} width={previewWidth} />
              </>
            )}
          </Box>
            )}
          </>
        )}
      </Container>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ThemeProvider>
  );
}