---
title: Dockerfile 与 Compose 部署项目
date: 2026-11-16
tags:
  - Docker
  - Dockerfile
  - Compose
  - 部署
---

# Dockerfile 与 Compose 部署项目

这次用本地 VitePress 项目 `xm-knowledge` 练习把源码部署到腾讯云服务器。过程从编写 `Dockerfile`、`.dockerignore` 和 Compose 配置开始，继续处理依赖安装、构建内存、GitHub 拉取、镜像和容器更新，以及服务器已有端口和 Docker 网络的冲突。

## 1. 整体流程 — 从源码到运行中的站点

```text
本地修改并 push 到 GitHub
        │
        ▼
服务器在项目目录 git pull
        │
        ▼
docker compose up -d --build
        │
        ├─ Dockerfile 构建阶段：安装依赖并生成 VitePress 静态文件
        ├─ Dockerfile 运行阶段：把静态文件放进 Nginx 镜像
        └─ Compose：使用镜像创建或更新容器
```

部署文件的职责不同：`Dockerfile` 描述如何把源码做成镜像，`.dockerignore` 控制哪些文件进入构建上下文，`compose.yml` 描述服务怎样运行。

## 2. Dockerfile — 把 VitePress 项目做成镜像

项目的 Dockerfile 使用多阶段构建：Node 阶段负责安装依赖和生成静态文件，Nginx 阶段负责提供网页。

```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install --global pnpm@11.25.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=1536 pnpm docs:build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/docs/.vitepress/dist/ /usr/share/nginx/html/

EXPOSE 80
```

| 指令 | 在这个项目里的作用 |
| --- | --- |
| `FROM node:24-alpine AS builder` | 创建构建阶段，用 Node 和 pnpm 处理源码 |
| `WORKDIR /app` | 设置后续命令的工作目录 |
| `COPY ... pnpm-workspace.yaml ./` | 先复制依赖清单和 pnpm 构建脚本许可配置 |
| `pnpm install --frozen-lockfile` | 按锁文件安装依赖，不擅自改锁文件 |
| `COPY . .` | 把未被 `.dockerignore` 排除的项目文件复制进构建阶段 |
| `pnpm docs:build` | 执行 VitePress 构建，生成静态站点文件 |
| `FROM nginx:alpine` | 开始最终运行阶段，只用 Nginx 托管网页 |
| `COPY --from=builder ...` | 把构建阶段的静态文件复制进最终镜像 |
| `EXPOSE 80` | 声明容器内服务使用 80 端口，不会自动占用服务器的 80 端口 |

多阶段构建让最终镜像只包含 Nginx 配置和静态网页，不包含 Node、pnpm、依赖目录和完整源码。

## 3. `.dockerignore` — 控制构建时要带哪些文件

Docker 构建会把构建上下文交给构建器。项目根目录的 `.dockerignore` 排除了不需要参与镜像构建的文件：

- `node_modules`、`.git`：本机依赖和 Git 历史
- `.agents`、`.codegraph`、`.history`、`.omo`、`.playwright-mcp`、`.trae`、`skills-lock.json`：本机编辑和智能体工具状态
- `.DS_Store`、`.github`：操作系统元数据和 CI 配置
- `docs/spec`、`docs/superpowers`、VitePress 缓存和已生成的 `dist`：不参与本次镜像构建的文件
- `.env` 与 `.env.*`：可能包含秘密的本地环境配置；`.env.example` 例外保留

忽略规则覆盖整个构建上下文及其子目录。Dockerfile 仍会把构建所需源码复制到构建阶段。

`.dockerignore` 和 `.gitignore` 解决的问题不同：前者决定 Docker 构建时发送哪些文件，后者决定 Git 是否跟踪文件。被 `.dockerignore` 排除的文件仍可能在 Git 仓库里，反过来也一样。

## 4. pnpm 安装 — 显式允许依赖构建脚本

服务器构建最初在 `pnpm install --frozen-lockfile` 失败，输出提示 `esbuild` 和 `sharp` 的构建脚本被忽略。pnpm 会要求项目明确允许哪些依赖执行安装构建脚本。

项目将许可记录在 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  esbuild@0.21.5: true
  sharp@0.34.5: true
