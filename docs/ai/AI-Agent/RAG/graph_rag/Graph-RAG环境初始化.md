---
date: 2026-09-10
title: Graph RAG 环境初始化
tags:
  - AI
  - AI Agent
  - RAG
  - Graph RAG
  - Elasticsearch
  - IK
---

# Graph RAG 环境初始化

前面的 RAG 全是 Milvus 一条路走到底——向量检索。要往 Graph RAG 走，得再补两块地基：中文关键词检索（Elasticsearch + IK）和图数据库（Neo4j）。

这篇只做环境，不写业务代码。Neo4j 也先放着，另开一篇再说，所以下面看到 `neo4j/` 子包和 `NEO4J_*` 配置，知道「已经建好但没动」就行。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/graph_rag)

## 这次初始化了四样东西

| 层 | 弄了什么 | 放哪 |
| --- | --- | --- |
| 服务 | ES 8.19.21 + IK、Kibana | `~/Documents/software/elastic-neo4j/` |
| 依赖 | elasticsearch-py 8.x | `requirements.txt` → `.venv` |
| 配置 | `ES_HOST` / `ES_PORT`、`RAG_SCHEMES["graph_rag"]` | `config.py` |
| 骨架 | controllers / services / es_store | `app/blueprints/rag/graph_rag/elasticsearch/` |

服务那层特意放在 `~/Documents/software/` 下，跟之前的 `milvus` 同级，不挂在任何项目里。想法很简单：**服务怎么装不归项目管，项目只管怎么连**。Docker 起来一套，`agent_practice`、`big-model`、以后的项目连的都是它。

## 一、Elasticsearch + IK 服务

### 为什么不直接 `docker run` 官方镜像

官方 ES 镜像里没有中文分词器。不装 IK，中文检索基本等于没有，所以只能自己 build 一个把插件塞进去：

```dockerfile
FROM docker.elastic.co/elasticsearch/elasticsearch:8.19.21

ARG IK_VERSION=8.19.21

RUN bin/elasticsearch-plugin install --batch "https://get.infini.cloud/elasticsearch/analysis-ik/${IK_VERSION}" \
    && bin/elasticsearch-plugin list
```

IK 现在归 INFINI Labs 维护，按 ES 的精确版本发（`analysis-ik/8.19.21`）。版本对不上插件直接加载失败、ES 起不来，所以 `FROM` 和 `ARG IK_VERSION` 这两处以后升级得一起改。

目录就两个文件：

```text
~/Documents/software/elastic-neo4j/
├── docker-compose.yml                   # ES / Kibana / Neo4j
└── elasticsearch/
    └── Dockerfile                       # ES 8.19.21 + IK 8.19.21
```

### compose 里的关键几行

```yaml
services:
  elasticsearch:
    build:
      context: .
      dockerfile: elasticsearch/Dockerfile
    image: es-ik:8.19.21
    container_name: es01
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data
```

- `discovery.type=single-node`：就一个节点，跳过集群选举，起步快
- `xpack.security.enabled=false`：关掉认证直连，跟课程 demo 一样，代码里就不用带账号密码了
- `ES_JAVA_OPTS=-Xms512m -Xmx512m`：堆锁死 512M，和 Milvus 一起跑不会把内存吃光
- `volumes` 挂命名卷，容器重建数据不丢

端口三个：9200 给 ES，5601 给 Kibana，7474 / 7687 是 Neo4j（这篇不用）。

### 起服务

```bash
$ cd ~/Documents/software/elastic-neo4j
$ docker compose up -d elasticsearch kibana
 Container es01 Starting
 Container es01 Started
 Container es01 Waiting
 Container es01 Healthy
 Container kib01 Starting
 Container kib01 Started
```

这次只起了 `elasticsearch` 和 `kibana` 两个服务，compose 里的 `neo4j` 没起。镜像之前已经 build 过，所以没带 `--build`；第一次或者改了 Dockerfile 才要 `docker compose up -d --build`。

