import { isPrd } from '../utils/env'
import constant from './constant'
import devConfig from './envs/dev'
import prdConfig from './envs/prd'

let config = devConfig
if (isPrd)
  config = prdConfig

// 导出配置
export default Object.assign(config, constant)

