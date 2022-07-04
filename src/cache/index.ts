import redisClient from '../db/redis'

export async function cacheConnect() {
  await redisClient.connect()
}

export async function cacheQuit() {
  redisClient.quit()
}

/**
 * redis set
 * @param {string} key key
 * @param {string|Object} val val
 * @param {number} timeout 过期时间，单位 s ，默认 1h
 */
export async function cacheSet(key: string, val: unknown, timeout: number = 60 * 60) {
  let formatVal: string
  if (typeof val === 'object')
    formatVal = JSON.stringify(val)
  else
    formatVal = val as string

  await redisClient.set(key, formatVal, { EX: timeout })
}

export async function cacheGet(key: string) {
  try {
    const val = await redisClient.get(key)
    if (val === null)
      return null
    try {
      return JSON.parse(val)
    }
    catch (ex) {
      console.error(ex)
      return val
    }
  }
  catch (err) {
    return err
  }
}

export async function cacheDelete(key: string) {
  return await redisClient.del(key)
}
