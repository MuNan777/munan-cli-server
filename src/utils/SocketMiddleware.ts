import type Application from 'koa'
import type { Socket } from 'socket.io'

export type NextCallBack = (socket: Socket, next: () => Promise<void>, app?: Application) => Promise<void>

function parseName(name: string): string[] {
  const arr = ['/']
  let temp = '/'
  for (let i = 1; i < name.length; i++) {
    if (name.charAt(i) !== '/')
      temp += name.charAt(i)

    if (name[i] === '/' || i === name.length - 1) {
      arr.push(temp)
      temp += name.charAt(i)
    }
  }
  return arr.reverse()
}

function handleMiddleware(middlewareArr: NextCallBack[], callBack: () => Promise<void>, socket: Socket, app: Application) {
  return middlewareArr.reduce<() => Promise<void>>((a, b) => {
    return async () => { await b(socket, a, app) }
  }, async () => { await callBack() })
}

class SocketMiddleware {
  private _routeMap: {
    [key: string]: NextCallBack[]
  }

  private _app: Application<Application.DefaultState, Application.DefaultContext>

  constructor(app: Application) {
    this._app = app
    this._routeMap = {
      default: [],
    }
  }

  useMiddleware = (socket: Socket, callBack: () => Promise<void>) => {
    const result = handleMiddleware(this._routeMap.default, callBack, socket, this._app)
    const name = socket.nsp.name
    const keys = parseName(name)
    const fnMap = {
      '-1': result,
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (this._routeMap[key])
        fnMap[`${i}`] = handleMiddleware(this._routeMap[key], fnMap[`${i - 1}`], socket, this._app)
      else
        fnMap[`${i}`] = async () => { await fnMap[`${i - 1}`]() }
    }
    fnMap[`${keys.length - 1}`]()
  }

  use = (url?: string | NextCallBack, callBack?: NextCallBack) => {
    if (typeof url === 'string' && callBack) {
      if (!this._routeMap[url])
        this._routeMap[url] = []
      this._routeMap[url].unshift(callBack)
    }
    if (typeof url === 'function')
      this._routeMap.default.unshift(url)
  }
}

export default SocketMiddleware
