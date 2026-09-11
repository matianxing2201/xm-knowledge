---
date: 2026-09-11
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

前面的 RAG 基本都是围绕 Milvus 做向量检索。

继续往 Graph RAG 走，光有向量数据库还不够，至少还需要两块基础设施：

- **Elasticsearch**：负责关键词、全文检索，以及后面 Graph RAG 里的混合检索
- **Neo4j**：负责实体、关系和知识图谱

所以这次先不急着写 Graph RAG 本身，先把 Elasticsearch + IK 和 Neo4j 的运行环境搭起来。

这篇主要记录 Elasticsearch 这一部分，Neo4j 单独放到下一篇。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/graph_rag)

---

## 一、环境搭建

### 先把环境跑起来

这次把 Elasticsearch、Kibana、Neo4j 放到了同一个 Docker Compose 环境里。

目录目前是：

```text
~/Documents/software/elastic-neo4j/
├── docker-compose.yml
└── elasticsearch/
    └── Dockerfile
```

其中 Elasticsearch 没直接使用官方镜像，而是在官方镜像的基础上额外装了 IK。

版本统一使用：

```text
Elasticsearch 8.19.21
IK              8.19.21
Kibana          8.19.21
```

这里版本最好保持一致，尤其是 IK。

---

### 为什么要自己 build Elasticsearch

官方 Elasticsearch 镜像本身没有 IK。

如果主要做英文检索问题不大，但中文场景下，默认 analyzer 对中文的处理比较粗糙。

比如：

```text
华为Mate80手机
```

如果不使用中文分词器，中文可能会被拆得比较碎，这对于后面的商品检索、知识库检索都不太友好。

所以这里直接在官方镜像上安装 IK：

```dockerfile
FROM docker.elastic.co/elasticsearch/elasticsearch:8.19.21

ARG IK_VERSION=8.19.21

RUN bin/elasticsearch-plugin install --batch \
    "https://get.infini.cloud/elasticsearch/analysis-ik/${IK_VERSION}" \
    && bin/elasticsearch-plugin list
```

IK 目前由 INFINI Labs 维护，插件版本跟 Elasticsearch 版本对应。

所以以后升级 ES 的时候，这两个地方需要一起改：

```dockerfile
FROM docker.elastic.co/elasticsearch/elasticsearch:8.19.21

ARG IK_VERSION=8.19.21
```

不要只升级其中一个。

版本不匹配时，插件可能无法正常加载，最终表现就是 Elasticsearch 起不来。

---

### Docker Compose

这次 Elasticsearch 配置得比较简单，毕竟目前只是开发环境。

核心配置：

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

几个配置基本都是开发环境的常规选择。

#### `discovery.type=single-node`

现在就跑一个 ES 节点，不需要集群。

否则 ES 会涉及节点发现、选主之类的配置，对于本地开发没有必要。

---

#### `xpack.security.enabled=false`

本地环境直接关闭认证。

这样代码里可以直接：

```python
Elasticsearch("http://127.0.0.1:9200")
```

不用额外处理账号密码。

生产环境肯定不能这么干，这里只是为了降低本地开发成本。

---

#### `ES_JAVA_OPTS`

```text
-Xms512m -Xmx512m
```

给 ES 分 512MB 堆。

主要是因为本地还要跑 Milvus、Neo4j、各种开发服务，不想让 Elasticsearch 一上来就把内存吃掉。

---

#### 数据卷

```yaml
volumes:
  - esdata:/usr/share/elasticsearch/data
```

容器删掉重新创建以后，索引数据还在。

---

### 启动 Elasticsearch + Kibana

这次没有直接启动 Neo4j，只先把 ES 和 Kibana 跑起来。

```bash
cd ~/Documents/software/elastic-neo4j

docker compose up -d elasticsearch kibana
```

如果 Dockerfile 有修改，需要：

```bash
docker compose up -d --build elasticsearch kibana
```

这次镜像已经提前 build 过，所以没有加 `--build`。

启动完成后：

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

看到：

```text
NAMES     IMAGE                                     STATUS
kib01     docker.elastic.co/kibana/kibana:8.19.21   Up (healthy)
es01      es-ik:8.19.21                             Up (healthy)
```

就基本 OK 了。

本地几个端口：

```text
9200   Elasticsearch
5601   Kibana
7474   Neo4j HTTP
7687   Neo4j Bolt
```

这篇暂时只用 9200 和 5601。

![Docker Desktop 的 Containers 页](/images/rag/graph-rag-env-docker.png)

Kibana：

![Kibana 首页](/images/rag/graph-rag-env-kibana.png)

---

## 二、客户端与配置

### Python 客户端

项目里增加 Elasticsearch Python 客户端：

```text
elasticsearch>=8.19,<9
```

然后重新安装：

```bash
source .venv/bin/activate

pip install -r requirements.txt
```

检查一下：

```bash
pip show elasticsearch
```

目前安装的是：

```text
Name: elasticsearch
Version: 8.19.3
```

这里客户端是 8.19.3，服务端是 8.19.21。