起来以后：

```bash
$ docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
NAMES     IMAGE                                     STATUS
kib01     docker.elastic.co/kibana/kibana:8.19.21   Up (healthy)
es01      es-ik:8.19.21                             Up (healthy)
```

Docker Desktop 里看着是这样：

![Docker Desktop 的 Containers 页](/images/rag/graph-rag-env-docker.png)

Kibana 也一起起来了（5601）：

![Kibana 首页](/images/rag/graph-rag-env-kibana.png)

## 二、Python 依赖

`requirements.txt` 加一行：

```text
elasticsearch>=8.19,<9
```

（同一个提交里还有 `neo4j>=5.26,<6`，这篇不管。）

```bash
$ source .venv/bin/activate
$ pip install -r requirements.txt
$ pip show elasticsearch
Name: elasticsearch
Version: 8.19.3
```

服务端 8.19.21，客户端 8.19.3，都是 8.x。约束卡 `<9` 是防止 pip 哪天装到 9.x 去——客户端跟服务端主版本对齐才省心。

## 三、config.py

`Config` 里加两个常量：

```python
ES_HOST = "127.0.0.1"
ES_PORT = "9200"
```

`RAG_SCHEMES` 里加一个方案：

```python
"graph_rag": {
    "ES_INDEX": "goods_v1",   # ES 案例默认索引(含 IK 中文分词 mapping)
    "ES_TOP_K": 5,            # ES 案例检索默认返回条数
},
```

两处是特意这么写的：

ES 关了认证，连接信息不是秘密，写成常量最省事；Neo4j 那边有密码，才走 `os.getenv` 兜底。**是不是敏感信息，决定配置怎么写。**

索引名带 `_v1`，是因为 mapping 建好之后**已建字段的类型就改不了了**（加新字段可以，改类型不行）。结构要变只能新建 `goods_v2` 再 reindex 迁过去。带版本号，新旧索引能共存，迁移还能回滚。

## 四、代码骨架

```text
app/blueprints/rag/graph_rag/
├── __init__.py                      # 主题说明 + bp 注册(暂时注释)
├── elasticsearch/                   # 案例① <- 这篇的范围
│   ├── __init__.py                  # 学习目标 + 规划路由
│   ├── controllers.py               # HTTP 路由,前缀 /rag/graph/es
│   ├── services.py                  # 业务编排
│   └── es_store.py                  # ES 客户端封装
└── neo4j/                           # 案例② <- 另开一篇
    ├── __init__.py
    ├── controllers.py
    ├── services.py
    └── neo4j_store.py
```

三层各管一段，依赖是单向的 `controllers → services → es_store`：

- `controllers.py` 只管 HTTP，收请求、校验参数、返 JSON，不知道 ES 怎么连
- `services.py` 管编排，把「建索引 / 写数据 / 检索」串成步骤，不碰 HTTP
- `es_store.py` 只管跟 Elasticsearch 打交道，不知道有 Flask

现在这 9 个文件全是 docstring，没有一行能跑的代码。每个文件里写了它负责什么、待实现哪些方法，先把结构和边界定下来，实现留着后面填。

规划中的路由（也抄在 `elasticsearch/__init__.py` 里了）：

- `GET /rag/graph/es/status` — 连通性 + 集群信息（demo_1）
- `POST /rag/graph/es/analyze` — IK 分词对比
- `POST /rag/graph/es/indexes` — 建索引（demo_2）
- `DELETE /rag/graph/es/indexes/<index_name>` — 删索引（demo_5）
- `POST /rag/graph/es/indexes/<index_name>/docs` — 单条 / bulk 写入（demo_3、demo_4）
- `POST /rag/graph/es/indexes/<index_name>/search` — 查询（demo_6、demo_7、demo_9、demo_10）

还有一处故意留空：`graph_rag/__init__.py` 末尾往 rag 蓝图注册的两行，现在是注释状态。案例没写完就 import，只会挂两个空 controllers 上去，什么路由都没有。等案例写完再放开。

