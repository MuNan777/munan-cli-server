import path from 'path'
import fs from 'fs'
import fse from 'fs-extra'
import type Application from 'koa'
import userHome from 'user-home'
import Config from '../config'
import { log } from '../utils'

const { DEFAULT_CLI_HOME, PREFIX } = Config

class CloudBuildTask {
  private _ctx: Application.BaseContext & Application.DefaultContext
  private _repo: string
  private _type: string
  private _name: string
  private _branch: string
  private _version: string
  private _prod: boolean
  private _keepCache: string
  private _cnpm: boolean
  private _buildCmd: string
  private _dir: string
  private _sourceCodeDir: string

  constructor({ repo, type, name, branch, version, prod, keepCache, cnpm, buildCmd }, { ctx }) {
    this._ctx = ctx
    this._repo = repo
    this._type = type
    this._name = name
    this._branch = branch
    this._version = version
    this._prod = prod
    this._keepCache = keepCache
    this._cnpm = cnpm
    this._buildCmd = buildCmd
    this._dir = path.resolve(userHome, DEFAULT_CLI_HOME, PREFIX, `${this._name}@${this._version}`)
    if (this._dir && this._name)
      this._sourceCodeDir = path.resolve(this._dir, this._name)
    this.log('this._dir', this._dir)
    this.log('this._sourceCodeDir', this._sourceCodeDir)
  }

  log(msg: string, data: string) {
    log(msg, data)
  }

  clean() {
    if (fs.existsSync(this._dir) && !this.isKeepCache()) {
      this.log('do clean', this._dir)
      fse.removeSync(this._dir)
    }
  }

  isKeepCache() {
    return this._keepCache === 'true'
  }
}

export default CloudBuildTask
