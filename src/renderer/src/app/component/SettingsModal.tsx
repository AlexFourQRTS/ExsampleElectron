import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import LinkIcon from "@mui/icons-material/Link";
import { ContextMenuSettings } from "@components/ContextMenuSettings";
import { FileAssociationSettings } from "@components/FileAssociationSettings";
import "../types/api";

interface AccessPath {
  path: string;
  addedDate: string;
}

interface SettingsState {
  selectedPath: string | null;
  useAsDefault: boolean;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
}) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [useAsDefault, setUseAsDefault] = useState(false);
  const [platform, setPlatform] = useState<"linux" | "darwin" | "win32">("linux");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    detectPlatform();
  }, []);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const detectPlatform = () => {
    const platformStr = (window.navigator.platform || "").toLowerCase();
    if (platformStr.includes("win")) {
      setPlatform("win32");
    } else if (platformStr.includes("mac")) {
      setPlatform("darwin");
    } else {
      setPlatform("linux");
    }
  };

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem("explorer_last_path");
      if (stored) {
        setSelectedPath(stored);
      }
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error);
    }

    try {
      const stored = localStorage.getItem("explorer_use_as_default");
      if (stored) {
        setUseAsDefault(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Ошибка при загрузке настроек:", error);
    }
  };

  const handleSelectPath = async () => {
    try {
      const folderPath = await window.api.openFolderDialog();
      if (folderPath) {
        setSelectedPath(folderPath);
        localStorage.setItem("explorer_last_path", folderPath);
        window.location.reload();
      }
    } catch (error) {
      console.error("Ошибка при выборе папки:", error);
    }
  };

  const handleDefaultChange = async (checked: boolean) => {
    setUseAsDefault(checked);
    localStorage.setItem("explorer_use_as_default", JSON.stringify(checked));
    if (checked) {
      await setAsDefaultFileManager();
    }
  };

  const setAsDefaultFileManager = async () => {
    try {
      await window.api.registerAsDefaultFileManager();
      console.log("Приложение установлено как обработчик папок по умолчанию!");
    } catch (error) {
      console.error("Ошибка при установке по умолчанию:", error);
      alert("Ошибка при установке приложения как обработчика папок");
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Настройки проводника</DialogTitle>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}
      >
        <Tab label="Папка" icon={<SettingsIcon />} iconPosition="start" />
        <Tab label="Меню" icon={<MenuIcon />} iconPosition="start" />
        <Tab label="Ассоциации" icon={<LinkIcon />} iconPosition="start" />
      </Tabs>

      <DialogContent sx={{ pt: 2 }}>
        {/* Таб 1: Выбор папки */}
        {tabValue === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Раздел выбора папки */}
            <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Папка для управления
            </Typography>

            <Paper
              elevation={0}
              sx={{
                border: 1,
                borderColor: "divider",
                p: 2,
                backgroundColor: "action.hover",
              }}
            >
              {selectedPath ? (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.5,
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedPath}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectPath}
                  >
                    Изменить папку
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Папка не выбрана
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSelectPath}
                  >
                    Выбрать папку
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>

          <Divider />

          {/* Раздел системных опций */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Система
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={useAsDefault}
                  onChange={(e) => handleDefaultChange(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Использовать по умолчанию
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {platform === "linux"
                      ? "Linux: используется xdg-open (требует конфигурация)"
                      : platform === "darwin"
                      ? "macOS: требует системные настройки"
                      : "Windows: требует системные настройки"}
                  </Typography>
                </Box>
              }
            />
          </Box>
          </Box>
        )}

        {/* Таб 2: Контекстное меню */}
        {tabValue === 1 && <ContextMenuSettings onClose={onClose} />}

        {/* Таб 3: Ассоциации файлов */}
        {tabValue === 2 && <FileAssociationSettings onClose={onClose} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};