虽然 patch 版本不完全一致，但都在 8.x，当前使用没有问题。

这里加：

```text
<9
```

主要是不希望以后 `pip install -r requirements.txt` 的时候，客户端自动跨到 9.x。

---

### 配置

`config.py` 目前先增加：

```python
ES_HOST = "127.0.0.1"
ES_PORT = "9200"
```

然后给 `RAG_SCHEMES` 增加 Graph RAG 配置：

```python
"graph_rag": {
    "ES_INDEX": "goods_v1",
    "ES_TOP_K": 5,
},
```

这里有个比较实际的问题：

**哪些东西应该放环境变量，哪些东西直接写配置？**

目前 ES 是本地开发环境，而且关闭了认证：

```text
http://127.0.0.1:9200
```

没有账号密码，也没有真正的敏感信息，所以直接写配置问题不大。

Neo4j 后面会涉及密码，这种就应该走：

```python
os.getenv(...)
```

简单来说：

> 配置项不等于敏感信息，只有真正需要保护的东西才需要进环境变量。

---

### 为什么索引叫 `goods_v1`

这里没有直接叫：

```text
goods
```

而是：

```text
goods_v1
```

主要考虑后面的 mapping 变更。

ES 的 mapping 一旦建立，已经存在字段的类型不能随便改。

比如：

```json
{
  "price": {
    "type": "float"
  }
}
```

以后如果发现应该改成：

```text
keyword
```

不能直接修改原字段类型。

通常的处理方式是：

```text
goods_v1
   ↓
创建 goods_v2
   ↓
调整 mapping
   ↓
reindex
   ↓
验证
   ↓
切换索引
```

所以一开始带版本号，后面做 mapping 演进会舒服很多。

目前只是 Demo，提前这样命名也算给后面留个口子。

---

## 三、代码骨架与路由

### 代码结构先搭出来

Graph RAG 下面暂时拆成 Elasticsearch 和 Neo4j 两部分：

```text
app/blueprints/rag/graph_rag/
├── __init__.py
│
├── elasticsearch/
│   ├── __init__.py
│   ├── controllers.py
│   ├── services.py
│   └── es_store.py
│
└── neo4j/
    ├── __init__.py
    ├── controllers.py
    ├── services.py
    └── neo4j_store.py
```

这一层暂时不追求复杂架构，主要是把职责先分开。

目前约定：

```text
controllers
      ↓
services
      ↓
es_store
```

#### controllers

处理 HTTP：

- 接收参数
- 参数校验
- 调 service
- 返回 JSON

不关心 ES 怎么连接。

---

#### services

处理业务流程。

比如：

```text
创建索引
    ↓
准备 mapping
    ↓
调用 store
    ↓
返回结果
```

这里不处理 HTTP 细节。

---

#### es_store

只负责 Elasticsearch。

例如：

```text
create_index()
delete_index()
bulk_insert()
search()
analyze()
```

这样以后如果 ES 客户端初始化方式变了，主要改这一层就可以。

---

### 路由先规划好

目前 Elasticsearch 这一块准备做这些 Demo：

```text
GET
/rag/graph/es/status
```

查看 Elasticsearch 连通性和版本信息。

---

```text
POST
/rag/graph/es/analyze
```

测试 IK 分词。

---

```text
POST
/rag/graph/es/indexes
```

创建索引。

---

```text
DELETE
/rag/graph/es/indexes/<index_name>
```

删除索引。

---

```text
POST
/rag/graph/es/indexes/<index_name>/docs
```

写入数据。

后面会同时覆盖单条写入和 bulk。

---

```text
POST
/rag/graph/es/indexes/<index_name>/search
```

查询。

后面会逐步把：

```text
match
term
bool
filter
highlight
```

以及后面的混合检索都放进来。

具体实现下一篇再继续。

---

### Graph RAG 蓝图暂时没有注册

这里我刻意没有马上把 Elasticsearch 和 Neo4j 注册到上层 Blueprint。

现在：

```python
# register_blueprint(...)
# register_blueprint(...)
```

先保持注释。

原因很简单：

现在代码只是骨架。

如果现在就 import：

```text
graph_rag
    ↓
elasticsearch
    ↓
controllers
```

虽然不会有什么实际功能，但整个模块已经会进入应用启动流程。

目前案例还没写完，没有必要这么早接进去。

等 Elasticsearch Demo 和 Neo4j Demo 都完成以后，再统一注册。

---

## 四、环境验收

### 先做一轮环境验收

环境搭完以后，最好不要直接开始写业务。

先把几个最基础的东西验证一下。

#### 1. Elasticsearch 版本

```bash
curl -s http://127.0.0.1:9200 | python3 -m json.tool
```

返回：

```json
{
  "name": "e0f2e15cfcc9",
  "cluster_name": "docker-cluster",
  "version": {
    "number": "8.19.21",
    "build_flavor": "default",
    "lucene_version": "9.12.2"
  },
  "tagline": "You Know, for Search"
}
```

先确认 ES 本身能正常访问。

---

#### 2. 确认 IK 到底有没有装

这个比看 Docker 容器状态更直接：

