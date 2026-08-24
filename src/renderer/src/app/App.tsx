import React, { useState } from "react";
import { Container, Divider } from "@mui/material";
import { Tree, FileDetailItem } from "./component/Tree";
import { Content } from "./component/Content";
import { Preview } from "./component/Preview";

// @ts-ignore
export default function App(): JSX.Element {
  const [files, setFiles] = useState<FileDetailItem[]>([]);

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        height: "100vh",
        py: 2,
      }}
    >
      <Tree onFilesChange={setFiles} />

      <Divider orientation="vertical" flexItem />

      <Content files={files} />

      <Divider orientation="vertical" flexItem />

      <Preview />
    </Container>
  );
}