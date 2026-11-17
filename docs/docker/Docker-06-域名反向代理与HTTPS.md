---
title: 域名、反向代理与 HTTPS
date: 2026-11-17
tags:
  - Docker
  - Nginx
  - 域名
  - DNS
  - HTTPS
  - TLS
  - 证书
  - 云服务器
---

# 域名、反向代理与 HTTPS

这次把 VitePress 知识库接入子域名 `xm-knowledge.tianxinglab.cloud`，并用腾讯云签发的证书启用 HTTPS。公网请求由 Ubuntu 主机上的 Nginx 接收，再转发给本机 Docker 容器。最终从浏览器确认：HTTPS 页面正常，HTTP 会跳转到 HTTPS。

## 1. 从浏览器到容器的访问链路

```text
浏览器访问 https://xm-knowledge.tianxinglab.cloud
        │
        ├─ DNS A 记录：域名解析到 111.229.43.185
        ├─ 腾讯云安全组：允许公网访问 TCP 443
        ▼
Ubuntu 主机 Nginx：监听 443，使用证书建立 HTTPS
        │
        └─ 反向代理到 127.0.0.1:8081
                  │
                  └─ Docker 端口映射到容器的 80
                            ▼
                    容器内 Nginx 提供 VitePress 静态页面
```

HTTP 请求走另一条入口：浏览器连到主机的 80 端口，主机 Nginx 返回 301 跳转，浏览器再用 HTTPS 访问 443 端口。

| 部分 | 在本次部署中的作用 |
| --- | --- |
| DNS A 记录 | 把域名解析为服务器 IPv4 地址 |
| 云服务器安全组 | 控制哪些公网端口可以进入服务器 |
| 主机 Nginx | 根据域名接收 HTTP/HTTPS 请求；在 HTTPS 入口处理证书并转发请求 |
| Docker 端口映射 | 将主机本机的 8081 转到容器的 80 |
| 容器内 Nginx | 读取镜像中的静态文件并返回网页 |

项目里的 `nginx.conf` 和服务器上的 `/etc/nginx/nginx.conf` 不是同一个配置。项目根目录的 `nginx.conf` 被 Dockerfile 复制进应用容器，用于提供静态文件；`/etc/nginx/nginx.conf` 属于 Ubuntu 主机上的 Nginx，用来加载主机级配置。两层 Nginx 的服务边界不同。

## 2. 子域名、DNS 和安全组

### 子域名记录

在 DNSPod 中，为 `tianxinglab.cloud` 新增主机记录 `xm-knowledge`、记录类型 `A`，记录值填写服务器公网 IPv4 `111.229.43.185`。完整域名因此是 `xm-knowledge.tianxinglab.cloud`。

| 记录类型 | 本次相关用途 |
| --- | --- |
| A | 把网站域名指向 IPv4 地址，浏览器访问网站时使用 |
| TXT | 证书签发时证明对域名有控制权，不负责把访客导向服务器 |

本次在服务器上用下面的命令确认 DNS 结果：

```bash
getent ahostsv4 xm-knowledge.tianxinglab.cloud
```

输出解析到 `111.229.43.185`，与 DNSPod 中填写的 A 记录一致。`STREAM`、`DGRAM`、`RAW` 是同一个地址对应的不同套接字类型，不代表配置了三条不同的 A 记录。

DNS 只负责把主机名解析到 IP。多个项目可以使用不同子域名指向同一台服务器；请求到达同一个 IP 后，由 Nginx 的 `server_name` 选择对应站点。每个站点使用自己的 `server` 配置块和后端地址。

### 安全组端口

本次访问使用的公网入口是：

| 端口 | 用途 |
| --- | --- |
| TCP 22 | SSH 登录服务器 |
| TCP 80 | HTTP 请求，以及 HTTP 到 HTTPS 的跳转 |
| TCP 443 | HTTPS 请求 |

腾讯云安全组和 Ubuntu 上的 UFW 是两层不同的防火墙。本次检查时 UFW 状态为 `inactive`，但云安全组仍然需要允许 80 和 443。应用容器的 8081 端口只绑定到 `127.0.0.1`，因此不需要把它开放给公网；控制台若仍留有旧的 8080/8081 入站规则，可在确认没有其他服务使用后清理。

## 3. 申请证书与验证域名

