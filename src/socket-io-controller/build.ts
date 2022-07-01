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
  const redisTask = await cacheGet(redisKey)
  const task = JSON.parse(redisTask)
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
      cnpm: task.cnpm,
      buildCmd: task.buildCmd,
    }, { ctx })
  }
  return result
}

export default async function build(app: Application, socket: Socket, next: NextType) {
  const cloudBuildTask = await createCloudBuildTask(app, socket)
  // eslint-disable-next-line no-console
  console.log(cloudBuildTask)
  next()
}

