import type Application from 'koa'
import type { Socket } from 'socket.io'
import { cacheDelete, cacheGet, cacheSet } from '../cache'
import type { NextType } from '../socket-route'
import { parseMsg } from '../utils/helper'
import Config from '../config'
import CloudBuildTask from '../model/CloudBuildTask'
import { log } from '../utils'
const { PREFIX } = Config

export default async function auth(app: Application, socket: Socket, next: NextType) {
  const id = socket.id
  const task = id
  const ctx = app.context
  try {
    const query = socket.handshake.query
    socket.emit(id, parseMsg('connect', {
      type: 'connect',
      message: '云构建服务连接成功',
    }))
    const tick = (id: string, msg: {} | undefined) => {
      log('#tick', id, msg)
      // 踢出用户前发送消息
      socket.emit(id, parseMsg('deny', msg))
      // 踢出用户，客户端触发 disconnect 事件
      socket.disconnect(true)
    }
    let hasTask = await cacheGet(`${PREFIX}:${task}`)
    if (!hasTask)
      await cacheSet(`${PREFIX}:${task}`, JSON.stringify(query))
    log('query', JSON.stringify(query))
    hasTask = await cacheGet(`${PREFIX}:${task}`)
    if (!hasTask) {
      tick(id, {
        type: 'deleted',
        message: '云构建任务创建失败，自动退出',
      })
      return
    }
    socket.join(task)

    next()

    log('#leave', task)
    if (hasTask) {
      // 兜底逻辑，确保缓存文件被删除
      const cloudBuildTask = new CloudBuildTask({
        repo: query.repo,
        type: query.type,
        name: query.name,
        branch: query.branch,
        version: query.version,
        prod: query.prod,
        keepCache: query.keepCache,
        cnpm: query.cnpm,
        buildCmd: query.buildCmd,
      }, { ctx })
      cloudBuildTask.clean()
      await cacheDelete(`${PREFIX}:${task}`)
    }
  }
  catch (e) {
    console.error('auth error', e)
    console.error('auth error', e.message)
    await cacheDelete(`${PREFIX}:${task}`)
  }
}
