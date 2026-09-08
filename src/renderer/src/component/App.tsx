import React, { useState, useEffect } from "react";
import { Container, Divider, Box, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { Tree, FileDetailItem } from "./component/Tree";
import { Content } from "./component/Content";
import { Preview } from "./component/Preview";
import { SettingsDrawer } from "./component/SettingsDrawer";
import { AppSettings } from "../../shared/types";

export default function App(): JSX.Element {
  const [files, setFiles] = useState<FileDetailItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileDetailItem | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const loaded = await window.api.settings.get();
      setSettings(loaded);
    };
    loadSettings();
  }, []);

  const handleFilesChange = (newFiles: FileDetailItem[]) => {
    setFiles(newFiles);
    setSelectedFile(null);
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
      const items = await window.api.getFolderFiles(folderPath);
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
      console.error("Error opening folder:", error);
    }
  };

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

  const handleSettingsSave = async (newSettings: AppSettings) => {
    await window.api.settings.set(newSettings);
    setSettings(newSettings);
    // Refresh current folder to apply hidden files filter
    if (currentPath) {
      handleOpenFolder(currentPath);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <IconButton
          onClick={() => setSettingsOpen(true)}
          size="small"
          title="Settings"
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          p: 2,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Tree
          onFilesChange={(newFiles) => {
            handleFilesChange(newFiles);
          }}
          onFolderSelect={setCurrentPath}
          settings={settings}
        />

        <Divider orientation="vertical" flexItem />

        <Content
          files={files}
          currentPath={currentPath}
          selectedFileId={selectedFile?.id}
          onSelectFile={setSelectedFile}
          onOpenFolder={handleOpenFolder}
          onGoBack={handleGoBack}
          settings={settings}
        />

        <Divider orientation="vertical" flexItem />

        <Preview file={selectedFile} currentPath={currentPath} />
      </Container>

      {/* Settings Drawer */}
      {settings && (
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSave={handleSettingsSave}
        />
      )}
    </Box>
  );
}
