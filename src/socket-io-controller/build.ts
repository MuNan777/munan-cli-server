import path from 'path'
import fs from 'fs'
import type Application from 'koa'
import type { Socket } from 'socket.io'
import { cacheDelete, cacheGet } from '../cache'
import type { NextType } from '../socket-route'
import { parseMsg } from '../utils/helper'
import CloudBuildTask from '../model/CloudBuildTask'
import Config from '../config'
import { getDirName } from '../utils/file'
const { PREFIX } = Config

let projectName = ''

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
    projectName = task.name
    result = new CloudBuildTask({
      repo: task.repo,
      name: task.name,
      branch: task.branch,
      version: task.version,
      prod: task.prod,
      keepCache: task.keepCache,
      useCNpm: task.useCNpm,
      usePNpm: task.usePNpm,
      buildCmd: task.buildCmd,
      deployCmd: task.deployCmd,
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
  const configPath = path.resolve(getDirName(import.meta.url), '../..', 'deployConfig', `${projectName}.js`)
  const downloadRes = await cloudBuildTask.download(configPath)
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

async function deployProject(cloudBuildTask: CloudBuildTask, socket: Socket) {
  socket.emit('build', parseMsg('deploy', {
    message: '开启启动云发布',
  }))
  if (projectName !== '') {
    const configPath = path.resolve(getDirName(import.meta.url), '../..', 'deployConfig', `${projectName}.js`)
    if (fs.existsSync(configPath)) {
      const buildRes = await cloudBuildTask.deploy(configPath)
      if (!buildRes) {
        socket.emit('build', parseMsg('deploy failed', {
          message: '云发布失败',
        }))
        return
      }
      socket.emit('build', parseMsg('deploy', {
        message: '云发布成功',
      }))
    }
    else {
      socket.emit('build', parseMsg('deploy failed', {
        message: '云发布失败, 未找到发布配置文件',
      }))
    }
  }
  else {
    socket.emit('build', parseMsg('deploy failed', {
      message: '云发布失败, 项目名称不存在',
    }))
  }
}

export default async function build(app: Application, socket: Socket, next: NextType) {
  const cloudBuildTask = await createCloudBuildTask(app, socket)
  await new Promise((resolve, reject) => {
    try {
      if (cloudBuildTask) {
        socket.on('build', async () => {
          await prepare(cloudBuildTask, socket)
          await download(cloudBuildTask, socket)
          await install(cloudBuildTask, socket)
          await buildProject(cloudBuildTask, socket)
          await deployProject(cloudBuildTask, socket)
          socket.disconnect()
          if (cloudBuildTask)
            cloudBuildTask.clean()
          const hasTask = await cacheGet(`${PREFIX}:${socket.id}`)
          if (hasTask)
            await cacheDelete(`${PREFIX}:${socket.id}`)
          resolve(cloudBuildTask)
        })
        next()
      }
      else {
        socket.emit('build', parseMsg('error', {
          message: '云构建失败，失败原因：CloudBuildTask 对象构建失败',
        }))
        reject(new Error('云构建失败，失败原因：CloudBuildTask 对象构建失败'))
      }
    }
    catch (err) {
      socket.emit('build', parseMsg('error', {
        message: `云构建失败，失败原因：${err.message}`,
      }))
      if (cloudBuildTask)
        cloudBuildTask.clean()
      socket.disconnect()
      reject(err)
    }
  })
}

