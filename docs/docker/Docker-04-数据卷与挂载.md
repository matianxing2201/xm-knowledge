---
title: Docker 数据卷与挂载
date: 2026-11-13
tags:
  - Docker
  - 数据卷
  - 持久化
---

# Docker 数据卷与挂载

容器会被删除，数据不一定要跟着消失。这一节用一个命名数据卷和一次只读绑定挂载，实际看它们分别怎样连接容器与服务器文件。

## 1. 查看和创建数据卷

先查看当前数据卷：

```bash
sudo docker volume ls
```

开始练习前，列表为空。随后创建一个命名卷：

```bash
sudo docker volume create docker-data-demo
```

再次查看时，出现 `local` 驱动的数据卷 `docker-data-demo`。数据卷由 Docker 管理，可以独立于容器存在。

## 2. 查看数据卷位置

```bash
sudo docker volume inspect docker-data-demo
```

返回信息中，`Driver` 为 `local`，`Mountpoint` 为：

```text
/var/lib/docker/volumes/docker-data-demo/_data
```

这是 Ubuntu 服务器上的 Docker 管理目录。普通 `ubuntu` 用户直接进入 `/var/lib/docker` 会遇到权限限制；本次用 `sudo` 查看。日常通过容器挂载数据卷来读写即可，不需要直接修改 Docker 管理目录。

## 3. 挂载数据卷并验证数据保留

使用已有的 `nginx:alpine` 镜像创建临时容器，把命名卷挂载到容器内的 `/data`，然后写入文件：

```bash
sudo docker run --rm \
  --mount type=volume,source=docker-data-demo,target=/data \
  --entrypoint sh nginx:alpine \
  -c 'echo "hello from volume" > /data/message.txt'
```

命令成功后没有额外输出。`--rm` 会在命令结束时删除临时容器；挂载的数据卷不会因此删除。

随后创建另一个临时容器，挂载同一个卷并读取文件：

```bash
sudo docker run --rm \
  --mount type=volume,source=docker-data-demo,target=/data \
  --entrypoint cat nginx:alpine \
  /data/message.txt
```

终端成功输出 `hello from volume`。这确认文件保存在数据卷中，新的容器可以读到它。

## 4. 命名卷和绑定挂载

命名卷由 Docker 创建和管理，例如 `docker-data-demo`。绑定挂载则指定服务器上已有的目录，并映射到容器内的路径。

本次将服务器的 `/opt` 以只读方式挂载到临时容器的 `/host-opt`：

```bash
sudo docker run --rm \
  --mount type=bind,source=/opt,target=/host-opt,readonly \
  --entrypoint ls nginx:alpine \
  -la /host-opt
```

输出中能看到服务器 `/opt` 下的 `app` 和 `containerd`。`readonly` 让这个容器只能读取该目录，不能通过这个挂载修改它。

| 挂载方式 | 谁管理数据位置 | 常见用途 |
| --- | --- | --- |
| 命名卷 | Docker | 数据库文件、需要跨容器保留的数据 |
| 绑定挂载 | 用户指定服务器目录 | 开发时共享项目文件、读取配置或静态文件 |

两种方式都能把服务器数据提供给容器。选择哪一种，取决于数据应由 Docker 管理，还是需要直接对应服务器上的某个目录。

## 5. 小结

1. `docker volume ls` 查看数据卷，`docker volume create` 创建命名卷。
2. `docker volume inspect` 可查看卷的驱动和服务器存储位置。
3. 把命名卷挂载进容器后，容器删除了，卷里的数据仍可由另一个容器读取。
4. 命名卷由 Docker 管理；绑定挂载直接映射服务器指定的目录。
5. `readonly` 可将绑定挂载设为只读。本次只读查看了 `/opt`，没有改动其中内容。

## 6. 参考资料

- [Docker 数据卷](https://docs.docker.com/engine/storage/volumes/)
- [Docker 绑定挂载](https://docs.docker.com/engine/storage/bind-mounts/)
- [Docker `volume` 命令](https://docs.docker.com/reference/cli/docker/volume/)
- [Docker `run` 命令](https://docs.docker.com/reference/cli/docker/container/run/)
