import fse from 'fs-extra'
import { createEntries, getDirName } from './utils/index.mjs'

const files = fse.readdirSync('src')

const entries = {}

files.forEach((file) => {
  createEntries(file, getDirName(import.meta.url), 'src', entries)
})

// eslint-disable-next-line no-console
console.log(entries)
