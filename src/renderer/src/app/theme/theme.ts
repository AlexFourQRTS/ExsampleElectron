import { createTheme, Theme } from "@mui/material/styles";
import { ThemeMode } from "@services";

// Графитовая палитра — нейтральный тёмно-серый, без ухода в чёрный
const GRAPHITE = {
  default: "#2b2d30",
  paper: "#34363a",
  paperElevated: "#3c3f43",
  border: "#4a4d52",
};

export function createAppTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            background: {
              default: "#f5f5f5",
              paper: "#ffffff",
            },
          }
        : {
            background: {
              default: GRAPHITE.default,
              paper: GRAPHITE.paper,
            },
            divider: GRAPHITE.border,
          }),
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      ...(mode === "dark" && {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: GRAPHITE.paperElevated,
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              backgroundColor: GRAPHITE.paperElevated,
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.06)",
              },
            },
          },
        },
      }),
    },
  });
}
