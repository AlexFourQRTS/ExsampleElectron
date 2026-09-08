import React, { useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { FileDetailItem } from "./Tree";
import { ContextMenu } from "./ContextMenu";
import { ColumnResizeHandle } from "./ColumnResizeHandle";
import { SelectionBox } from "./SelectionBox";
import { IconGridView } from "./IconGridView";
import { useRubberBandSelection, SelectionRect } from "../hooks/useRubberBandSelection";
import { ViewMode } from "@services";
import "../types/api";

const COLUMN_WIDTHS_KEY = "explorer_column_widths";

interface ColumnWidths {
  name: number;
  date: number;
  type: number;
  size: number;
}

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  name: 280,
  date: 180,
  type: 140,
  size: 160,
};

const loadColumnWidths = (): ColumnWidths => {
  try {
    const stored = localStorage.getItem(COLUMN_WIDTHS_KEY);
    if (stored) return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(stored) };
  } catch {
    // Игнорируем ошибки localStorage
  }
  return DEFAULT_COLUMN_WIDTHS;
};

interface ContentProps {
  files: FileDetailItem[];
  currentPath: string | null;
  selectedFiles: FileDetailItem[];
  onSelectionChange: (files: FileDetailItem[]) => void;
  onOpenFolder: (folderPath: string) => void;
  onGoBack: () => void;
  onRefresh?: () => void;
  viewMode: ViewMode;
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
  selectedFiles,
  onSelectionChange,
  onOpenFolder,
  onGoBack,
  onRefresh,
  viewMode,
}) => {
  const lastClickedIndex = React.useRef<number>(-1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<FileDetailItem | null>(null);
  const [folderStats, setFolderStats] = useState<Record<string, { size: number; fileCount: number }>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [hiddenCount, setHiddenCount] = useState(0);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(loadColumnWidths);

  const handleColumnResize = (column: keyof ColumnWidths, deltaX: number) => {
    setColumnWidths((prev) => {
      const next = { ...prev, [column]: Math.max(60, prev[column] + deltaX) };
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ===== Выделение мышкой (rubber-band selection) =====
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef<Map<string, HTMLElement>>(new Map());
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  const handleSelectionEnd = (rect: SelectionRect) => {
    const selected: FileDetailItem[] = [];

    files.forEach((item) => {
      const rowEl = rowRefs.current.get(item.id);
      const containerEl = scrollContainerRef.current;
      if (!rowEl || !containerEl) return;

      const rowTop = rowEl.offsetTop;
      const rowBottom = rowTop + rowEl.offsetHeight;
      const rowLeft = rowEl.offsetLeft;
      const rowRight = rowLeft + rowEl.offsetWidth;

      const intersects =
        rect.x < rowRight &&
        rect.x + rect.width > rowLeft &&
        rect.y < rowBottom &&
        rect.y + rect.height > rowTop;

      if (intersects) selected.push(item);
    });

    onSelectionChange(selected);
  };

  const { selectionRect, handleMouseDown } = useRubberBandSelection({
    containerRef: scrollContainerRef,
    onSelectionEnd: handleSelectionEnd,
  });

  // ===== Ctrl+A — выделить все файлы =====
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const active = document.activeElement;
        const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
        if (isTyping) return;

        e.preventDefault();
        onSelectionChange(files);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, onSelectionChange]);

  // ===== Drag & Drop файлов между папками/окнами =====
  const handleDragStart = (e: React.DragEvent, item: FileDetailItem) => {
    const draggedPaths = selectedFiles.some((f) => f.id === item.id)
      ? selectedFiles.map((f) => f.path)
      : [item.path];

    e.dataTransfer.setData("application/x-explorer-paths", JSON.stringify(draggedPaths));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverRow = (e: React.DragEvent, item: FileDetailItem) => {
    if (item.type !== "directory") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPath(item.path);
  };

  const handleDragLeaveRow = () => {
    setDragOverPath(null);
  };

  const handleDropOnRow = async (e: React.DragEvent, item: FileDetailItem) => {
    e.preventDefault();
    setDragOverPath(null);
    if (item.type !== "directory") return;
    await performDrop(e, item.path);
  };

  const handleDropOnEmptyArea = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);
    if (!currentPath) return;
    await performDrop(e, currentPath);
  };

  const performDrop = async (e: React.DragEvent, targetDir: string) => {
    const raw = e.dataTransfer.getData("application/x-explorer-paths");
    if (!raw) return;

    try {
      const paths: string[] = JSON.parse(raw);
      const filtered = paths.filter((p) => {
        const parentOfTarget = targetDir.substring(0, targetDir.lastIndexOf("/"));
        return p !== targetDir && parentOfTarget !== p;
      });
      if (filtered.length === 0) return;

      await window.api.moveItems(filtered, targetDir);
      onRefresh?.();
    } catch (error) {
      console.error("Ошибка при перемещении файлов:", error);
    }
  };

  React.useEffect(() => {
    if (currentPath) {
      window.api
        .countHiddenFolders(currentPath)
        .then((count) => setHiddenCount(count))
        .catch(() => setHiddenCount(0));
    }
  }, [currentPath]);

  const handleContextMenu = (e: React.MouseEvent, item: FileDetailItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Если правый клик по элементу вне текущего выделения — заменяем выделение на него
    const isInSelection = selectedFiles.some((f) => f.id === item.id);
    if (!isInSelection) {
      onSelectionChange([item]);
    }
    setSelectedItem(item);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleEmptyAreaContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedItem(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSelectItem = async (item: FileDetailItem, index: number, event: React.MouseEvent) => {
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isShift && lastClickedIndex.current !== -1) {
      const start = Math.min(lastClickedIndex.current, index);
      const end = Math.max(lastClickedIndex.current, index);
      const range = files.slice(start, end + 1);
      onSelectionChange(range);
    } else if (isCtrl) {
      const isSelected = selectedFiles.some((f) => f.id === item.id);
      const updated = isSelected
        ? selectedFiles.filter((f) => f.id !== item.id)
        : [...selectedFiles, item];
      onSelectionChange(updated);
      lastClickedIndex.current = index;
    } else {
      onSelectionChange([item]);
      lastClickedIndex.current = index;
    }

    if (item.type === "directory" && !folderStats[item.path]) {
      setLoadingStats((prev) => ({ ...prev, [item.path]: true }));
      try {
        const [size, fileCount] = await Promise.all([
          window.api.calculateFolderSize(item.path),
          window.api.countFolderFiles(item.path),
        ]);
        setFolderStats((prev) => ({
          ...prev,
          [item.path]: { size, fileCount },
        }));
      } catch (error) {
        console.error("Ошибка при расчете размера папки:", error);
      } finally {
        setLoadingStats((prev) => ({ ...prev, [item.path]: false }));
      }
    }
  };

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
      <Box
        ref={scrollContainerRef}
        sx={{ flexGrow: 1, overflowY: "auto", position: "relative" }}
        onContextMenu={handleEmptyAreaContextMenu}
        onMouseDown={handleMouseDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnEmptyArea}
      >
        <SelectionBox rect={selectionRect} />
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
        ) : viewMode !== "table" ? (
          <IconGridView
            files={files}
            selectedFiles={selectedFiles}
            size={viewMode}
            dragOverPath={dragOverPath}
            registerRef={(id, el) => {
              if (el) rowRefs.current.set(id, el);
              else rowRefs.current.delete(id);
            }}
            onSelectItem={handleSelectItem}
            onContextMenu={handleContextMenu}
            onDoubleClick={(item) => {
              if (item.type === "directory") onOpenFolder(item.path);
            }}
            onDragStart={handleDragStart}
            onDragOverItem={handleDragOverRow}
            onDragLeaveItem={handleDragLeaveRow}
            onDropItem={handleDropOnRow}
          />
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: 1, borderColor: "divider", minHeight: "100%" }}
          >
            <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.name,
                      position: "relative",
                      overflow: "hidden",
                      borderRight: 1,
                      borderRightColor: "divider",
                    }}
                  >
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Название</Box>
                    <ColumnResizeHandle onResize={(dx) => handleColumnResize("name", dx)} />
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.type,
                      position: "relative",
                      overflow: "hidden",
                      borderRight: 1,
                      borderRightColor: "divider",
                    }}
                  >
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Тип</Box>
                    <ColumnResizeHandle onResize={(dx) => handleColumnResize("type", dx)} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      width: columnWidths.size,
                      position: "relative",
                      overflow: "hidden",
                      borderRight: 1,
                      borderRightColor: "divider",
                    }}
                  >
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Размер</Box>
                    <ColumnResizeHandle onResize={(dx) => handleColumnResize("size", dx)} />
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, width: columnWidths.date, position: "relative", overflow: "hidden" }}
                  >
                    <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Дата изменения</Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Строка ".." для перехода на уровень вверх */}
                {currentPath && (
                  <TableRow
                    hover
                    data-selectable-row="true"
                    onClick={onGoBack}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const raw = e.dataTransfer.getData("application/x-explorer-paths");
                      if (!raw) return;
                      const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
                      try {
                        await window.api.moveItems(JSON.parse(raw), parentPath);
                        onRefresh?.();
                      } catch (error) {
                        console.error("Ошибка при перемещении файлов:", error);
                      }
                    }}
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
                {files.map((item, index) => {
                  const isSelected = selectedFiles.some((f) => f.id === item.id);
                  const isLoading = loadingStats[item.path];
                  const stats = folderStats[item.path];

                  return (
                    <TableRow
                      key={item.id}
                      data-selectable-row="true"
                      ref={(el) => {
                        if (el) rowRefs.current.set(item.id, el);
                        else rowRefs.current.delete(item.id);
                      }}
                      hover
                      selected={isSelected}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => handleDragOverRow(e, item)}
                      onDragLeave={handleDragLeaveRow}
                      onDrop={(e) => handleDropOnRow(e, item)}
                      onClick={(e) => handleSelectItem(item, index, e)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      onDoubleClick={() => {
                        if (item.type === "directory") {
                          onOpenFolder(item.path);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        "&:last-child td, &:last-child th": { border: 0 },
                        ...(dragOverPath === item.path && {
                          backgroundColor: "primary.main",
                          opacity: 0.2,
                        }),
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          width: columnWidths.name,
                          overflow: "hidden",
                          borderRight: 1,
                          borderRightColor: "divider",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
                        >
                          {item.type === "directory" ? (
                            <FolderIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />
                          ) : (
                            <InsertDriveFileIcon
                              fontSize="small"
                              color="action"
                              sx={{ flexShrink: 0 }}
                            />
                          )}
                          <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell
                        sx={{
                          width: columnWidths.type,
                          overflow: "hidden",
                          borderRight: 1,
                          borderRightColor: "divider",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.type === "directory"
                            ? "Папка"
                            : item.stats?.extension
                            ? `${item.stats.extension.toUpperCase()} файл`
                            : "Файл"}
                        </Typography>
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          width: columnWidths.size,
                          overflow: "hidden",
                          borderRight: 1,
                          borderRightColor: "divider",
                        }}
                      >
                        {item.type === "directory" ? (
                          isLoading ? (
                            <CircularProgress size={16} />
                          ) : stats ? (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {formatFileSize(stats.size)} ({stats.fileCount} файлов)
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              --
                            </Typography>
                          )
                        ) : (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {formatFileSize(item.stats?.size)}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ width: columnWidths.date, overflow: "hidden" }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {formatDate(item.stats?.updatedAt)}
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

      <ContextMenu
        open={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        item={selectedItem}
        selectedFiles={selectedFiles}
        onClose={() => setContextMenu(null)}
        onRefresh={() => {
          onRefresh?.();
          setFolderStats({});
        }}
        currentPath={currentPath}
        hiddenCount={hiddenCount}
        onOpenFolder={onOpenFolder}
      />
    </Box>
  );
};