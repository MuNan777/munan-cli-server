import type Application from 'koa'
import type { Server } from 'socket.io'
import type { ExtendedError } from 'socket.io/dist/namespace'
import build from './socket-io-controller/build'
import auth from './middleware/auth'

export type NextType = (err?: ExtendedError | undefined) => void

export function socketRouteBuilder(io: Server, app: Application) {
  io.of('/build').use(async (socket, next) => {
    await auth(app, socket, async () => await build(app, socket, next))
  })
}
