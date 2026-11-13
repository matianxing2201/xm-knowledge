---
title: Ubuntu 云服务器与 Docker 环境检查
date: 2026-11-13
tags:
  - Docker
  - Ubuntu
  - Linux
  - 云服务器
---

# Ubuntu 云服务器与 Docker 环境检查

## 1. 服务器环境 — Ubuntu 24.04

这台机器装的是 Ubuntu 24.04.4 LTS，架构为 `amd64`。

内存共 1.9 GiB，已用约 441 MiB；Swap 共 1.9 GiB，尚未使用。根分区共 50 GiB，已用约 5.9 GiB，可用约 42 GiB。

![Ubuntu 云服务器的系统、用户和资源检查](/images/docker/01检查服务器.png)

## 2. 目录怎么放 — 学习文件与应用

课程实验放在自己的 home 目录，应用文件放 `/opt/apps`；Docker 配置和内部数据分别由管理员与 Docker 管理。

```text
/
├── home/ubuntu/docker-learning/   # 课程练习
│   ├── lesson01/
│   ├── lesson02/
│   └── lesson03/
├── opt/apps/                      # 部署的应用
│   └── portfolio/
│       ├── compose.yaml
│       ├── nginx/
│       └── web/
├── etc/docker/                    # Docker 服务配置
│   └── daemon.json
└── var/lib/docker/                # Docker 管理的数据
```

| 路径 | 放什么 |
| --- | --- |
| `~/docker-learning` | 学习和实验文件 |
| `/opt/apps` | 应用文件和 Compose 配置 |
| `/etc/docker` | Docker 服务配置 |
| `/var/lib/docker` | Docker 管理的镜像、容器等数据 |

不要手动改 `/var/lib/docker` 里的文件。需要保留的数据，后续用 Docker Volume 等方式管理。

## 3. 检查 Docker — CLI、Engine 和 Compose

腾讯云服务器上原本就有 Docker，所以这次没有重复安装。用下面的命令确认 CLI、Engine 和 Compose：

```bash
docker --version
sudo docker version
sudo docker compose version
```

`docker --version` 只显示 CLI 版本。`docker version` 还会显示 Server 信息；有 Client 和 Server 两部分，说明 CLI 已连接到后台 Engine。Compose 命令中间是空格：`docker compose`。

这次看到的版本是：

| 组件 | 结果 |
| --- | --- |
| Docker CLI | 29.6.1，`linux/amd64` |
| Docker Engine | 29.6.1 |
| Docker Compose | v5.3.1 |

CLI 和 Engine 的版本来自终端截图；Compose 版本来自我发来的终端输出。

![Docker CLI、Engine 和运行时版本](/images/docker/02检查docker环境.png)

要单独确认 Docker 服务状态，可以运行：

```bash
sudo systemctl is-active docker
```

正常输出是 `active`。目前的截图没有这条命令的输出记录。

目前继续用 `sudo docker`。暂时不把账号加入 `docker` 用户组，因为这个组拥有接近 root 的权限。

## 4. 运行 hello-world

我运行了：

```bash
sudo docker run --rm hello-world
```

第一次运行时，如果本机还没有 `hello-world` 镜像，Docker 会先下载它，再创建并启动容器。看到 `Hello from Docker!` 就说明测试成功。`--rm` 会在容器退出后自动删除容器，镜像还留在本机。

| 写法 | 作用 |
| --- | --- |
| `sudo` | 用管理员权限运行命令 |
| `docker run` | 创建并启动容器 |
| `--rm` | 退出后删除容器 |
| `hello-world` | 要运行的镜像 |

## 5. 小结

1. Docker CLI 接收命令，并把请求发给 Docker Engine。
2. Docker Engine 在后台管理镜像和容器。
3. Docker Compose 用 `docker compose` 管理多容器应用。
4. 应用部署文件放在 `/opt/apps`；`/var/lib/docker` 交给 Docker 管理。

## 6. 参考文档

- [Docker Engine 安装](https://docs.docker.com/engine/install/)
- [Docker `version` 命令](https://docs.docker.com/reference/cli/docker/version/)
- [Docker Compose `version` 命令](https://docs.docker.com/reference/cli/docker/compose/version/)
- [Docker Engine 安全说明](https://docs.docker.com/engine/security/)