本次证书绑定的是完整域名 `xm-knowledge.tianxinglab.cloud`，不是主域 `tianxinglab.cloud`，也不是通配域名。申请时选择了自动 DNS 验证。腾讯云控制台自动添加了 TXT 验证记录，CA 扫描到记录后完成域名验证并签发证书。

| 验证方式 | 需要做什么 |
| --- | --- |
| 手动 DNS 验证 | 自己到域名解析平台添加证书页面给出的 TXT 记录 |
| 自动 DNS 验证 | DNS 由腾讯云 DNSPod 托管且满足账号条件时，由平台自动添加验证记录 |
| 文件验证 | 把指定验证文件放到网站可访问的路径，供 CA 检查 |

TXT 验证记录用于证明域名控制权；A 记录用于网站流量解析。验证页显示的 TXT 主机记录为 `_dnsauth.xm-knowledge`，记录值是本次申请生成的验证字符串。证书签发后，控制台提示可以删除本次验证记录。自动 DNS 验证的可用条件和记录要求以腾讯云当前控制台及官方说明为准。

申请页面当时显示免费证书额度为 `0/50`，签发后列表显示 `1/50`；页面显示证书有效期为 90 天，证书到期时间为 `2027-02-15 07:59:59`。这些是本次控制台显示的状态，免费额度和产品政策可能变化。控制台还提示泛域名（例如 `*.tianxinglab.cloud`）需要购买对应证书。因此本次采用单域名证书；多个子域名可分别申请各自的证书，是否可免费申请要以当时可用额度和页面规则为准。

本次证书列表显示“已签发、未托管”，随后下载 Nginx 格式的 `.crt` 和 `.key` 文件，并通过 SCP 上传到服务器。SCP 通过 SSH 加密传输文件；下载并不等于证书已经装到 Nginx，仍需把文件放到服务器并在 Nginx 中引用。

浏览器收到证书后会检查证书链、域名是否匹配以及证书是否有效，再通过 TLS 建立加密连接。DNS 解析成功不代表已经有 HTTPS；证书签发成功也不代表服务器已经安装证书。

## 4. 把证书安装到服务器

先建立专用目录：

```bash
sudo install -d -o root -g root -m 700 /etc/ssl/tianxinglab/xm-knowledge
```

| 部分 | 含义 |
| --- | --- |
| `sudo` | 以管理员权限执行，才能在 `/etc/ssl` 下创建目录 |
| `install -d` | 用 `install` 创建目录；`-d` 表示创建目录而不是复制普通文件 |
| `-o root` | 把目录所有者设为 `root` |
| `-g root` | 把目录所属组设为 `root` |
| `-m 700` | 设置目录权限：所有者可读、写、进入目录，组和其他用户无权限 |

安装证书链文件：

```bash
sudo install -o root -g root -m 644 \
  ~/xm-knowledge.tianxinglab.cloud_bundle.crt \
  /etc/ssl/tianxinglab/xm-knowledge/fullchain.crt
```

再以仅 root 可读写的权限安装私钥：

```bash
sudo install -o root -g root -m 600 \
  ~/xm-knowledge.tianxinglab.cloud.key \
  /etc/ssl/tianxinglab/xm-knowledge/privkey.key
```

`install` 会复制文件，并按参数设置所有者、所属组和权限。`644` 表示所有者可读写、其他用户可读；`600` 表示只有所有者可读写。实际检查结果为：

```text
-rw-r--r-- 1 root root 4472 ... fullchain.crt
-rw------- 1 root root 1704 ... privkey.key
```

`fullchain.crt` 是文件名约定，不是 Nginx 的特殊关键字。它提醒人们文件里应包含服务器证书及所需的中间证书链；Nginx 要求服务器证书放在前面，中间证书接在后面。`ssl_certificate` 指向证书链文件，`ssl_certificate_key` 指向与证书匹配的私钥。私钥不应提交到 Git，也不应放宽成所有用户都可读。

目录权限 `700` 还有一个实际影响：普通 `ubuntu` 用户即使看到证书文件权限为 `644`，也不能穿过 root 专用的父目录读取它。运行主机 Nginx 检查配置时需要使用 `sudo`；没有必要为了让普通用户读取证书而放宽私钥目录权限。

## 5. 主机 Nginx 的配置文件关系

这台 Ubuntu 服务器上的主配置文件是 `/etc/nginx/nginx.conf`。其中的 `include` 指令会加载额外配置。本次确认的相关写法是：

