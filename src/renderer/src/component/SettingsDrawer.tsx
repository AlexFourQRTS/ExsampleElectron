import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Tab,
  Tabs,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { AppSettings, Bookmark } from "./Tree";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  open,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [tabValue, setTabValue] = React.useState(0);
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  React.useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const loaded = await window.api.bookmarks.list();
        setBookmarks(loaded);
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
      }
    };

    if (open) {
      loadBookmarks();
    }
  }, [open]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleToggleHiddenFiles = async () => {
    const updated = await window.api.settings.toggleHiddenFiles();
    setLocalSettings(updated);
  };

  const handleToggleSystemHiddenFolders = async () => {
    const updated = await window.api.settings.toggleSystemHiddenFolders();
    setLocalSettings(updated);
  };

  const handleRemoveBookmark = async (id: string) => {
    try {
      await window.api.bookmarks.remove(id);
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Settings</Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Display" id="settings-tab-0" />
          <Tab label="Bookmarks" id="settings-tab-1" />
          <Tab label="About" id="settings-tab-2" />
        </Tabs>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {/* Display Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.showHiddenFiles}
                    onChange={handleToggleHiddenFiles}
                  />
                }
                label="Show hidden files (dotfiles)"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.showSystemHiddenFolders}
                    onChange={handleToggleSystemHiddenFolders}
                  />
                }
                label="Show folders I've hidden"
              />

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  View Mode
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.viewMode === "grid"}
                      onChange={(e) => {
                        const mode = e.target.checked ? "grid" : "list";
                        setLocalSettings({ ...localSettings, viewMode: mode });
                      }}
                    />
                  }
                  label="Grid view"
                />
              </Box>

              <Divider />

              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  console.log("Set as default - TODO");
                }}
              >
                Set as default file manager
              </Button>
            </Box>
          </TabPanel>

          {/* Bookmarks Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
                onClick={() => {
                  console.log("Add current folder to bookmarks - TODO");
                }}
              >
                Add current folder
              </Button>

              <Divider />

              {bookmarks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bookmarks yet
                </Typography>
              ) : (
                <List disablePadding>
                  {bookmarks.map((bookmark) => (
                    <ListItem
                      key={bookmark.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveBookmark(bookmark.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={bookmark.name}
                        secondary={bookmark.path}
                        secondaryTypographyProps={{
                          sx: { fontSize: "0.75rem", wordBreak: "break-word" },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>

          {/* About Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2">SimpleExplorer</Typography>
                <Typography variant="body2" color="text.secondary">
                  v1.0.0
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                A modern file manager for Linux
              </Typography>

              <Divider />

              <Box sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                <Typography variant="caption" display="block">
                  © 2026 SimpleExplorer
                </Typography>
              </Box>
            </Box>
          </TabPanel>
        </Box>

        {/* Footer Buttons */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", display: "flex", gap: 1 }}>
          <Button variant="outlined" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" fullWidth onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