## 五、验收，自己跑了一遍

### 1. 版本和 IK 插件

```bash
$ curl -s http://127.0.0.1:9200 | python3 -m json.tool
{
    "name": "e0f2e15cfcc9",
    "cluster_name": "docker-cluster",
    "version": {
        "number": "8.19.21",
        "build_flavor": "default",
        "lucene_version": "9.12.2",
        ...
    },
    "tagline": "You Know, for Search"
}
```

```bash
$ curl -s "http://127.0.0.1:9200/_cat/plugins?v"
name         component   version
e0f2e15cfcc9 analysis-ik 8.19.21
```

第二条是关键：IK 装没装上，一眼就能看出来。没它，后面 `match: {"title": "手机"}` 一个字都搜不出来。

### 2. Python 驱动连一下

```python
from elasticsearch import Elasticsearch

es = Elasticsearch(
    hosts=["http://127.0.0.1:9200"],
    verify_certs=False,
    request_timeout=60,
)

print("ping ->", es.ping())
print("version ->", es.info()["version"]["number"])
```

```bash
$ python verify.py
ping -> True
version -> 8.19.21
```

这里踩了个坑，记一下：ES 没起来的时候，`es.ping()` 是**返回 `False`，不抛异常**——8.x 客户端内部把 `TransportError` 吞了；但同一个地址 `es.info()` 会直接抛 `elastic_transport.ConnectionError`。我第一遍先 ping 了一下看到 False，差点回去改 hosts。所以 `ping()` 适合做健康检查的布尔判断，想拿到失败原因必须换 `info()`。

还有一个小的：容器报 `healthy` 之后，HTTP 端口还要等几秒才真能接上。第一发 `curl` 直接 `Connection reset by peer`（exit 56），重试第三次才通。不是配置错了，就是还没起完。

### 3. IK 分词对比，这个最有意思

```bash
$ curl -s -X POST "http://127.0.0.1:9200/_analyze" \
    -H 'Content-Type: application/json' \
    -d '{"analyzer":"ik_max_word","text":"华为Mate80手机"}'
```

同一个句子，三个分词器切出来完全不一样：

| 分词器 | 切出来的词 |
| --- | --- |
| `ik_max_word` | 华为 / mate80 / mate / 80 / 手机 / 手 / 机 |
| `ik_smart` | 华为 / mate80 / 手机 |
| `standard` | 华 / 为 / mate80 / 手 / 机 |

- `ik_max_word` 切得最细，还会重叠（「手机」既是「手机」也是「手」+「机」），适合**写索引**的时候用，召回率高
- `ik_smart` 只切一遍不重叠，适合**查询**的时候用
- `standard` 把中文全切成单字——这就是不装 IK 时中文检索废掉的原因：搜「手机」变成搜「手」和「机」

顺带记一条：`_analyze` 用 `GET` 带 query 参数会报 `request body or source parameter is required`（400），老老实实 `POST` + `-d` 最省事。

## 还剩什么

- ES 案例还没写：demo_1 ~ demo_11 要填进 `es_store` / `services` / `controllers`
- 写完记得把 `graph_rag/__init__.py` 里注册蓝图的两行放开
- Neo4j：子包和 `NEO4J_*` 配置都就位了，还没动，另开一篇
- 再往后才是 Graph RAG 主体：实体抽取 → 建图 → 图检索和向量检索配合

## 小结

- 服务独立装：`~/Documents/software/elastic-neo4j/`，与 `milvus` 同级，多个项目共用一套 Docker
- 版本要三同步：ES 8.19.21 = IK 8.19.21 = Kibana 8.19.21，升级必须一起改；客户端锁 `>=8.19,<9`
- 关认证直连（`xpack.security.enabled=false`），省掉代码里的账号密码
- `ping()` 连不上返回 `False` 不抛异常，要原因用 `info()`
- 结构先定、实现后填：9 个文件先按三层分好，只有 docstring
