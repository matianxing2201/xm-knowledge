---
title: StarSprout 保姆级部署教程
date: 2026-11-13
tags:
  - Docker
  - Compose
  - Nginx
  - HTTPS
  - 云服务器
---

# StarSprout 保姆级部署教程（引言）

部署完成后的站点地址：**<https://starsprout.tianxinglab.cloud/>**

前面的笔记停留在 `nginx-demo` 欢迎页和数据卷实验。这一篇是整个 Docker 模块的引言：把真实项目「星芽 StarSprout」（Vue 3 + Vite 的静态站）部署到腾讯云服务器上，全程 HTTPS。重点讲清楚三件事——**每一步敲什么命令**、**项目里的 Dockerfile / compose.yaml / nginx 配置各自干什么**、**踩过的坑怎么解**。

## 1. 部署目标 — 站点跑在哪、怎么跑

- 域名：`starsprout.tianxinglab.cloud`，解析到腾讯云服务器 `111.229.43.185`
- 站点是纯静态站：`pnpm build` 产出 `dist/` 目录，用 nginx 托管即可
- 证书用 Let's Encrypt（免费、90 天有效期、自动续期）
- 采用**双轨策略**：GitHub Pages 继续当生产环境，云服务器是学习实验田，跑顺了再切换

整体链路：

```text
你 Mac 上 push 代码
      │
      ▼
服务器：git pull 拉代码
      │
      ▼
docker build：容器里跑 pnpm install + pnpm build 产出 dist/
      │
      ▼
镜像 = nginx + dist/  ──► 容器对外开 80/443（nginx）
      │
      └── 另一个容器 certbot 负责签发和续期 HTTPS 证书
```

## 2. 项目里五个文件各干什么

部署相关的文件都在仓库根目录，先总览一遍，后面逐个拆解：

| 文件 | 一句话职责 |
| --- | --- |
| `Dockerfile` | 说明书：怎么把源码变成「nginx + dist/」的镜像 |
| `compose.yaml` | 编排：起哪几个容器、端口怎么映射、文件怎么挂进去 |
| `docker/nginx/http.conf` | 第一阶段站点配置：HTTP 先跑起来，顺带应答签证书验证 |
| `docker/nginx/ssl.conf` | 第二阶段站点配置：正式 HTTPS，80 只留跳转 |
| `.env`（服务器上手动建） | 记录当前处于哪个阶段：`NGINX_CONF=http.conf` 或 `ssl.conf` |
| `deploy.sh` | 日常更新三连：`git pull` → `up -d --build` → `ps` |

> ==核心思路：代码构建进镜像（Dockerfile），运行状态用变量切换（.env），多容器关系用 compose 声明。==

## 3. Dockerfile — 怎么把源码变成镜像

Dockerfile 采用**多阶段构建**：第一阶段只为了产出文件，第二阶段只为了托管文件，最终镜像里不带 Node 和源码。

