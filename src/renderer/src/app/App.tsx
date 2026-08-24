import React, { useState } from "react";
import { Container, Divider } from "@mui/material";
import { Tree, FileDetailItem } from "./component/Tree";
import { Content } from "./component/Content";
import { Preview } from "./component/Preview";

export default function App(): JSX.Element {
  const [files, setFiles] = useState<FileDetailItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileDetailItem | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

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
      console.error("Ошибка при открытии папки:", error);
    }
  };

  // Вычисление пути родительской папки (на шаг назад)
  const handleGoBack = () => {
    if (!currentPath) return;
    const parts = currentPath.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length <= 1) return; // Уже в корне
    parts.pop();
    const parentPath = currentPath.startsWith("/")
      ? "/" + parts.join("/")
      : parts.join("/");
    handleOpenFolder(parentPath);
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        p: 2,
        boxSizing: "border-box",
      }}
    >
      <Tree
        onFilesChange={(newFiles) => {
          handleFilesChange(newFiles);
        }}
        onFolderSelect={setCurrentPath}
      />

      <Divider orientation="vertical" flexItem />

      <Content
        files={files}
        currentPath={currentPath}
        selectedFileId={selectedFile?.id}
        onSelectFile={setSelectedFile}
        onOpenFolder={handleOpenFolder}
        onGoBack={handleGoBack}
      />

      <Divider orientation="vertical" flexItem />

      <Preview file={selectedFile} />
    </Container>
  );
}