import type Application from 'koa'

export type Context<T = any> = Application.BaseContext & Application.DefaultContext & T
