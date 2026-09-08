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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import TerminalIcon from "@mui/icons-material/Terminal";
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
  const [defaultResultOpen, setDefaultResultOpen] = useState(false);
  const [defaultResultLog, setDefaultResultLog] = useState("");
  const [defaultResultError, setDefaultResultError] = useState(false);
  const [sudoCommand, setSudoCommand] = useState("");
  const [sudoCopied, setSudoCopied] = useState(false);

  useEffect(() => {
    detectPlatform();
  }, []);

  useEffect(() => {
    if (open) {
      loadSettings();
      window.api
        .generateSudoInstallCommand()
        .then(setSudoCommand)
        .catch((error) => console.error("Ошибка при генерации sudo-команды:", error));
    }
  }, [open]);

  const handleCopySudoCommand = async () => {
    try {
      await navigator.clipboard.writeText(sudoCommand);
      setSudoCopied(true);
      setTimeout(() => setSudoCopied(false), 2000);
    } catch (error) {
      console.error("Ошибка при копировании команды:", error);
    }
  };

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
    setDefaultResultOpen(true);
    setDefaultResultError(false);
    setDefaultResultLog("Выполняется регистрация...");

    try {
      const log = await window.api.registerAsDefaultFileManager();
      console.log("Результат регистрации по умолчанию:", log);
      setDefaultResultLog(log);
    } catch (error: any) {
      const message = error?.message || String(error);
      console.error("Ошибка при установке по умолчанию:", message);
      setDefaultResultError(true);
      setDefaultResultLog(message);
      setUseAsDefault(false);
      localStorage.setItem("explorer_use_as_default", "false");
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
                      ? "Linux: регистрация через xdg-mime (.desktop файл). Работает не во всех окружениях — GNOME/Nautilus может игнорировать это."
                      : platform === "darwin"
                      ? "macOS: требуется утилита duti (brew install duti)"
                      : "Windows: требует системные настройки"}
                  </Typography>
                </Box>
              }
            />

            {platform === "linux" && sudoCommand && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <TerminalIcon fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Альтернатива: команда для терминала (sudo)
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Устанавливает .desktop файл в системную директорию — работает
                  надёжнее кнопки выше, не зависит от прав пользователя
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    p: 1.5,
                    backgroundColor: "action.hover",
                    position: "relative",
                  }}
                >
                  <Typography
                    component="pre"
                    variant="caption"
                    sx={{
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      m: 0,
                      pr: 4,
                      display: "block",
                    }}
                  >
                    {sudoCommand}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={handleCopySudoCommand}
                    sx={{ position: "absolute", top: 6, right: 6 }}
                  >
                    {sudoCopied ? (
                      <CheckIcon fontSize="small" color="success" />
                    ) : (
                      <ContentCopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Paper>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Скопируй команду и вставь в терминал (Ctrl+Shift+V), нажми Enter,
                  введи пароль sudo при запросе
                </Typography>
              </Box>
            )}
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

      {/* Диалог результата регистрации по умолчанию */}
      <Dialog open={defaultResultOpen} onClose={() => setDefaultResultOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {defaultResultError ? "Ошибка регистрации" : "Результат регистрации"}
        </DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              color: defaultResultError ? "error.main" : "text.primary",
            }}
          >
            {defaultResultLog}
          </Typography>

          {!defaultResultError && platform === "linux" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              Если папки всё ещё открываются в старом проводнике: некоторые окружения
              (GNOME/Nautilus) не читают xdg-mime для inode/directory и требуют смены
              через Настройки → Приложения по умолчанию, либо через `gio mime inode/directory`.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDefaultResultOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
