import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Divider,
  Button,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { FileDetailItem, FolderStats, HiddenStats } from "./Tree";

interface PreviewProps {
  file: FileDetailItem | null;
  currentPath: string | null;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const Preview: React.FC<PreviewProps> = ({ file, currentPath }) => {
  const [folderStats, setFolderStats] = useState<FolderStats | null>(null);
  const [hiddenStats, setHiddenStats] = useState<HiddenStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFolderStats(null);
    setHiddenStats(null);

    if (!file || file.type !== "directory") return;

    const loadFolderStats = async () => {
      try {
        setLoading(true);
        // Simulate folder stats calculation
        const stats = await window.api.folder.getStats(file.path);
        setFolderStats(stats);

        const hidden = await window.api.folder.getHiddenCount(file.path);
        setHiddenStats(hidden);
      } catch (error) {
        console.error("Failed to load folder stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFolderStats();
  }, [file]);

  return (
    <Box
      sx={{
        width: 300,
        minWidth: 280,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, mb: 2, color: "text.secondary" }}
      >
        Preview
      </Typography>

      {!file ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          Select a file or folder
        </Typography>
      ) : (
        <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
          {/* File/Folder Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
              py: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {file.type === "directory" ? (
              <FolderOpenIcon sx={{ fontSize: 60, color: "primary.main" }} />
            ) : (
              <InsertDriveFileIcon sx={{ fontSize: 60, color: "action.main" }} />
            )}
          </Box>

          {/* Name */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-word", fontWeight: 600 }}>
              {file.name}
            </Typography>
          </Box>

          {/* Type */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body2">
              {file.type === "directory" ? "Folder" : file.stats?.extension || "File"}
            </Typography>
          </Box>

          {/* Size */}
          {file.type === "file" && file.stats && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Size
              </Typography>
              <Typography variant="body2">
                {formatFileSize(file.stats.size)}
              </Typography>
            </Box>
          )}

          {/* Modified Date */}
          {file.stats && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Modified
              </Typography>
              <Typography variant="body2">
                {formatDate(file.stats.updatedAt)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Folder Stats */}
          {file.type === "directory" && (
            <>
              {loading ? (
                <>
                  <Skeleton height={20} sx={{ mb: 1 }} />
                  <Skeleton height={20} sx={{ mb: 1 }} />
                  <Skeleton height={20} />
                </>
              ) : folderStats ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Size
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatFileSize(folderStats.size)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Files
                    </Typography>
                    <Typography variant="body2">
                      {folderStats.fileCount}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Subdirectories
                    </Typography>
                    <Typography variant="body2">
                      {folderStats.dirCount}
                    </Typography>
                  </Box>

                  {/* Hidden Stats */}
                  {hiddenStats && (hiddenStats.dotfiles > 0 || hiddenStats.userHidden > 0) && (
                    <Box sx={{ p: 1, backgroundColor: "action.hover", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Hidden Items
                      </Typography>
                      <Typography variant="body2">
                        Dotfiles: {hiddenStats.dotfiles}
                      </Typography>
                      <Typography variant="body2">
                        User hidden: {hiddenStats.userHidden}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : null}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};
