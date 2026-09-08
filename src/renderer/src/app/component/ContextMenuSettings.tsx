import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Paper,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RestoreIcon from "@mui/icons-material/Restore";
import {
  ContextMenuConfigService,
  ContextMenuItem,
  CreateFileTypesService,
  CreateFileType,
} from "@services";

const CONTEXT_LABELS: Record<string, { label: string; color: "primary" | "secondary" | "default" }> = {
  item: { label: "Файл/папка", color: "primary" },
  empty: { label: "Пустая область", color: "secondary" },
  both: { label: "Везде", color: "default" },
};

interface ContextMenuSettingsProps {
  onClose?: () => void;
}

export const ContextMenuSettings: React.FC<ContextMenuSettingsProps> = ({
  onClose,
}) => {
  const [items, setItems] = useState<ContextMenuItem[]>([]);
  const [createTypes, setCreateTypes] = useState<CreateFileType[]>([]);
  const [enabledCreateIds, setEnabledCreateIds] = useState<string[]>([]);
  const configService = new ContextMenuConfigService();
  const createTypesService = new CreateFileTypesService();

  useEffect(() => {
    const config = configService.getConfig();
    setItems(config.items);
    setCreateTypes(createTypesService.getAllTypes());
    setEnabledCreateIds(createTypesService.getEnabledIds());
  }, []);

  const handleToggleCreateType = (id: string) => {
    const isEnabled = enabledCreateIds.includes(id);
    createTypesService.toggleType(id, !isEnabled);
    setEnabledCreateIds(createTypesService.getEnabledIds());
  };

  const handleToggle = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    setItems(updated);
    const config = configService.getConfig();
    config.items = updated;
    configService.saveConfig(config);
  };

  const handleReset = () => {
    if (window.confirm("Восстановить пункты меню по умолчанию?")) {
      configService.resetToDefault();
      const config = configService.getConfig();
      setItems(config.items);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const updated = [...items];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      updated.forEach((item, i) => (item.order = i));
      setItems(updated);
      configService.reorderItems(updated);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < items.length - 1) {
      const updated = [...items];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      updated.forEach((item, i) => (item.order = i));
      setItems(updated);
      configService.reorderItems(updated);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Пункты контекстного меню
        </Typography>
        <Button
          size="small"
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          variant="outlined"
        >
          По умолчанию
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        <List disablePadding>
          {items.map((item, index) => (
            <Box key={item.id}>
              <ListItem
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  py: 1,
                }}
              >
                <DragIndicatorIcon
                  sx={{ cursor: "grab", color: "text.secondary" }}
                  fontSize="small"
                />

                {item.type !== "divider" && (
                  <Checkbox
                    edge="start"
                    checked={item.enabled}
                    onChange={() => handleToggle(item.id)}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                  />
                )}

                <ListItemText
                  primary={item.label || "— Разделитель —"}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: {
                      opacity: item.enabled ? 1 : 0.6,
                      fontStyle: item.label ? "normal" : "italic",
                    },
                  }}
                  sx={{ flexGrow: 1, ml: item.type === "divider" ? 3 : 0 }}
                />

                {item.type !== "divider" && (
                  <Chip
                    label={CONTEXT_LABELS[item.context]?.label}
                    color={CONTEXT_LABELS[item.context]?.color}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                )}

                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    sx={{ minWidth: "auto", p: 0.5 }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    sx={{ minWidth: "auto", p: 0.5 }}
                  >
                    ↓
                  </Button>
                </Box>
              </ListItem>
            </Box>
          ))}
        </List>
      </Paper>

      <Typography variant="caption" color="text.secondary">
        Включено: {items.filter((i) => i.enabled).length} из {items.length} пункт
      </Typography>

      <Divider />

      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Типы файлов в подменю «Создать»
      </Typography>

      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          maxHeight: 300,
          overflow: "auto",
        }}
      >
        <List disablePadding>
          {createTypes.map((type) => (
            <ListItem
              key={type.id}
              sx={{ borderBottom: 1, borderColor: "divider", py: 0.5 }}
            >
              <Checkbox
                edge="start"
                checked={enabledCreateIds.includes(type.id)}
                onChange={() => handleToggleCreateType(type.id)}
                tabIndex={-1}
                disableRipple
                size="small"
              />
              <ListItemText
                primary={type.label}
                secondary={type.extension || "папка"}
                primaryTypographyProps={{ variant: "body2" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
