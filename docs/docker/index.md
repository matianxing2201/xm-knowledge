---
title: Docker 学习笔记
description: Ubuntu 云服务器上的 Docker 基础与部署实践
date: 2026-11-13
tags:
  - Docker
  - Linux
  - 云服务器
---

# Docker 学习笔记

实战站点：<https://starsprout.tianxinglab.cloud/>

## 学习进度

- Linux 目录与文件放置：已完成。
- [StarSprout 保姆级部署教程（引言）](./Docker-01-StarSprout部署教程)：已完成，站点已上线 HTTPS。
- [云服务器与 Docker 环境检查](./Docker-02-云服务器与环境检查)：已完成。
- [镜像与容器](./Docker-03-镜像容器与Nginx)：已完成。
- [数据卷与挂载](./Docker-04-数据卷与挂载)：正在学习。

已在服务器本机和公网浏览器访问 Nginx 欢迎页，也验证了容器日志、停止和重新启动。数据卷已验证可在容器删除后继续读取；当前 `nginx-demo` 正在运行。