```

Dockerfile 复制了该文件，再运行 `pnpm install`，所以构建容器会读取与仓库一起提交的许可配置。只在本机运行 `pnpm approve-builds` 不一定能解决服务器构建：如果审批结果没有保存到仓库内的配置文件，Docker 构建环境就拿不到这项决定。

## 5. 构建内存 — 处理 VitePress 的 JavaScript 堆溢出

服务器最初在 `pnpm docs:build` 阶段报 `JavaScript heap out of memory`。日志显示 Node 堆接近约 1 GiB 上限；服务器有约 1.9 GiB 内存和 1.9 GiB Swap。Swap 是磁盘空间，不等于同等速度的物理内存。

Dockerfile 为构建命令设置：

```dockerfile
RUN NODE_OPTIONS=--max-old-space-size=1536 pnpm docs:build
```

`--max-old-space-size=1536` 把 Node.js 的 V8 JavaScript 堆上限提高到约 1536 MiB。之后镜像构建成功。它只调整 Node 堆上限，不会增加服务器物理内存；实际构建仍受容器和服务器可用资源影响。

## 6. Compose YAML — 描述服务、镜像和网络

项目的 `compose.yml`：

```yaml
services:
  xm-knowledge:
    build: .
    image: xm-knowledge:latest
    restart: unless-stopped
    networks:
      - starsprout_default

networks:
  starsprout_default:
    external: true
```

| 配置 | 含义 |
| --- | --- |
| `services` | 列出这个 Compose 项目要运行的服务 |
| `xm-knowledge` | Compose 内的服务名，也可供同一 Docker 网络中的容器查找 |
| `build: .` | 使用当前项目目录里的 Dockerfile 构建镜像 |
| `image: xm-knowledge:latest` | 给构建结果设置本地镜像名和标签 |
| `restart: unless-stopped` | 容器异常退出或服务器重启后自动恢复，除非用户手动停止 |
| `external: true` | 接入已存在的 Docker 网络，让 Compose 不负责创建和删除它 |

`image: xm-knowledge:latest` 是镜像的本地名称和标签，不代表已经上传 Docker Hub。这个项目是在服务器上用 Compose 本地构建镜像；只有明确执行镜像仓库登录和 `docker push`，才会上传到仓库。

当前 Compose 文件没有 `ports`。这不是遗漏：服务器的 80 和 443 已由 `starsprout-web` 占用，不能再让另一个容器绑定相同宿主机端口。`xm-knowledge` 连接到现有 `starsprout_default` 网络，供同网络的入口容器访问它的容器内 80 端口。如何按域名转发请求属于后续的域名与反向代理主题。

## 7. 服务器更新 — 拉取源码并重新构建

代码在本地 push 后，服务器需要进入**包含 `compose.yml` 的仓库目录**再更新：

```bash
git pull --ff-only
sudo docker compose up -d --build
sudo docker compose ps
```

如果服务器还没有仓库，先在计划好的应用目录 clone，再进入仓库目录。GitHub SSH 出现 `Permission denied (publickey)` 表示服务器没有配置对应 SSH 公钥；这次服务器访问 GitHub HTTPS 也发生超时，改用可访问的 HTTPS 镜像地址后 clone 成功。Git 拉取问题和 Dockerfile 构建问题是两个不同环节。

`sudo docker compose up -d --build` 会先按 Dockerfile 构建镜像，再创建或更新 Compose 服务容器，并让容器在后台运行。更新静态站内容时需要 `--build`，否则容器可能继续使用旧镜像。

`--remove-orphans` 会删除属于**当前 Compose 项目**、但已经不在当前 YAML 服务列表里的孤儿容器。它不清理所有项目的容器；运行前应确认是否要移除被删掉或改名的旧服务。

## 8. 小结

| 知识点 | 说明 |
| --- | --- |
| `Dockerfile` | 描述如何从项目源码构建镜像 |
| 多阶段构建 | 分开构建环境和最终运行环境 |
| `.dockerignore` | 排除不需要发送给 Docker 构建器的文件 |
| `pnpm-workspace.yaml` | 记录依赖安装构建脚本的许可 |
| `NODE_OPTIONS` | 调整 Node 构建时可使用的 JavaScript 堆上限 |
| Compose `build` | 指定从哪个目录构建服务镜像 |
| Compose `image` | 设置本地镜像名称和标签 |
| `ports` | 发布容器端口到服务器端口，可能发生端口冲突 |
| 外部 Docker 网络 | 让不同 Compose 项目的容器加入同一个网络 |
| `docker compose up -d --build` | 构建镜像并后台创建或更新服务 |

## 9. 参考文档

- [Docker 构建上下文与 `.dockerignore`](https://docs.docker.com/build/concepts/context/)
- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [Dockerfile `EXPOSE`](https://docs.docker.com/reference/dockerfile/#expose)
- [Docker Compose `up`](https://docs.docker.com/reference/cli/docker/compose/up/)
- [Docker Compose 网络](https://docs.docker.com/compose/how-tos/networking/)
- [pnpm 构建脚本许可](https://pnpm.io/settings#allowbuilds)
