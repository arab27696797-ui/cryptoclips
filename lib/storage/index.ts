import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getPublicUrl(key: string): string
}

function normalizeKey(key: string): string {
  return key.replace(/^\/uploads\//, '').replace(/^\/+/, '')
}

class LocalStorage implements StorageProvider {
  private baseDir: string

  constructor() {
    this.baseDir = join(process.cwd(), 'uploads')
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const normalized = normalizeKey(key)
    const filePath = join(this.baseDir, normalized)
    const dir = filePath.split('/').slice(0, -1).join('/')

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    await writeFile(filePath, data)
    return this.getPublicUrl(normalized)
  }

  async download(key: string): Promise<Buffer> {
    const normalized = normalizeKey(key)
    const filePath = join(this.baseDir, normalized)
    return readFile(filePath)
  }

  async delete(key: string): Promise<void> {
    const { unlink } = await import('fs/promises')
    const normalized = normalizeKey(key)
    const filePath = join(this.baseDir, normalized)
    await unlink(filePath)
  }

  getPublicUrl(key: string): string {
    const normalized = normalizeKey(key)
    return `/api/upload?path=${normalized}`
  }
}

export function createStorage(): StorageProvider {
  return new LocalStorage()
}
