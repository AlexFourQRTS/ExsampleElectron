import React from "react";
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
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { FileDetailItem } from "./Tree";

interface ContentProps {
  files: FileDetailItem[];
}

// Форматирование размера файлов (байты -> КБ / МБ / ГБ)
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === 0) return "--";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Форматирование даты
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

export const Content: React.FC<ContentProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          В этой папке нет файлов или папка не выбрана
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: "100%", p: 2, overflowY: "auto" }}>
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Имя</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Дата изменения</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Размер</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  cursor: "pointer",
                  "&:last-child td, &:last-child th": { border: 0 },
                }}
              >
                {/* Имя + Иконка */}
                <TableCell component="th" scope="row">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {item.type === "directory" ? (
                      <FolderIcon fontSize="small" color="primary" />
                    ) : (
                      <InsertDriveFileIcon fontSize="small" color="action" />
                    )}
                    <Typography variant="body2" noWrap>
                      {item.name}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Дата изменения */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(item.stats?.updatedAt)}
                  </Typography>
                </TableCell>

                {/* Тип */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {item.type === "directory"
                      ? "Папка"
                      : item.stats?.extension
                      ? `${item.stats.extension.toUpperCase()} файл`
                      : "Файл"}
                  </Typography>
                </TableCell>

                {/* Размер */}
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {item.type === "directory" ? "--" : formatFileSize(item.stats?.size)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};