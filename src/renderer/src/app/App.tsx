import React, { useState } from "react";
import { Container, Divider } from "@mui/material";
import { Tree, FileDetailItem } from "./component/Tree";
import { Content } from "./component/Content";
import { Preview } from "./component/Preview";

export default function App(): JSX.Element {
  const [files, setFiles] = useState<FileDetailItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileDetailItem | null>(null);

  const handleFilesChange = (newFiles: FileDetailItem[]) => {
    setFiles(newFiles);
    setSelectedFile(null); // Сбрасываем выбранный файл при выборе новой папки
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
      {/* Левая панель — Дерево */}
      <Tree onFilesChange={handleFilesChange} />

      <Divider orientation="vertical" flexItem />

      {/* Центральная панель — Список файлов */}
      <Content
        files={files}
        selectedFileId={selectedFile?.id}
        onSelectFile={setSelectedFile}
      />

      <Divider orientation="vertical" flexItem />

      {/* Правая панель — Предпросмотр */}
      <Preview file={selectedFile} />
    </Container>
  );
}