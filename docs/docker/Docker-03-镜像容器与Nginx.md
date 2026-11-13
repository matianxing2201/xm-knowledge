---
title: Docker 镜像与容器
date: 2026-11-13
tags:
  - Docker
  - 镜像
  - 容器
  - Nginx
---

# Docker 镜像与容器

`hello-world` 已经跑通。这个单元先分清镜像和容器，再查看服务器上的实际状态。

## 1. 镜像和容器 — 一个模板与它的实例

镜像是创建容器用的模板；容器是用镜像启动出来的实例。同一个镜像可以启动多个容器。镜像通常从 Docker Hub 这类仓库下载。

| 名称 | 简单理解 | 查看命令 |
| --- | --- | --- |
| Image（镜像） | 创建容器用的模板 | `sudo docker image ls` |
| Container（容器） | 镜像启动后的实例 | `sudo docker ps` |
| 已停止的容器 | 已退出、但还没有删除的实例 | `sudo docker ps -a` |

```bash
sudo docker image ls
sudo docker ps
sudo docker ps -a
```

`docker pull` 只下载镜像；`docker run` 才会创建并启动容器。

## 2. hello-world 为什么看不到容器

运行时用了 `--rm`：

```bash
sudo docker run --rm hello-world
```

程序结束后，Docker 自动删除了这次测试容器。因此 `docker ps -a` 里找不到它，但 `hello-world` 镜像还在，可以用 `docker image ls` 查看。

> ==容器删掉了，镜像还在。它们是两种不同的东西。==

## 3. 查看服务器状态 — 镜像和容器

我在 `/opt` 下运行了下面这些命令：

```bash
sudo docker ps
sudo docker image ls
sudo docker ps -a
```

结果是：`docker image ls` 里有 `hello-world:latest`；`docker ps` 和 `docker ps -a` 都没有列出容器。这正是 `--rm` 的效果：测试容器退出后被删除，镜像仍留在本机。

## 4. 拉取 Nginx 镜像

确认完镜像和容器列表后，再执行：

```bash
sudo docker pull nginx:alpine
sudo docker image ls
```

`pull` 只下载镜像，不会启动网站。`nginx:alpine` 中 `nginx` 是镜像名，`alpine` 是标签。

这次拉取成功，列表中有：

| 镜像 | ID | DISK USAGE | CONTENT SIZE |
| --- | --- | --- | --- |
| `hello-world:latest` | `cf1b20a0c89a` | 25.9 kB | 9.49 kB |
| `nginx:alpine` | `713fc2ebfd92` | 94.5 MB | 27.3 MB |

新版 Docker 额外显示了两种本机空间统计：`DISK USAGE` 包含镜像内容和本地解包后的数据，`CONTENT SIZE` 是镜像内容存储的大小。它们不是同一个口径。

### 启动 Nginx 容器

镜像已经下载，接下来用 `docker run` 创建并启动容器：

```bash
sudo docker run -d --name nginx-demo -p 8080:80 nginx:alpine
```

`-d` 让容器在后台运行，`--name` 给它一个方便记忆的名字，`-p 8080:80` 把服务器的 8080 端口转到容器的 80 端口。云厂商安全组是否允许外部访问，需要另外确认。

这次命令返回的容器 ID 以 `f521a2d19716` 开头。第一次执行 `docker ps` 没加 `sudo`，终端提示无权访问 Docker socket；加上 `sudo` 后命令成功。当前账号还没有加入 `docker` 用户组，所以后续 Docker 命令继续使用 `sudo`。

`sudo docker ps` 显示 `nginx-demo` 状态为 `Up`，端口映射为 `0.0.0.0:8080->80/tcp` 和 `[::]:8080->80/tcp`。这表示 Docker 已将服务器各网络接口的 8080 端口转到容器的 80 端口；公网是否能访问还取决于云厂商安全组。

![nginx-demo 容器运行状态和端口映射](/images/docker/03-nginx容器运行.png)

### 本机访问 Nginx

在服务器上运行：

```bash
curl -I http://127.0.0.1:8080
```

返回 `HTTP/1.1 200 OK`，响应头中的 Server 是 `nginx/1.31.8`，说明 Nginx 已经正常响应本机请求。

![curl 本机访问 Nginx 返回 HTTP 200](/images/docker/04-nginx本机访问.png)

### 从公网访问网页

在浏览器打开服务器公网 IP 的 8080 端口后，页面显示 `Welcome to nginx!`。本机 HTTP 检查和公网浏览器访问都成功，说明容器、Docker 端口映射和轻量应用服务器防火墙规则已连通。

![浏览器通过公网访问 Nginx 欢迎页](/images/docker/05-nginx公网访问.png)

### 查看容器日志

```bash
sudo docker logs nginx-demo
```

这条命令已成功打印容器日志。容器在后台运行时，可以通过 `docker logs` 查看它输出到标准输出和标准错误的信息。

### 停止和重新启动容器

停止 Nginx 后查看所有容器：

```bash
sudo docker stop nginx-demo
sudo docker ps -a
```

这次状态变为 `Exited (0)`。容器停止了，但仍保留在本机；镜像也没有删除。

重新启动同一个容器：

```bash
sudo docker start nginx-demo
sudo docker ps
```

`docker start` 返回 `nginx-demo`，再次查看时 ID 仍是 `f521a2d19716`，状态变为 `Up`，端口映射也恢复了。它启动的是原来的容器，没有新建一个。

### 删除临时容器

为了确认容器和镜像可以分别管理，我又运行了一次 `hello-world`，这次没有加 `--rm`：

```bash
sudo docker run --name hello-world-demo hello-world:latest
sudo docker ps -a
```

`hello-world-demo` 打印欢迎信息后退出，状态为 `Exited (0)`；与此同时，`nginx-demo` 仍处于 `Up` 状态。

删除这个已停止的临时容器：

```bash
sudo docker rm hello-world-demo
```

命令返回 `hello-world-demo`。再次查看 `docker ps -a`，列表里只剩仍在运行的 `nginx-demo`；`docker image ls` 仍能看到 `hello-world:latest` 和 `nginx:alpine`。`docker rm` 删除的是容器，不会连带删除镜像。

## 5. 小结

1. `docker pull` 只下载镜像，`docker run` 才会创建并启动容器。
2. `docker image ls` 查看镜像，`docker ps -a` 查看所有容器。
3. 使用 `--rm` 启动的容器退出后会自动删除；不加 `--rm` 时，退出的容器会保留。
4. `docker rm` 删除容器，不会删除对应镜像。
5. `nginx-demo` 正常运行，本机和公网浏览器访问都成功。
6. `docker logs nginx-demo` 可以查看容器输出的信息。
7. `docker stop` 只停止容器；`docker start` 可以重新启动同一个容器。

## 6. 参考文档

- [Docker 镜像](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)
- [Docker 容器](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)
- [Docker `image ls` 命令](https://docs.docker.com/reference/cli/docker/image/ls/)
- [Docker `ps` 命令](https://docs.docker.com/reference/cli/docker/container/ls/)
- [Docker `run` 命令](https://docs.docker.com/reference/cli/docker/container/run/)
- [Docker `pull` 命令](https://docs.docker.com/reference/cli/docker/image/pull/)
- [Docker `rm` 命令](https://docs.docker.com/reference/cli/docker/container/rm/)
- [Docker 端口发布](https://docs.docker.com/engine/network/port-publishing/)
- [Docker Hub](https://hub.docker.com/)