```dockerfile
########## 阶段一：构建 —— 产出 dist/ ##########
FROM node:22-alpine AS build
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

# 只先拷贝依赖清单：只要 package.json / lock 不变，
# `pnpm install` 这层就命中缓存，改代码重建时不用重新装依赖。
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 再拷入源码并构建（pnpm build = vue-tsc --build && vite build）。
COPY . .
RUN pnpm build

########## 阶段二：托管 —— 镜像里只有 nginx + dist/ ##########
FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

逐块解释：

| 片段 | 干什么 |
| --- | --- |
| `FROM node:22-alpine AS build` | 第一阶段：从 Docker Hub 拉 Node 22 精简镜像，起名 `build` |
| `corepack prepare pnpm@11.25.0` | 启用 pnpm 并锁版本，和 GitHub CI 用同一版本，保证三处构建一致 |
| `COPY package.json pnpm-lock.yaml ./` | **先只拷依赖清单**——Docker 按指令顺序缓存，清单没变这层直接复用，不重装依赖 |
| `RUN pnpm install --frozen-lockfile` | 按锁文件精确安装依赖 |
| `COPY . .` + `RUN pnpm build` | 拷入全部源码，跑 `vue-tsc` 类型检查 + `vite build` 产出 `dist/` |
| `FROM nginx:1.29-alpine` | 第二阶段：换一个干净的 nginx 镜像当底座 |
| `COPY --from=build /app/dist ...` | 只把上一阶段的产物 `dist/` 搬过来，Node、源码全部丢弃 |

关键点：

1. **多阶段构建的意义**：最终镜像只有 nginx + 静态文件（几十 MB），而不是带着整个 Node 工具链（几百 MB）。
2. **分层缓存**：`COPY` 后面的指令才会因文件变化而重跑。把 `package.json` 的拷贝放在 `COPY . .` 之前，就是为了让「装依赖」这层在改代码时不必重来。
3. **站点配置故意不打进镜像**（文件里没写 `COPY *.conf`），而是由 compose 以只读卷挂入——这样 http/ssl 两阶段切换不用重建镜像。

## 4. compose.yaml — 两个容器怎么协同

```yaml
services:
  web:
    build:
      context: .
    image: starsprout-web
    container_name: starsprout-web
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/${NGINX_CONF:-http.conf}:/etc/nginx/conf.d/default.conf:ro
      - certbot-www:/var/www/certbot:ro
      - certbot-conf:/etc/letsencrypt:ro
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        nginx -g 'daemon off;' &
        nginx_pid=$!
        trap 'kill -s TERM "$$nginx_pid"; exit 0' TERM
        while :; do
          sleep 6h &
          wait $$!
          kill -0 "$$nginx_pid" 2>/dev/null || exit 1
          kill -s HUP "$$nginx_pid"
        done

  certbot:
    image: certbot/certbot
    container_name: starsprout-certbot
    restart: unless-stopped
    volumes:
      - certbot-www:/var/www/certbot
      - certbot-conf:/etc/letsencrypt
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        trap 'exit' TERM
        while :; do
          sleep 6h &
          wait $$!
          certbot renew --webroot -w /var/www/certbot
        done

volumes:
  certbot-www:
  certbot-conf:
