import React, { useState } from "react";
import { Button, Container, Typography, Box, Divider } from "@mui/material";
import {
  // AppBox,
  AppBoxContent,
  AppBoxPreview,
  AppBoxTree,
  AppButton,
  AppTypography,
} from "./style/AppStyle";
import { Tree } from "./component/Tree";


// @ts-ignore
export default function App(): JSX.Element {
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >

      <Tree/>
      {/* Content */}
      <Divider orientation="vertical" flexItem />
      <Box sx={AppBoxContent}>
        <Typography variant="h4">Content</Typography>

        <Button
          variant="contained"
          color="primary"
         
          sx={{ mb: 2 }}
        >
          Ping
        </Button>


      </Box>
      {/* Preview */}
      <Divider orientation="vertical" flexItem />
      <Box sx={AppBoxPreview}>
        <Typography variant="h4" component="h1">
          Preview
        </Typography>

        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 2 }}
        >
          Ping
        </Button>

        
      </Box>
    </Container>
  );
}
