import redis from 'redis'
import Config from '../config'
const { redisConf } = Config

// 创建客户端
const { port, host, password } = redisConf

let url = `redis://${host}:${port}`
if (password) {
  // prd 环境需要账号密码
  url = `redis://:${password}//${host}:${port}`
}

// 创建 redis 连接
const redisClient = redis.createClient({
  url,
})

export default redisClient