```

### 4.1 web 服务 — nginx

| 配置 | 作用 |
| --- | --- |
| `build: context: .` | 镜像不从仓库拉，按当前目录的 Dockerfile 现场构建 |
| `restart: unless-stopped` | 容器崩溃或服务器重启后自动拉起 |
| `ports` | 宿主机 80/443 转发到容器里的 nginx |
| `${NGINX_CONF:-http.conf}` | 从项目根 `.env` 读变量决定挂哪份配置；没写 `.env` 就默认 `http.conf` |
| `:ro` | 挂载只读，容器改不了宿主机文件 |
| `command` 里的循环 | nginx 前台跑着，循环每 6 小时给它发一次 `HUP` 信号——**reload**，让续期后的新证书立即生效 |

几个细节：

- `command` 必须用 `- |` 把整段脚本作为**一个整体**传给 `sh -c`。如果写成普通字符串，compose 会按空格拆成多个参数，脚本会碎掉。
- `HUP` 是 nginx 的 reload 信号：不中断服务、平滑换上新证书和新配置。
- 脚本还 `trap` 了 `TERM`（`docker stop` 发的就是 TERM），转发给 nginx 优雅退出。

### 4.2 certbot 服务 — 证书签发与续期

- 它和 web 共享两个**具名卷**：`certbot-www`（验证用的应答文件）、`certbot-conf`（证书存放处）。
- 每 6 小时跑一次 `certbot renew`：没到「距到期 < 30 天」什么都不做；到了就把新证书写进 `certbot-conf` 卷，web 容器下次 reload 时生效。
- **不需要**给容器挂 `docker.sock`，也不需要宿主机装 cron——续期逻辑全部在 compose 里闭环。

### 4.3 阶段切换 — `.env` 的作用

```bash
# 第 6 步签证书前（或创建站点时）
echo 'NGINX_CONF=http.conf' > .env
# 第 7 步证书签发成功后
sed -i 's/NGINX_CONF=http.conf/NGINX_CONF=ssl.conf/' .env
docker compose up -d    # 挂载变了，web 容器自动重建
```

`.env` 只是「这台服务器当前处于哪个阶段」的本地状态，不进 git（`.gitignore` 已排除）。

## 5. nginx 两份配置 — 各自响应什么请求

### 5.1 http.conf（阶段一：先跑起来）

```nginx
server {
    listen 80;
    server_name starsprout.tianxinglab.cloud;

    root /usr/share/nginx/html;
    index index.html;

    # certbot 的「所有权证明」放在这个路径，Let's Encrypt 会来抽查
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 入口文件不缓存，发新版后浏览器立刻拿到新 index.html
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Vite 产物文件名带内容哈希（index-Bx3k9s.js），可放心长缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 回退：路径没命中真实文件时回落到 index.html，
    # 由 vue-router 在前端解析路由（等价于 GitHub Pages 的 404.html 技巧）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

三个核心概念：

1. **`try_files` SPA 回退**：地址栏输 `/lesson/3` 时磁盘上并没这个文件，nginx 不报 404，而是返回 `index.html`，让 Vue 路由在浏览器里接管。这是单页应用托管的标配。
2. **ACME 验证路径**：`/.well-known/acme-challenge/` 指到 certbot 的共享卷。签证书时 Let's Encrypt 会访问 `http://域名/.well-known/acme-challenge/xxx`，能抽查到内容才认你拥有这个域名。
3. **缓存策略两头兼顾**：`index.html` 不缓存（保证更新入口），`/assets/` 哈希文件缓存一年（内容变则文件名变，永不失效）。

### 5.2 ssl.conf（阶段二：正式 HTTPS）

和 http.conf 的差别就三点：

| 差异 | 说明 |
| --- | --- |
| 80 端口只剩两件事 | 应答续期验证 + 其余请求 `return 301` 跳到 https |
| 新增 443 server 块 | `listen 443 ssl` + `ssl_certificate` 指向 `/etc/letsencrypt/live/.../fullchain.pem` |
| 签证书验证路径保留 | 续期仍走 HTTP 抽查，所以 `acme-challenge` 必须留着 |

> ==没有证书时不要切 ssl.conf：nginx 会因找不到证书文件拒绝启动，容器直接起不来。==

## 6. 保姆级部署步骤（按顺序照敲）

### 第 0 步：腾讯云控制台两件事

1. **DNS**：在 `tianxinglab.cloud` 的解析里加 A 记录，主机记录 `starsprout` → `111.229.43.185`
2. **安全组**：入站规则放行 80 和 443 端口

验证 DNS 生效：

```bash
ping -c 2 starsprout.tianxinglab.cloud
# 解析出 111.229.43.185、0% packet loss 即正确
```

### 第 1 步：SSH 登录

```bash
ssh ubuntu@111.229.43.185
```

### 第 2 步：准备 Docker 权限

腾讯云镜像自带 Docker。把当前账号加入 `docker` 组，避免每条命令都写 `sudo`：

```bash
sudo usermod -aG docker ubuntu
newgrp docker          # 当前会话立即生效，不用断开重连
groups                 # 输出里应出现 docker
docker version         # 不报 permission denied 即成功
```

**坑 1**：如果跳过这步直接跑 compose，会报：

```text
permission denied while trying to connect to the docker API at unix:///var/run/docker.sock
```

解法就是上面的 `usermod` + `newgrp`。（`sudo docker ...` 也能跑，但 compose 会去找 root 的 `.env`，阶段变量会失效，所以走正路。）

### 第 3 步：克隆仓库（国内直连 GitHub 会失败）

先用浅克隆，只拉最新一个提交，体积从几十 MB 缩到几 MB：

```bash
rm -rf /opt/app/starsprout   # 清掉可能失败的残留
git clone --depth 1 https://ghfast.top/https://github.com/matianxing2201/star-sprout.git /opt/app/starsprout
cd /opt/app/starsprout
```

**坑 2**：国内直连经常报 `GnuTLS recv error (-110): The TLS connection was non-properly terminated`——连不上而已，换镜像加速前缀（`ghfast.top` 或 `gh-proxy.com`）即可。

**坑 3**：镜像地址会成为 `origin`，以后 `deploy.sh` 里的 `git pull` 都走它。哪天镜像挂了，一条命令切回官方：

```bash
git remote set-url origin https://github.com/matianxing2201/star-sprout.git
```

> `--depth 1` 不影响后续 `git pull`，每次只拉增量。

### 第 4 步：声明部署阶段变量

```bash
cat > .env <<'EOF'
NGINX_CONF=http.conf
EOF
```

作用只有一个：告诉 compose 这次把 `http.conf` 挂进容器（详见 §4.3）。

### 第 5 步：构建镜像并起站

```bash
docker compose up -d --build
docker compose ps        # web 应显示 Up
curl -I http://starsprout.tianxinglab.cloud   # 期待 HTTP/1.1 200
```

**坑 4**：如果 compose 报 `no configuration file provided: not found`，是命令不在仓库目录里执行——先 `cd /opt/app/starsprout`。

`--build` 的作用：按 Dockerfile 重新构建镜像（有缓存，没改动时几乎秒过），再用新镜像替换容器。**只 `up -d` 不带 `--build`，拉下来的新代码不会进镜像。**

### 第 6 步：签发 HTTPS 证书

```bash
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d starsprout.tianxinglab.cloud \
  --email 你的真实邮箱@example.com \
  --agree-tos --no-eff-email
```

- `你的真实邮箱` 必须换成真实地址（Let's Encrypt 发到期提醒用），占位符原样发会因格式非法报错
- 成功标志：`Successfully received certificate`，证书落在 `/etc/letsencrypt/live/starsprout.tianxinglab.cloud/`
- 这次签发有效期到 2027-02-11（90 天），之后由 §4.2 的容器循环自动续期

### 第 7 步：切换到 HTTPS

```bash
sed -i 's/NGINX_CONF=http.conf/NGINX_CONF=ssl.conf/' .env
cat .env          # 确认显示 NGINX_CONF=ssl.conf
docker compose up -d
curl -I https://starsprout.tianxinglab.cloud   # 期待 HTTP/1.1 200
```

浏览器打开 `https://starsprout.tianxinglab.cloud`，地址栏出现小锁即全线打通。

### 第 8 步：日常出问题看什么

```bash
docker compose ps                 # 谁没起来
docker compose logs web | tail -20        # web（nginx）日志
docker compose logs certbot | tail -20    # 续期日志
```

## 7. 日常更新 — 只需要一条命令

服务器上 `/opt/app/starsprout` 目录里：

```bash
./deploy.sh
```

它等价于三条命令：

```bash
git pull --ff-only            # 拉新代码
docker compose up -d --build   # 重建镜像 + 用新镜像换容器
docker compose ps              # 确认状态
```

| 疑问 | 答案 |
| --- | --- |
| 为什么不只 `up -d`？ | 站点代码是构建时打进镜像的，不 `--build` 就跑的还是旧镜像 |
| `--build` 会不会每次都重装依赖？ | 不会。`package.json` 没变时依赖层走缓存；只有源码层重跑 `pnpm build` |
| 只改了 nginx 配置呢？ | 配置是运行时挂载的，`up -d` 重建容器即生效；统一用 `deploy.sh` 不用区分 |
| 以后能不能自动化？ | 跑顺后可以升级：GitHub push 触发服务器 webhook 或 CI SSH 执行 `deploy.sh` |

## 8. 小结

1. `Dockerfile` 用多阶段构建：第一阶段 `pnpm build` 产出 `dist/`，第二阶段只把产物搬进 nginx 镜像，最终镜像不带 Node 和源码。
2. 分层缓存是构建快的关键：依赖清单先拷、源码后拷，改代码不重装依赖。
3. `compose.yaml` 起两个容器：web（nginx + dist/）和 certbot（签发 + 每 6 小时续期检查），通过共享卷交换验证文件和证书。
4. web 容器里的循环每 6 小时给 nginx 发 `HUP` 信号 reload，续期后的新证书平滑生效；不需要 docker.sock，也不需要宿主机 cron。
5. `try_files` 实现 SPA 路由回退；`acme-challenge` 路径应答 Let's Encrypt 抽查；`index.html` 不缓存、`/assets/` 哈希文件长缓存。
6. 部署分两阶段：先 `.env` 指向 `http.conf` 起 HTTP 站，签完证书再切 `ssl.conf` 上 HTTPS。
7. 日常更新就是 `./deploy.sh`；不带 `--build` 的更新不会生效。
8. 国内服务器克隆 GitHub 用「`--depth 1` + 镜像加速前缀」；Docker 权限用 `usermod -aG docker` + `newgrp docker`。

## 9. 参考文档

- [Dockerfile 参考](https://docs.docker.com/reference/dockerfile/)
- [多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [Compose 应用编排](https://docs.docker.com/compose/how-tos/start-services/)
- [Compose 变量插值（`.env`）](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Nginx `try_files` 指令](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [Nginx reload 信号与热重载](https://nginx.org/en/docs/control.html)
- [certbot webroot 插件](https://certbot.readthedocs.io/en/stable/using.html#webroot)
- [Let's Encrypt 续期机制](https://letsencrypt.org/docs/faq/#how-long-are-my-certificates-valid)
