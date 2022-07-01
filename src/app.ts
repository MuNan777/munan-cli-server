import path from 'path'
import fs from 'fs'

import { createServer } from 'http'

import Koa from 'koa'
import json from 'koa-json'
import onerror from 'koa-onerror'
import bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import koaStatic from 'koa-static'

import { Server } from 'socket.io'
import { getDirName } from '../utils/index.mjs'
import { socketRouteBuilder } from './socket-route'
import { cacheConnect } from './cache/index'

const app = new Koa()

// 创建服务
const server = createServer(app.callback())

// 设置 socket.io
const io = new Server(server)

const __dirname = getDirName(import.meta.url)

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text'],
}))
app.use(json())
app.use(logger())
app.use(koaStatic(path.resolve('..', __dirname, 'public')))

// logger
app.use(async (ctx, next) => {
  const start = new Date().getTime()
  await next()
  const ms = new Date().getTime() - start
  // eslint-disable-next-line no-console
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
const files = fs.readdirSync(path.resolve(__dirname, './routes')) || []
files.forEach(async (file) => {
  if (file.endsWith('.mjs')) {
    const str = path.resolve(__dirname, './routes', file)
    const item = (await import(`file://${str}`)).default
    app.use(item.routes()).use(item.allowedMethods())
  }
})

// socket 路由
socketRouteBuilder(io, app)

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

// 初始化 redis
async function initRedis() {
  await cacheConnect()
}
initRedis()

export default server
