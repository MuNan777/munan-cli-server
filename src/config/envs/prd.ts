import os from 'os'

const type = os.type()

// host.docker.internal 只能在 windows / mac 使用 Linux 需要使用服务器 ip
let host = 'host.docker.internal'
if (type === 'Linux')
  host = 'host.docker.internal'

export default {
  // redis 连接配置
  redisConf: {
    port: '6379',
    host,
  },
}
