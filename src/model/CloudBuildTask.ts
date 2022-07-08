import path from 'path'
import fs from 'fs'
import childProcess from 'child_process'
import fse from 'fs-extra'
import type Application from 'koa'
import userHome from 'user-home'
import type { SimpleGit } from 'simple-git'
import Git from 'simple-git'
import type { Socket } from 'socket.io'
import Config from '../config'
import { log } from '../utils'

const { DEFAULT_CLI_HOME, PREFIX } = Config

const SUCCESS = 0
const FAILED = -1

class CloudBuildTask {
  private _ctx: Application.BaseContext & Application.DefaultContext
  private _repo: string
  private _name: string
  private _branch: string
  private _version: string
  private _prod: string
  private _keepCache: string
  private _useCNpm: string
  private _usePNpm: string
  private _buildCmd: string
  private _deployCmd: string
  private _dir: string
  private _sourceCodeDir: string
  private _git: SimpleGit
  private _socket: Socket

  constructor({ repo, name, branch, version, prod, keepCache, useCNpm, usePNpm, buildCmd, socket, deployCmd }, { ctx }) {
    this._ctx = ctx
    this._repo = repo
    this._name = name
    this._branch = branch
    this._version = version
    this._prod = prod
    this._keepCache = keepCache
    this._useCNpm = useCNpm
    this._usePNpm = usePNpm
    this._buildCmd = buildCmd
    this._deployCmd = deployCmd
    this._dir = path.resolve(userHome, DEFAULT_CLI_HOME, PREFIX, `${this._name}@${this._version}`)
    this._socket = socket
    if (this._dir && this._name)
      this._sourceCodeDir = path.resolve(this._dir, this._name)
    this.log('this._dir', this._dir)
    this.log('this._sourceCodeDir', this._sourceCodeDir)
  }

  async prepare() {
    fse.ensureDirSync(this._dir)
    fse.emptyDirSync(this._dir)
    this._git = Git(this._dir)
    return this.success()
  }

  async download() {
    fse.ensureDirSync(this._sourceCodeDir)
    fse.emptyDirSync(this._sourceCodeDir)
    await this._git.clone(this._repo)
    this._git = Git(this._sourceCodeDir)
    await this._git.checkout([
      '-b',
      this._branch,
      `origin/${this._branch}`,
    ])
    if (fs.existsSync(this._sourceCodeDir))
      return true
    return false
  }

  async install() {
    let res = true
    if (this.isUseCNpm()) { res && (res = await this.execCommand('cnpm install')) }
    else if (this.isUsePNpm()) { res && (res = await this.execCommand('pnpm install')) }
    else {
      res && (res = await this.execCommand('npm install --only=prod --registry=https://registry.npm.taobao.org'))
      res && (res = await this.execCommand('npm install --only=dev --registry=https://registry.npm.taobao.org'))
    }
    return res
  }

  async build() {
    let res = true
    if (this._buildCmd && this._buildCmd.startsWith('npm run build'))
      res && (res = await this.execCommand(this._buildCmd))
    else
      res && (res = await this.execCommand('npm run build'))
    return res
  }

  async deploy(path: string) {
    let res = true
    if (this._deployCmd && this._deployCmd.startsWith('npm run deploy'))
      res && (res = await this.execCommand(`${this._deployCmd} -- --config-path=${path}`))
    else
      res && (res = await this.execCommand(`npm run deploy:cloud -- --config-path=${path}`))
    return res
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

  isProd() {
    return this._prod === 'true'
  }

  isUseCNpm() {
    return this._useCNpm === 'true'
  }

  isUsePNpm() {
    return this._usePNpm === 'true'
  }

  execCommand(commandStr: string): Promise<boolean> {
    const commands = commandStr.split(' ')
    if (commands.length === 0)
      return Promise.resolve(false)
    const command = commands[0]
    const argv = commands.slice(1) || []
    return new Promise((resolve) => {
      const p = exec(command, argv, {
        cwd: this._sourceCodeDir,
        stdio: 'pipe',
      })
      p.on('error', (e) => {
        log('build error', e)
        resolve(false)
      })
      p.on('exit', (c) => {
        log('build exit', JSON.stringify(c))
        resolve(true)
      })
      p.stdout.on('data', (data) => {
        this._socket.emit('building', data.toString())
      })
      p.stderr.on('data', (data) => {
        this._socket.emit('building', data.toString())
      })
    })
  }

  success(message?: string, data?: unknown) {
    return this.response(SUCCESS, message, data)
  }

  failed(message?: string, data?: unknown) {
    return this.response(FAILED, message, data)
  }

  response(code: number, message?: string, data?: unknown) {
    return {
      code,
      message,
      data,
    }
  }
}

function exec(command: string, args: string[], options: childProcess.SpawnOptionsWithoutStdio) {
  const win32 = process.platform === 'win32'

  const cmd = win32 ? 'cmd' : command
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args

  return childProcess.spawn(cmd, cmdArgs, options || {})
}

export default CloudBuildTask
