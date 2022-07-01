import path, { resolve } from 'path'
import url from 'url'

import { statSync } from 'fs'
import pkg from 'fs-extra'
const { readdirSync } = pkg

export function getDirName(importMetaUrl) {
  return path.dirname(getFileName(importMetaUrl))
}

export function getFileName(importMetaUrl) {
  return url.fileURLToPath(importMetaUrl)
}

export function createEntries(file, dirName, dir, entries, suffix = 'ts') {
  const p = resolve(dirName, dir, file)
  const stat = statSync(p)
  if (stat.isFile()) {
    const ext = file.split('.').pop()
    if (ext === suffix) {
      const name = `${dir.replace(/src\/?/, '')}${dir === 'src' ? '' : '/'}${file.split('.')[0]}`
      entries[name] = `./${dir}/${file}`
    }
  }
  if (stat.isDirectory()) {
    const files = readdirSync(p)
    files.forEach((f) => {
      createEntries(f, dirName, `${dir}/${file}`, entries)
    })
  }
}
