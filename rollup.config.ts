import esbuild from 'rollup-plugin-esbuild'// 将 ts 转换成 js
import resolve from '@rollup/plugin-node-resolve' // 让rollup支持nodejs的模块解析机制
import commonjs from '@rollup/plugin-commonjs' // 将CommonJs模块转换为es6
import json from '@rollup/plugin-json' // 将json文件转换为es6
import { defineConfig } from 'rollup'
import fse from 'fs-extra'
import pkg from './package.json'

import { createEntries } from './utils/index.mjs'

const files = fse.readdirSync('src')

const entries = {}

files.forEach((file) => {
  createEntries(file, __dirname, 'src', entries)
})

const plugins = [
  resolve({
    preferBuiltins: true,
  }),
  json(),
  commonjs(),
  esbuild({
    target: 'node14',
  }),
]

function onwarn(message) {
  if (message.code === 'EMPTY_BUNDLE')
    return
  console.error(message)
}

const external = [
  ...Object.keys(pkg.dependencies || {}),
]

export default defineConfig([
  {
    input: entries,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].mjs',
      chunkFileNames: 'chunk-[name].mjs',
    },
    external,
    plugins,
    onwarn,
  },
])
