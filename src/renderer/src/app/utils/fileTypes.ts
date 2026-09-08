export const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
export const VIDEO_EXTS = ["mp4", "webm", "ogg", "mov"];
export const AUDIO_EXTS = ["mp3", "wav", "ogg", "aac"];
export const TEXT_EXTS = [
  "txt", "md", "log", "csv", "xml", "json", "yaml", "yml", "toml", "env", "ini", "conf",
  "html", "css", "scss", "sass", "less", "js", "ts", "jsx", "tsx", "vue", "svelte",
  "py", "sh", "bash", "php", "sql", "java", "cs", "cpp", "c", "h", "go", "rs", "rb",
];

export function getCleanExtension(name: string, statedExtension?: string): string {
  const raw = statedExtension || name.split(".").pop() || "";
  return raw.toLowerCase().replace(/^\./, "").trim();
}

export function toFileUrl(filePath: string): string {
  const cleanPath = filePath.replace(/\\/g, "/");
  return cleanPath.startsWith("/") ? `file://${cleanPath}` : `file:///${cleanPath}`;
}
