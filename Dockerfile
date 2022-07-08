FROM node:14
WORKDIR /app
COPY . /app

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' >/etc/timezone

# 安装
RUN npm install -g pnpm
RUN pnpm install

# 执行命令
CMD npm run build && npm run prod && npx pm2 log