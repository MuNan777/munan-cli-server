import url from 'url'
import path from 'path'

export function getDirName(importMetaUrl: string) {
  return path.dirname(getFileName(importMetaUrl))
}

export function getFileName(importMetaUrl: string) {
  return url.fileURLToPath(importMetaUrl)
}
