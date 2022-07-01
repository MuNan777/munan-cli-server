import type Application from 'koa'
import type { Server } from 'socket.io'
import type { ExtendedError } from 'socket.io/dist/namespace'
import build from './socket-io-controller/build'
import auth from './socket-io-controller/auth'

export type NextType = (err?: ExtendedError | undefined) => void

export function socketRouteBuilder(io: Server, app: Application) {
  io.of('/').use((socket, next) => {
    auth(app, socket, next)
  })
  io.of('/build').use((socket, next) => {
    build(app, socket, next)
  })
}