```bash
curl -s "http://127.0.0.1:9200/_cat/plugins?v"
```

结果：

```text
name         component   version
e0f2e15cfcc9 analysis-ik 8.19.21
```

看到：

```text
analysis-ik
```

基本就可以确定插件已经加载。

---

### Python 客户端测试

简单写个 `verify.py`：

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

执行：

```bash
python verify.py
```

结果：

```text
ping -> True
version -> 8.19.21
```

说明 Python 客户端也没问题。

#### 这里碰到一个小坑

ES 没启动的时候：

```python
es.ping()
```

返回的是：

```text
False
```

而不是直接把连接异常抛出来。

但：

```python
es.info()
```

会直接抛连接异常。

所以如果只是做健康检查：

```python
es.ping()
```

很好用。

如果需要知道**为什么连不上**，还是得捕获具体异常，或者调用 `info()`。

这个区别第一次写的时候挺容易踩。

---

#### 另外一个启动时序问题

Docker 显示：

```text
Up (healthy)
```

也不一定意味着马上就能稳定访问 HTTP。

我第一次启动的时候，容器已经显示 healthy，但第一发：

```bash
curl http://127.0.0.1:9200
```

还是遇到了：

```text
Connection reset by peer
```

重试几次后正常。

所以如果刚启动 ES，建议等几秒再测。

这种一般不是配置问题，而是 Elasticsearch 自己还在初始化。

---

### IK 分词测试

环境确认没问题以后，直接测试一下 IK。

```bash
curl -s -X POST "http://127.0.0.1:9200/_analyze" \
  -H 'Content-Type: application/json' \
  -d '{
    "analyzer": "ik_max_word",
    "text": "华为Mate80手机"
  }'
```

几个 analyzer 的结果大概是：

| Analyzer      | 结果                                       |
| ------------- | ------------------------------------------ |
| `ik_max_word` | 华为 / mate80 / mate / 80 / 手机 / 手 / 机 |
| `ik_smart`    | 华为 / mate80 / 手机                       |
| `standard`    | 华 / 为 / mate80 / 手 / 机                 |

这几个的区别比较直观。

#### `ik_max_word`

分得比较细。

例如：

```text
手机
↓
手机
手
机
```

会产生更多 token。

所以通常更适合**索引阶段**，尽可能提高召回。

---

#### `ik_smart`

相对更粗一些：

```text
华为 / mate80 / 手机
```

通常更适合查询阶段。

---

#### `standard`

中文基本会被拆得比较碎。

这也是为什么中文搜索场景通常不会直接使用默认的 standard analyzer。

---

### `_analyze` 还有一个小坑

测试 `_analyze` 的时候，直接：

```text
GET /_analyze
```

然后把参数拼在 URL 里，很容易得到：

```text
request body or source parameter is required
```

直接用：

```text
POST
```

然后把 analyzer 和 text 放到 JSON body 里最省事。

也就是：

```bash
POST /_analyze
Content-Type: application/json
```

```json
{
  "analyzer": "ik_max_word",
  "text": "华为Mate80手机"
}
```

---

## 五、当前进度与小结

### 目前的进展

到这里，Graph RAG 的第一块基础设施算是搭完了。

当前状态：

```text
                    Graph RAG
                       │
              ┌────────┴────────┐
              │                 │
       Elasticsearch          Neo4j
              │                 │
          IK 中文分词          待实现
              │
        当前进行中
```

再往后才是真正的 Graph RAG：

```text
文档
 ↓
切分
 ↓
实体 / 关系抽取
 ↓
Neo4j 建图
 ↓
Elasticsearch 关键词检索
 +
向量检索
 +
图检索
 ↓
结果融合
 ↓
LLM
```

---

### 小结

目前确定了几件事情：

**1. Elasticsearch 和 Milvus 各自负责不同类型的检索**

Milvus 更偏语义相似度。

Elasticsearch 更适合：

```text
关键词
全文
Filter
Highlight
中文分词
```

后面的 Graph RAG 不会简单变成“Neo4j 替代 Milvus”，而更可能是几种检索方式组合起来。

**2. IK 要跟 ES 版本一起升级**

现在是：

```text
ES 8.19.21
IK 8.19.21
Kibana 8.19.21
```

升级的时候一起改。

**3. Index 从一开始就带版本号**

```text
goods_v1
```

后面 mapping 发生变化时，可以：

```text
goods_v1 → goods_v2 → reindex → 切换
```

不用直接动线上索引结构。

**4. 本地开发先把认证关掉**

当前是：

```text
xpack.security.enabled=false
```

方便开发。

生产环境再处理认证、TLS、权限这些问题。

**5. 代码先把边界划出来**

```text
Controller
    ↓
Service
    ↓
Store
    ↓
Elasticsearch
```

下一步就是开始真正实现 Elasticsearch 的几个 Demo，把从建 Index、Mapping、写入、Bulk 到 Query 的完整流程走一遍。

然后再进入 Neo4j。

最后才是把 **ES + Milvus + Neo4j** 真正组合成 Graph RAG。
