import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'

// Реализация freedesktop.org "Thumbnail Managing Standard" — того самого,
// которым пользуются Nautilus, Dolphin, Thunar/tumbler и другие проводники
// на Linux. Кэш централизован в ~/.cache/thumbnails, а не разбросан по
// папкам — благодаря этому превью работают и на read-only источниках
// (смонтированный ISO, флешка, сетевая шара), где создать файл рядом с
// исходником просто невозможно.
const CACHE_ROOT = path.join(os.homedir(), '.cache', 'thumbnails')
const THUMBNAIL_SIZE_DIR = 'large' // 256x256, второй по спецификации размер после "normal" (128x128)
const APP_NAME = 'electron-explorer'

function toFileUri(filePath: string): string {
  // file:// URI с percent-encoding каждого сегмента пути — так спецификация
  // требует вычислять хэш, иначе имя кэш-файла не совпадёт с тем, что
  // посчитает Nautilus/Dolphin для того же файла
  const encoded = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `file://${encoded}`
}

function md5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex')
}

// ==========================================
// Ручная сборка/чтение PNG tEXt-чанков (без внешних зависимостей).
// Формат чанка: [4 байта длина данных][4 байта тип][данные][4 байта CRC32]
// ==========================================

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildTextChunk(keyword: string, text: string): Buffer {
  const data = Buffer.concat([Buffer.from(keyword, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')])
  const type = Buffer.from('tEXt', 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])), 0)
  return Buffer.concat([length, type, data, crc])
}

// Вставляет tEXt-чанки сразу после IHDR (первый чанк любого PNG) — это
// safe-позиция по спецификации, всегда до IDAT
function injectTextChunks(pngBuffer: Buffer, chunks: { keyword: string; text: string }[]): Buffer {
  const SIGNATURE_LENGTH = 8
  const ihdrLength = pngBuffer.readUInt32BE(SIGNATURE_LENGTH)
  const ihdrEnd = SIGNATURE_LENGTH + 4 + 4 + ihdrLength + 4 // length + type + data + crc

  const before = pngBuffer.subarray(0, ihdrEnd)
  const after = pngBuffer.subarray(ihdrEnd)
  const textChunks = Buffer.concat(chunks.map((c) => buildTextChunk(c.keyword, c.text)))

  return Buffer.concat([before, textChunks, after])
}

function readTextChunks(pngBuffer: Buffer): Record<string, string> {
  const result: Record<string, string> = {}
  let offset = 8

  while (offset < pngBuffer.length) {
    const length = pngBuffer.readUInt32BE(offset)
    const type = pngBuffer.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length

    if (type === 'tEXt') {
      const chunkData = pngBuffer.subarray(dataStart, dataEnd)
      const nullIndex = chunkData.indexOf(0)
      if (nullIndex !== -1) {
        result[chunkData.toString('latin1', 0, nullIndex)] = chunkData.toString('latin1', nullIndex + 1)
      }
    }

    if (type === 'IEND') break
    offset = dataEnd + 4
  }

  return result
}

// 1x1 прозрачный PNG — используется как маркер "превью не удалось создать"
const EMPTY_MARKER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

export class ThumbnailService {
  private static async getCacheDir(): Promise<string> {
    const dir = path.join(CACHE_ROOT, THUMBNAIL_SIZE_DIR)
    await fs.mkdir(dir, { recursive: true, mode: 0o700 })
    return dir
  }

  private static async getFailCacheDir(): Promise<string> {
    const dir = path.join(CACHE_ROOT, 'fail', APP_NAME)
    await fs.mkdir(dir, { recursive: true, mode: 0o700 })
    return dir
  }

  // Проверка валидности кэша по стандарту: сверяем URI и mtime, зашитые
  // внутрь PNG, с реальными данными файла — а не просто "файл существует"
  static async getCachedThumbnailPath(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.stat(filePath)
      const uri = toFileUri(filePath)
      const cachePath = path.join(await this.getCacheDir(), `${md5(uri)}.png`)

      const meta = readTextChunks(await fs.readFile(cachePath))
      const actualMtime = Math.floor(stats.mtimeMs / 1000)

      if (meta['Thumb::URI'] !== uri || parseInt(meta['Thumb::MTime'] || '0', 10) !== actualMtime) {
        return null
      }

      return cachePath
    } catch {
      return null
    }
  }

  // base64Data — dataURL вида "data:image/png;base64,...", сгенерированный
  // в renderer'е (из фото через canvas, или из кадра видео)
  static async saveThumbnail(filePath: string, base64Data: string): Promise<string> {
    const stats = await fs.stat(filePath)
    const uri = toFileUri(filePath)
    const cachePath = path.join(await this.getCacheDir(), `${md5(uri)}.png`)

    const rawPng = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const pngWithMeta = injectTextChunks(rawPng, [
      { keyword: 'Thumb::URI', text: uri },
      { keyword: 'Thumb::MTime', text: String(Math.floor(stats.mtimeMs / 1000)) },
      { keyword: 'Thumb::Size', text: String(stats.size) },
    ])

    await fs.writeFile(cachePath, pngWithMeta, { mode: 0o600 })
    return cachePath
  }

  // Помечает файл как "превью создать не удалось" — чтобы не пытаться
  // рендерить заново при каждом открытии папки (битые/повреждённые файлы)
  static async markAsFailed(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath)
      const uri = toFileUri(filePath)
      const failPath = path.join(await this.getFailCacheDir(), `${md5(uri)}.png`)

      const withMeta = injectTextChunks(EMPTY_MARKER_PNG, [
        { keyword: 'Thumb::URI', text: uri },
        { keyword: 'Thumb::MTime', text: String(Math.floor(stats.mtimeMs / 1000)) },
      ])
      await fs.writeFile(failPath, withMeta, { mode: 0o600 })
    } catch {
      // Не критично — просто попробуем снова в следующий раз
    }
  }

  static async isMarkedAsFailed(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath)
      const uri = toFileUri(filePath)
      const failPath = path.join(await this.getFailCacheDir(), `${md5(uri)}.png`)

      const meta = readTextChunks(await fs.readFile(failPath))
      const actualMtime = Math.floor(stats.mtimeMs / 1000)

      return meta['Thumb::URI'] === uri && parseInt(meta['Thumb::MTime'] || '0', 10) === actualMtime
    } catch {
      return false
    }
  }
}