```nginx
include /etc/nginx/conf.d/*.conf;
include /etc/nginx/sites-enabled/*;
```

本次主机 Nginx 为 Ubuntu 软件包安装的 `nginx/1.24.0`，服务状态为 `active`。

`include` 后面可以是一个文件，也可以是匹配多个文件的通配符。路径中的目录名没有特殊魔法；是 `include` 指定 Nginx 去读取这些位置。

Ubuntu/Debian 常见的站点管理方式是：

| 路径 | 作用 |
| --- | --- |
| `/etc/nginx/sites-available/` | 保存站点配置 |
| `/etc/nginx/sites-enabled/` | 放已启用站点的符号链接，主配置通过 `include` 加载它们 |
| `/etc/nginx/conf.d/` | 放会被 `conf.d/*.conf` 匹配加载的配置文件 |

`sites-available` 和 `sites-enabled` 是发行版常见的组织约定，不是 Nginx 强制的目录名。Nginx 按主配置中的 `include` 指令加载文件。

本次 `sites-enabled/default` 曾经是指向 `/etc/nginx/sites-available/default` 的符号链接，但目标文件已经不存在。`ls -l` 仍能显示链接本身，`cat` 跟随链接读取时则报“找不到文件”。确认目标不存在后，删除了这条失效链接；随后启用 `xm-knowledge` 的站点链接。不要仅因为看见名为 `default` 的链接就删除它，先检查链接目标是否存在、是否仍承载其他站点。

## 6. Compose 端口与主机站点配置

项目 Compose 文件把容器的 80 端口发布到服务器本机的 8081：

```yaml
ports:
  - "127.0.0.1:8081:80"  # 绑定服务器本机的 8081，并转发到容器的 80 端口
```

冒号左侧的 `127.0.0.1:8081` 是宿主机地址和端口，右侧的 `80` 是容器端口。绑定 `127.0.0.1` 后，主机上的 Nginx 可以通过 `http://127.0.0.1:8081` 访问容器，公网用户不能直接通过服务器公网 IP 访问这个端口。这样容器不必再争抢主机的 80/443；公网请求统一由主机 Nginx 接收。

下面是保存在 `/etc/nginx/sites-available/xm-knowledge` 的主机站点配置。注释保留了每项配置的作用：

```nginx
# HTTP：接收普通网页请求，并跳转到 HTTPS。
server {
    listen 80;  # 监听 IPv4 的 HTTP 80 端口。
    listen [::]:80;  # 监听 IPv6 的 HTTP 80 端口。
    server_name xm-knowledge.tianxinglab.cloud;  # 这组规则匹配的域名。

    return 301 https://$host$request_uri;  # 永久跳转；保留原域名、路径和查询参数。
}

# HTTPS：终止 TLS 加密，再把网页请求转发给 Docker 容器。
server {
    listen 443 ssl;  # 监听 IPv4 的 HTTPS 443 端口，并启用 TLS。
    listen [::]:443 ssl;  # 监听 IPv6 的 HTTPS 443 端口，并启用 TLS。
    server_name xm-knowledge.tianxinglab.cloud;  # 选择该域名对应的 HTTPS 站点。

    ssl_certificate     /etc/ssl/tianxinglab/xm-knowledge/fullchain.crt;  # 服务器证书和中间证书链。
    ssl_certificate_key /etc/ssl/tianxinglab/xm-knowledge/privkey.key;  # 与证书配对的私钥。

    location / {  # 匹配该站点下的网页路径。
        proxy_pass http://127.0.0.1:8081;  # 转发到主机本机 8081，即容器的 80 端口。
        proxy_set_header Host $host;  # 把浏览器访问的域名传给后端。
        proxy_set_header X-Real-IP $remote_addr;  # 把当前连接的客户端 IP 传给后端。
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # 传递代理链中的客户端 IP。
        proxy_set_header X-Forwarded-Proto $scheme;  # 告诉后端原始请求使用的协议，此处为 https。
    }
}
```

逐行理解：

