import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getPublicUrl(key: string): string
}

class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads')
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const normalizedKey = normalizeKey(key)
    const filePath = path.join(this.baseDir, normalizedKey)
    const dirPath = path.dirname(filePath)

    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true })
    }

    await writeFile(filePath, data)

    return this.getPublicUrl(normalizedKey)
  }

  async download(key: string): Promise<Buffer> {
    const normalizedKey = normalizeKey(key)
    const filePath = path.join(this.baseDir, normalizedKey)

    return readFile(filePath)
  }

  async delete(key: string): Promise<void> {
    const normalizedKey = normalizeKey(key)
    const filePath = path.join(this.baseDir, normalizedKey)

    await unlink(filePath)
  }

  getPublicUrl(key: string): string {
    const normalizedKey = normalizeKey(key)
    return `/api/upload?path=${encodeURIComponent(normalizedKey)}`
  }
}

export function createStorage(): StorageProvider {
  return new LocalStorageProvider()
}

function normalizeKey(key: string): string {
  return key.replace(/^\/+/, '').replace(/\\/g, '/')
}
