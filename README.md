# SimpleExplorer

A Linux-first file manager built with Electron, React, and MUI — created out of
genuine daily frustration with the file managers that already exist (Nautilus,
Nemo, Dolphin, Thunar), not as a tech demo.

## Why this exists

Every mainstream Linux file manager is missing something small but constant:

- **GNOME removed the one-click "make executable" checkbox** from Nautilus'
  Properties dialog in recent versions — you're expected to open a terminal
  for `chmod +x`. SimpleExplorer puts it back as a single context-menu action.
- **Folder size is never just... visible.** You have to open Properties, wait
  for a fresh recursive scan every time, with no caching. SimpleExplorer shows
  size and file count inline in the file list, in the preview panel, and in
  icon view — computed once, cached, reused.
- **"New" submenus are usually just "New Folder."** GNOME's template system
  needs manual setup in `~/Templates` before it does anything more. SimpleExplorer
  ships 11 file types out of the box (folder, text, Markdown, JSON, HTML, CSS,
  JS, Python, Bash script, CSV, shortcut) and lets you add or remove your own.
- **Context menus are fixed.** Nemo Actions and Thunar Custom Actions let you
  *add* entries, not restructure what's already there. SimpleExplorer lets you
  enable, disable, and reorder every single menu item — independently for
  "right-click on a file" versus "right-click on empty space."
- **You can't just hide a folder you're tired of seeing** without renaming it
  to a dotfile. SimpleExplorer has an explicit hide/unhide list, separate from
  actual dotfiles.

None of this is exotic. It's the accumulation of small, unaddressed
annoyances that made writing a replacement faster than continuing to work
around them.

## Features

- **Two view modes**: sortable table, and icon grid (small / medium / large)
  with real photo and video thumbnails
- **Thumbnail cache following the freedesktop.org Thumbnail Managing Standard**
  — same cache location and format (`~/.cache/thumbnails`, PNG with embedded
  `Thumb::URI`/`Thumb::MTime` metadata) used by Nautilus and Dolphin, so
  thumbnails render once and are reused, not regenerated on every folder open
- **Sidebar** with Places (Home, Desktop, Documents, Downloads, Pictures,
  Videos, Music — read from `~/.config/user-dirs.dirs`), mounted devices, and
  user-managed bookmarks
- **Fully configurable context menu** — every action can be toggled and
  reordered, independently for file-selected vs. empty-area right-click
- **Multi-select** via Ctrl/Shift-click and click-drag rubber-band selection,
  Ctrl+A to select all
- **Drag-and-drop** between folders and between separate app windows
- **Multiple windows** — "Open in new window" per folder
- **Cut / copy / paste, rename, delete, compress/extract archives, chmod +x**
- **Set as default file manager** — one click, or a copy-pasteable `sudo`
  command for a more reliable system-wide install
- **Dark ("graphite") and light themes**, window size and panel layout
  persisted across restarts
- **All console output piped to the terminal** the app was launched from, for
  actually debuggable logs instead of only DevTools

## Tech stack

Electron · React · TypeScript · MUI · electron-vite

## Getting started

```bash
npm install
npm run dev      # start in development mode
npm run build    # type-check and bundle
npm run make     # package a native app (AppImage on Linux) into dist/
```

## Author

**Maliuk Oleksandr** — aka **Brahma** / **BrahmaDzen**
GitHub: [@AlexFourQRTS](https://github.com/AlexFourQRTS)

## License

MIT — see [LICENSE](./LICENSE).
