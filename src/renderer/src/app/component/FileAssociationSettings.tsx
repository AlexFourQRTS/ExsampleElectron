import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  FileAssociationService,
  FileAssociation,
  COMMON_EXTENSIONS,
} from "@services";

interface FileAssociationSettingsProps {
  onClose?: () => void;
}

export const FileAssociationSettings: React.FC<FileAssociationSettingsProps> = ({
  onClose,
}) => {
  const [associations, setAssociations] = useState<FileAssociation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<string>("");
  const [appName, setAppName] = useState<string>("");

  const assocService = new FileAssociationService();

  React.useEffect(() => {
    const config = assocService.getConfig();
    setAssociations(config.associations);
  }, []);

  const handleAddAssociation = () => {
    if (selectedExtension && appName) {
      assocService.addAssociation(selectedExtension, appName);
      const config = assocService.getConfig();
      setAssociations(config.associations);
      setSelectedExtension("");
      setAppName("");
      setOpenDialog(false);
    }
  };

  const handleRemove = (id: string) => {
    assocService.removeAssociation(id);
    const config = assocService.getConfig();
    setAssociations(config.associations);
  };

  const handleSetDefault = (id: string, extension: string) => {
    assocService.setDefault(id, extension);
    const config = assocService.getConfig();
    setAssociations(config.associations);
  };

  const groupedByExtension = associations.reduce(
    (acc, assoc) => {
      if (!acc[assoc.extension]) {
        acc[assoc.extension] = [];
      }
      acc[assoc.extension].push(assoc);
      return acc;
    },
    {} as Record<string, FileAssociation[]>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Ассоциации файлов
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          variant="contained"
        >
          Добавить
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          maxHeight: 300,
          overflow: "auto",
        }}
      >
        {Object.keys(groupedByExtension).length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">
              Ассоциации не добавлены
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {Object.entries(groupedByExtension).map(([ext, assocs]) => (
              <Box key={ext}>
                <ListItem
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    borderBottom: 1,
                    borderColor: "divider",
                    py: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {ext}
                  </Typography>

                  <RadioGroup
                    value={
                      assocs.find((a) => a.isDefault)?.id || assocs[0]?.id
                    }
                    onChange={(e) =>
                      handleSetDefault(e.target.value, ext)
                    }
                    sx={{ width: "100%", ml: 1 }}
                  >
                    {assocs.map((assoc) => (
                      <Box
                        key={assoc.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <FormControlLabel
                          value={assoc.id}
                          control={<Radio size="small" />}
                          label={assoc.appName}
                        />
                        <Button
                          size="small"
                          onClick={() => handleRemove(assoc.id)}
                          startIcon={<DeleteIcon />}
                          sx={{ color: "error.main" }}
                        >
                          Удалить
                        </Button>
                      </Box>
                    ))}
                  </RadioGroup>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* Диалог добавления ассоциации */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Добавить ассоциацию файла</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              select
              label="Расширение файла"
              value={selectedExtension}
              onChange={(e) => setSelectedExtension(e.target.value)}
              SelectProps={{
                native: true,
              }}
              fullWidth
            >
              <option value="">Выберите расширение</option>
              {COMMON_EXTENSIONS.map((ext) => (
                <option key={ext.ext} value={ext.ext}>
                  {ext.ext} - {ext.name}
                </option>
              ))}
            </TextField>

            <TextField
              label="Приложение"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="например: Visual Studio Code"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button
            onClick={handleAddAssociation}
            variant="contained"
            disabled={!selectedExtension || !appName}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
