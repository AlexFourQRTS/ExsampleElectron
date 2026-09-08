const THUMBNAIL_SIZE = 256; // соответствует размеру "large" из freedesktop-спецификации
const VIDEO_LOAD_TIMEOUT_MS = 8000;

// Генерирует и кэширует миниатюры фото/видео по стандарту freedesktop.org
// Thumbnail Managing Standard (тот же, что используют Nautilus/Dolphin) —
// формат строго PNG, хранение и валидация кэша по URI+mtime происходят
// в main-процессе (ThumbnailService), здесь только рендер через canvas.
export class ThumbnailGeneratorService {
  async getImageThumbnail(filePath: string, fileUrl: string): Promise<string | null> {
    return this.getThumbnail(filePath, fileUrl, () => this.renderImage(fileUrl));
  }

  async getVideoThumbnail(filePath: string, fileUrl: string): Promise<string | null> {
    return this.getThumbnail(filePath, fileUrl, () => this.renderVideoFrame(fileUrl));
  }

  private async getThumbnail(
    filePath: string,
    _fileUrl: string,
    render: () => Promise<string | null>
  ): Promise<string | null> {
    const cached = await window.api.getCachedThumbnail(filePath);
    if (cached) return this.toFileUrl(cached);

    // Файл уже помечен как "не удалось создать превью" — не пытаемся снова
    // при каждом открытии папки (например, битый/повреждённый файл)
    const failed = await window.api.isThumbnailFailed(filePath);
    if (failed) return null;

    const dataUrl = await render();
    if (!dataUrl) {
      await window.api.markThumbnailFailed(filePath);
      return null;
    }

    const savedPath = await window.api.saveThumbnail(filePath, dataUrl);
    return this.toFileUrl(savedPath);
  }

  private toFileUrl(filePath: string): string {
    const cleanPath = filePath.replace(/\\/g, "/");
    return cleanPath.startsWith("/") ? `file://${cleanPath}` : `file:///${cleanPath}`;
  }

  private renderImage(fileUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(THUMBNAIL_SIZE / img.width, THUMBNAIL_SIZE / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Формат строго PNG — того требует freedesktop-спецификация
        // (поддержка альфа-канала + возможность зашить tEXt-метаданные)
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => resolve(null);
      img.src = fileUrl;
    });
  }

  private renderVideoFrame(fileUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "metadata";
      video.src = fileUrl;

      let settled = false;
      const finish = (result: string | null) => {
        if (settled) return;
        settled = true;
        video.src = "";
        video.remove();
        resolve(result);
      };

      const timeout = setTimeout(() => finish(null), VIDEO_LOAD_TIMEOUT_MS);

      video.onloadedmetadata = () => {
        const seekTime = Math.min(1, (video.duration || 1) * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        clearTimeout(timeout);

        const scale = Math.min(THUMBNAIL_SIZE / video.videoWidth, THUMBNAIL_SIZE / video.videoHeight, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/png"));
      };

      video.onerror = () => {
        clearTimeout(timeout);
        finish(null);
      };
    });
  }
}
