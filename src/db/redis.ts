import redis from 'redis'
import Config from '../config'
const { redisConf } = Config

// 创建客户端
const { port, host } = redisConf

const url = `redis://${host}:${port}`

// 创建 redis 连接
const redisClient = redis.createClient({
  url,
})

export default redisClient
