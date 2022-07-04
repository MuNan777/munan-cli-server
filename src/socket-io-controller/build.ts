import type Application from 'koa'
import type { Socket } from 'socket.io'
import type { NextType } from '../socket-route'
import { cacheGet } from '../cache'
import { parseMsg } from '../utils/helper'
import CloudBuildTask from '../model/CloudBuildTask'

import Config from '../config'
const { PREFIX } = Config

async function createCloudBuildTask(app: Application, socket: Socket) {
  const client = socket.id
  const ctx = app.context
  const redisKey = `${PREFIX}:${client}`
  const task = await cacheGet(redisKey)
  socket.emit('build', parseMsg('create task', {
    message: '创建启动云构建任务',
  }))
  let result: CloudBuildTask | null = null
  if (task) {
    result = new CloudBuildTask({
      repo: task.repo,
      type: task.type,
      name: task.name,
      branch: task.branch,
      version: task.version,
      prod: task.prod,
      keepCache: task.keepCache,
      useCNpm: task.useCNpm,
      buildCmd: task.buildCmd,
      socket,
    }, { ctx })
  }
  return result
}

async function prepare(cloudBuildTask: CloudBuildTask, socket: Socket) {
  socket.emit('build', parseMsg('prepare', {
    message: '开发执行构建前检查',
  }))
  const prepareRes = await cloudBuildTask.prepare()
  if (!prepareRes || prepareRes.code === -1) {
    socket.emit('build', parseMsg('prepare failed', {
      message: `执行构建检查失败，失败原因：${prepareRes.message}`,
    }))
    return
  }
  socket.emit('build', parseMsg('prepare', {
    message: '构建前检查成功',
  }))
}

async function download(cloudBuildTask: CloudBuildTask, socket: Socket) {
  socket.emit('build', parseMsg('download repo', {
    message: '开始下载源码',
  }))
  const downloadRes = await cloudBuildTask.download()
  if (!downloadRes) {
    socket.emit('build', parseMsg('download failed', {
      message: '源码下载失败',
    }))
    return
  }
  socket.emit('build', parseMsg('download repo', {
    message: '源码下载成功',
  }))
}

async function install(cloudBuildTask: CloudBuildTask, socket: Socket) {
  socket.emit('build', parseMsg('build', {
    message: '开始安装依赖',
  }))
  const buildRes = await cloudBuildTask.install()
  if (!buildRes) {
    socket.emit('build', parseMsg('build failed', {
      message: '依赖安装失败',
    }))
    return
  }
  socket.emit('build', parseMsg('build', {
    message: '依赖安装成功',
  }))
}

async function buildProject(cloudBuildTask: CloudBuildTask, socket: Socket) {
  socket.emit('build', parseMsg('build', {
    message: '开启启动云构建',
  }))
  const buildRes = await cloudBuildTask.build()
  if (!buildRes) {
    socket.emit('build', parseMsg('build failed', {
      message: '云构建失败',
    }))
    return
  }
  socket.emit('build', parseMsg('build', {
    message: '云构建成功',
  }))
}

export default async function build(app: Application, socket: Socket, next: NextType) {
  const cloudBuildTask = await createCloudBuildTask(app, socket)
  try {
    if (cloudBuildTask) {
      socket.on('build', async () => {
        await prepare(cloudBuildTask, socket)
        await download(cloudBuildTask, socket)
        await install(cloudBuildTask, socket)
        await buildProject(cloudBuildTask, socket)
      })
    }
    else {
      socket.emit('build', parseMsg('error', {
        message: '云构建失败，失败原因：CloudBuildTask 对象构建失败',
      }))
    }
  }
  catch (err) {
    socket.emit('build', parseMsg('error', {
      message: `云构建失败，失败原因：${err.message}`,
    }))
    if (cloudBuildTask)
      cloudBuildTask.clean()

    socket.disconnect()
  }
  next()
}