| 配置 | 含义 |
| --- | --- |
| `listen 80`、`listen 443 ssl` | 分别监听 HTTP、HTTPS 端口；`[::]` 形式额外监听 IPv6 |
| `server_name` | 按浏览器请求中的域名选择站点 |
| `return 301` | 返回永久重定向；`$host` 是请求域名，`$request_uri` 保留路径和查询参数 |
| `ssl_certificate` | Nginx 对外发送的服务器证书链 |
| `ssl_certificate_key` | 证书对应的私钥 |
| `location /` | 匹配该站点下的路径 |
| `proxy_pass` | 把请求交给后端服务；此处是同一台主机上的容器端口 |
| `proxy_set_header` | 补充原始域名、客户端地址和协议等信息，便于后端识别访客请求 |

同一台主机可以有多个使用不同 `server_name` 的站点配置，共用主机的 80/443 入口。站点可以分别代理到不同的本机端口。TLS 证书安装在主机入口 Nginx，因此浏览器到主机 Nginx 是 HTTPS；主机 Nginx 到本机容器这段使用 HTTP。

## 7. 启用配置、检查并重载

用符号链接启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/xm-knowledge /etc/nginx/sites-enabled/xm-knowledge
```

`ln -s` 创建符号链接。第一个路径是保存配置的位置，第二个路径是启用目录中的入口。命令成功时通常没有输出；链接建立后，主配置中的 `include /etc/nginx/sites-enabled/*;` 会让 Nginx 读到这份站点配置。

检查配置：

```bash
sudo nginx -t
```

`-t` 检查 Nginx 配置语法，并尝试打开配置中引用的文件，例如证书。第一次以普通 `ubuntu` 用户运行 `nginx -t` 时，因为证书目录属于 root 且权限为 `700`，出现了读取证书的 `Permission denied`；同时，主配置中的 `user` 指令因这次检查进程不是 root 而被忽略。加入 `sudo` 后检查成功：

主配置里的 `user` 指令用来指定 Nginx 工作进程使用的系统账号。Ubuntu 服务通常由 root 身份启动主进程，再让工作进程以较低权限运行；因此检查主机配置和读取 root 专用的证书路径时使用 `sudo`。

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

应用新配置：

```bash
sudo nginx -s reload
```

`-s reload` 向运行中的 Nginx 主进程发送重载信号，让它重新读取配置。配置通过检查后，Nginx 会平滑加载新配置；此次终端显示 `signal process started`，表示重载信号已发出。之后通过浏览器确认新配置工作正常。

编辑器提示 `W10: Warning: Changing a readonly file` 来自 Vim/Vi，不是 Nano。它表示 Vim 缓冲区被标记为只读；这和 Nginx 报出的 Unix 文件权限错误不是同一类问题。编辑 `/etc/nginx/` 下的系统配置时，需要用管理员权限打开文件。

## 8. 小结

1. DNS A 记录把子域名指向服务器 IP；TXT 记录可用于证书域名验证，两者用途不同。
2. 多个子域名可以指向同一服务器，由主机 Nginx 按 `server_name` 选择站点。
3. 本次采用主机 Nginx 作为共同公网入口；Docker 容器里的 Nginx 只负责提供静态文件。
4. Compose 把容器 80 端口绑定到 `127.0.0.1:8081`，由主机 Nginx 反向代理访问，无须公开 8081。
5. `sites-available` 保存配置，`sites-enabled` 中的符号链接让配置进入主配置的加载范围。
6. 证书链文件与私钥分开保存；私钥权限保持为 root 专用，测试主机配置时使用 `sudo nginx -t`。
7. 本次最终验证结果：HTTPS 页面可访问，HTTP 自动跳转到 HTTPS。
8. 控制台当时显示证书有效期为 90 天且尚未托管；到期前需要确认续签和重新部署安排。

## 9. 参考资料

- [NGINX Beginner’s Guide：配置文件与重载](https://nginx.org/en/docs/beginners_guide.html)
- [NGINX Core Module：include 指令](https://nginx.org/en/docs/ngx_core_module.html)
- [NGINX HTTPS 配置与证书链](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [NGINX SSL Module：ssl_certificate](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_certificate)
- [NGINX Proxy Module：proxy_pass 与请求头](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [NGINX 命令行参数：-t 与信号](https://nginx.org/en/docs/switches.html)
- [腾讯云 SSL 证书自动 DNS 验证](https://cloud.tencent.com/document/product/400/54502)
- [腾讯云 SSL 证书手动 DNS 验证](https://cloud.tencent.com/document/product/400/54500)
- [GNU Coreutils：install 命令](https://www.gnu.org/software/coreutils/manual/html_node/install-invocation.html)
