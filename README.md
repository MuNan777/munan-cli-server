<h1 align="center">Welcome to munan-cli-server 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
</p>

> munan-cli 配套云发布项目

## Install

```sh
pnpm install
```

## Set

```bash
mkdir .docker-volumes/deployConfig
cd .docker-volumes/deployConfig
touch [项目名称].js
```

导入执行 `npm run deploy:cloud` 所需的配置

配置将会以 `--config-path=<configPath>` 的参数传入命令行，可通过 `process.argv` 获取

##### 配置例子

```js
// 以腾讯云 cos 为例
const SECRET_ID = 'xxx'

const SECRET_KEY = 'xxx'

const LOCATION = 'xxx'

const BUCKET_NAME = 'xxx'

const DIST_NAME = 'xxx'

// 云发布可能需要设置 git token 以保证 docker 容器内有拉取代码权限
// gitee 格式: user:password
// github 格式：token
const GIT_TOKEN = ''

module.exports = {
  SECRET_ID,
  SECRET_KEY,
  LOCATION,
  BUCKET_NAME,
  DIST_NAME,
  GIT_TOKEN,
}
```

## Usage

```sh
docker-compose up -d
```

## Author

* Github: [@MuNan777](https://github.com/MuNan777)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/MuNan777/munan-cli-server/issues). 

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_