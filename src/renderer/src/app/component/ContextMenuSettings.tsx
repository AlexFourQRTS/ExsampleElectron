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
  Tabs,
  Tab,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RestoreIcon from "@mui/icons-material/Restore";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import {
  ContextMenuConfigService,
  ContextMenuItem,
  CreateFileTypesService,
  CreateFileType,
} from "@services";

interface ContextMenuSettingsProps {
  onClose?: () => void;
}

const configService = new ContextMenuConfigService();
const createTypesService = new CreateFileTypesService();

// Один переиспользуемый список пунктов меню для одного контекста
// (пустая область ИЛИ выбранный файл) — реорганизация и включение/выключение
// работают независимо для каждого из двух списков
const ContextMenuList: React.FC<{ context: "item" | "empty" }> = ({ context }) => {
  const [items, setItems] = useState<ContextMenuItem[]>([]);

  useEffect(() => {
    setItems(configService.getItemsForContext(context));
  }, [context]);

  const refresh = () => setItems(configService.getItemsForContext(context));

  const isEnabled = (item: ContextMenuItem): boolean =>
    context === "empty" ? item.enabledForEmpty : item.enabledForItem;

  const handleToggle = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    configService.toggleItem(itemId, !isEnabled(item), context);
    refresh();
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    setItems(updated);
    configService.reorderItems(updated, context);
  };

  return (
    <Paper
      elevation={0}
      sx={{ border: 1, borderColor: "divider", maxHeight: 340, overflow: "auto" }}
    >
      <List disablePadding>
        {items.map((item, index) => (
          <ListItem
            key={item.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderBottom: 1,
              borderColor: "divider",
              py: 0.75,
            }}
          >
            <DragIndicatorIcon sx={{ color: "text.secondary" }} fontSize="small" />

            {item.type !== "divider" && (
              <Checkbox
                edge="start"
                checked={isEnabled(item)}
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
                  opacity: isEnabled(item) ? 1 : 0.6,
                  fontStyle: item.label ? "normal" : "italic",
                },
              }}
              sx={{ flexGrow: 1, ml: item.type === "divider" ? 3 : 0 }}
            />

            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button
                size="small"
                onClick={() => handleMove(index, -1)}
                disabled={index === 0}
                sx={{ minWidth: "auto", p: 0.5 }}
              >
                ↑
              </Button>
              <Button
                size="small"
                onClick={() => handleMove(index, 1)}
                disabled={index === items.length - 1}
                sx={{ minWidth: "auto", p: 0.5 }}
              >
                ↓
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export const ContextMenuSettings: React.FC<ContextMenuSettingsProps> = () => {
  const [tab, setTab] = useState<"empty" | "item">("item");
  const [refreshKey, setRefreshKey] = useState(0);
  const [createTypes, setCreateTypes] = useState<CreateFileType[]>([]);
  const [enabledCreateIds, setEnabledCreateIds] = useState<string[]>([]);

  useEffect(() => {
    setCreateTypes(createTypesService.getAllTypes());
    setEnabledCreateIds(createTypesService.getEnabledIds());
  }, []);

  const handleReset = () => {
    if (window.confirm("Восстановить пункты меню по умолчанию (для обоих контекстов)?")) {
      configService.resetToDefault();
      setRefreshKey((k) => k + 1);
    }
  };

  const handleToggleCreateType = (id: string) => {
    const isEnabled = enabledCreateIds.includes(id);
    createTypesService.toggleType(id, !isEnabled);
    setEnabledCreateIds(createTypesService.getEnabledIds());
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Контекстное меню
        </Typography>
        <Button size="small" startIcon={<RestoreIcon />} onClick={handleReset} variant="outlined">
          По умолчанию
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
        <Tab
          value="item"
          label="Выбранный файл/папка"
          icon={<InsertDriveFileIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 36, textTransform: "none" }}
        />
        <Tab
          value="empty"
          label="Пустое поле"
          icon={<LayersClearIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 36, textTransform: "none" }}
        />
      </Tabs>

      <Typography variant="caption" color="text.secondary">
        {tab === "item"
          ? "Показывается при правом клике на файл или папку. Порядок и набор пунктов независимы от меню пустого поля."
          : "Показывается при правом клике на пустое место в текущей папке (не на файл). Порядок и набор пунктов независимы от меню файла/папки."}
      </Typography>

      <ContextMenuList key={`${tab}-${refreshKey}`} context={tab} />

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
        Типы файлов в подменю «Создать»
      </Typography>

      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", maxHeight: 250, overflow: "auto" }}>
        <List disablePadding>
          {createTypes.map((type) => (
            <ListItem key={type.id} sx={{ borderBottom: 1, borderColor: "divider", py: 0.5 }}>
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
