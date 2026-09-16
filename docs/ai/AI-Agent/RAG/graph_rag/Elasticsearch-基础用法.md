---
date: 2026-09-10
title: Elasticsearch 基础用法
tags:
  - AI
  - AI Agent
  - RAG
  - Graph RAG
  - Elasticsearch
  - IK
---

# Elasticsearch 基础用法

环境那篇把 Elasticsearch + IK 跑起来了。

这篇开始真正用 ES。

代码都在：

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/graph_rag/elasticsearch)

<br />

## 一、初始化连接

最简单的事情就是创建客户端。

项目里的 `verify.py` 目前就干这个：

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

跑一下：

```bash
python app/blueprints/rag/graph_rag/elasticsearch/verify.py
```

```text
ping -> True
version -> 8.19.21
```

能拿到版本号，说明客户端和 ES 都正常。

---

### hosts

就是 Elasticsearch 地址。

现在本地只有一个节点：

```python
hosts=["http://127.0.0.1:9200"]
```

它是列表，不是因为现在有多个 ES，而是 Elasticsearch Python Client 本身支持配置多个节点。

以后如果跑集群，可以：

```python
hosts=[
    "http://es01:9200",
    "http://es02:9200",
    "http://es03:9200",
]
```

客户端负责节点选择和故障转移。

---

### verify_certs

这个参数主要跟 HTTPS 有关。

我们现在连接的是：

```text
http://127.0.0.1:9200
```

没有 TLS，自然也不存在证书校验的问题。

所以本地写：

```python
verify_certs=False
```

其实没有什么实际作用。

我之前试过：

```python
Elasticsearch(
    hosts=["http://127.0.0.1:9200"],
    verify_certs=False,
)
```

和：

```python
Elasticsearch(
    hosts=["http://127.0.0.1:9200"],
)
```

都可以正常连接。

这里保留它，主要是和当前环境配置保持一致。

如果以后换成 HTTPS，就要认真处理证书验证。生产环境也不应该为了省事直接关闭证书校验。

---

### request_timeout

请求超时时间。

这里设置：

```python
request_timeout=60
```

默认时间相对比较短，如果后面开始测试：

- 大数据量搜索
- 聚合
- 复杂 bool 查询
- 深分页
- 多条件过滤

有些请求可能会比较慢。

所以开发环境先放宽到 60 秒。

不过这个参数也不是越大越好。

真正上线以后，如果一个查询经常跑到几十秒，第一反应应该是优化查询，而不是无限增加 timeout。

---

### `ping()` 和 `info()` 有什么区别

这两个我一开始也以为差不多。

实际跑下来发现还是有区别。

```python
es.ping()
```

ES 连不上时通常直接：

```text
False
```

而：

```python
es.info()
```

会抛连接异常。

所以：

```text
ping()
    ↓
我只想知道“通不通”
    ↓
True / False
```

而：

```text
info()
    ↓
我还想拿版本、集群等信息
    ↓
连接失败时直接抛异常
```

所以健康检查可以这么写：

```python
if es.ping():
    print("Elasticsearch OK")
else:
    print("Elasticsearch unavailable")
```

如果想排查具体原因，就不要只看 `ping()`。

之前遇到 ES 没完全启动的时候，`ping()` 返回 `False`，第一反应差点以为 hosts 写错了。

实际上先：

```bash
docker ps
```

看一下容器状态，再决定是不是配置问题。

---

### 项目里不会每次都自己连

`verify.py` 只是验证环境。

真正的代码放到了：

```text
es_store.py
```

现在的结构大概是：

```python
class EsStore:

    def __init__(self, index_name: str | None = None):
        self.index_name = (
            index_name
            or current_app.config["RAG_SCHEMES"]["graph_rag"]["ES_INDEX"]
        )

        self.client = Elasticsearch(
            hosts=[
                f"http://{current_app.config['ES_HOST']}:"
                f"{current_app.config['ES_PORT']}"
            ],
            verify_certs=False,
            request_timeout=60,
        )
```

跟 `verify.py` 相比就两点变化：

1. ES 地址从 `config.py` 读取
2. 给 Store 一个默认 index

这样业务代码就不用到处写：

```python
Elasticsearch(...)
```

也不用把：

```text
127.0.0.1
9200
goods_v1
```

散落在各个文件里。

---

## 二、创建索引

### 创建 Index

接下来开始真正操作 ES。

接口：

```text
POST /rag/graph/es/indexes
```

在 Elasticsearch 里面：

```text
Index       ≈ 数据集合 / 表
Document    ≈ 一条数据
Mapping     ≈ 字段结构
```

说成 MySQL 的“表”和“行”方便理解，但两者实际并不是完全一样。

---

#### 先创建一个商品索引

什么参数都不传：

```bash
curl -X POST \
  http://127.0.0.1:5001/rag/graph/es/indexes \
  -H 'Content-Type: application/json' \
  -d '{}'
```

因为代码里配置了默认索引，所以最终创建：

```text
goods_v1
```

并且使用我们提前定义好的 IK mapping。

返回：

```json
{
  "created": true,
  "index": "goods_v1",
  "mapping": {
    "properties": {
      "category": {
        "type": "keyword"
      },
      "desc": {
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart",
        "type": "text"
      },
      "goods_id": {
        "type": "keyword"
      },
      "price": {
        "type": "double"
      },
      "title": {
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart",
        "type": "text"
      }
    }
  }
}
```

HTTP 状态码是：

```text
201 Created
```

说明这次确实创建了一个新 Index。

再调一次。

返回：

```json
{
  "created": false,
  "index": "goods_v1",
  "mapping": {
    "...": "..."
  }
}
```

这次 HTTP 是：

```text
200 OK
```

这里的 `created` 就挺有用：

```text
true
    ↓
这次真的创建了

false
    ↓
本来就存在
```

我们的接口不会因为 Index 已经存在就直接报错。

---

### Mapping 到底是什么

目前商品 Index 定了 5 个字段：

```python
GOODS_MAPPING = {
    "mappings": {
        "properties": {
            "title": {
                "type": "text",
                "analyzer": "ik_max_word",
                "search_analyzer": "ik_smart",
            },
            "desc": {
                "type": "text",
                "analyzer": "ik_max_word",
                "search_analyzer": "ik_smart",
            },
            "category": {
                "type": "keyword",
            },
            "goods_id": {
                "type": "keyword",
            },
            "price": {
                "type": "double",
            },
        }
    }
}
```

这里最需要先搞清楚的就是：

```text
text
keyword
```

---

#### `text` 和 `keyword`

可以简单理解成：

| 类型      | 分词 | 主要用途                   |
| --------- | ---- | -------------------------- |
| `text`    | 是   | 全文搜索                   |
| `keyword` | 否   | 精确匹配、过滤、聚合、排序 |

比如：

```text
title = "华为 Mate 80 Pro 手机"
```

这是典型的 `text`。

因为用户可能搜索：

```text
华为
手机
Mate 80
Mate80
```

我们希望 ES 能根据分词结果找到它。

而：

```text
category = "mobile_phone"
```

更适合：

```text
category == mobile_phone
```

这种精确判断。

所以用：

```json
{
  "type": "keyword"
}
```

一句话记：

> **需要“搜里面的内容”，通常用** **`text`；需要“这个字段就是这个值”，通常用** **`keyword`。**

---

### `analyzer` 和 `search_analyzer`

`title` 和 `desc` 目前配置：

```json
{
  "type": "text",
  "analyzer": "ik_max_word",
  "search_analyzer": "ik_smart"
}
```

两个 analyzer 分别对应：

```text
analyzer
    ↓
索引文档的时候怎么分词

search_analyzer
    ↓
用户搜索的时候怎么分词
```

例如：

```text
华为Mate80手机
```

`ik_max_word` 会切得更细：

```text
华为
mate80
mate
80
手机
手
机
```

`ik_smart` 会相对粗一些：

```text
华为
mate80
手机
```

这样做的思路是：

```text
建立索引
    ↓
尽可能保留更多 token
    ↓
提高召回

用户查询
    ↓
不要切得太碎
    ↓
减少无意义匹配
```

这是一种比较常见的中文搜索配置，并不是说所有业务都必须这么配。

到底 `max_word` 还是 `smart`，最后还是应该拿自己的数据和查询场景测。

---

### 如果不写 Mapping（Dynamic Mapping）

这个我觉得实际试一下比看文档更容易理解。

直接让 Elasticsearch 自己创建：

```bash
curl -X PUT \
  http://127.0.0.1:9200/dyn_v1
```

然后什么 mapping 都不配，直接写第一条数据：

```bash
curl -X POST \
  http://127.0.0.1:9200/dyn_v1/_doc/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Huawei Mate 80 Pro Max手机",
    "category": "mobile_phone",
    "price": 7999
  }'
```

ES 会根据数据做 Dynamic Mapping。

大概会得到：

```json
{
  "title": {
    "type": "text",
    "fields": {
      "keyword": {
        "type": "keyword",
        "ignore_above": 256
      }
    }
  },
  "category": {
    "type": "text",
    "fields": {
      "keyword": {
        "type": "keyword",
        "ignore_above": 256
      }
    }
  },
  "price": {
    "type": "long"
  }
}
```

乍看挺方便。

但问题就在这里：

> **ES 是在“猜”你的数据结构。**

它不知道：

```text
category
```

以后到底是拿来全文搜索，还是拿来精确过滤。

也不知道：

```text
price
```

以后是不是允许小数。

所以它只能根据第一批数据猜。

---

#### `category` 的问题

自动 mapping 后：

```text
category
    ├── text
    └── category.keyword
```

如果要做精确匹配，应该使用：

```text
category.keyword
```

而不是把 `category` 本身当成 keyword 字段使用。

比如：

```json
{
  "term": {
    "category.keyword": "mobile_phone"
  }
}
```

这跟我们自己定义：

```json
{
  "category": {
    "type": "keyword"
  }
}
```

还是有区别的。

如果业务明确知道这个字段就是分类 ID，没必要让 ES 帮你猜，直接定义成 `keyword` 更干净。

---

#### `price` 也有这个问题

这次第一条数据是：

```json
{
  "price": 7999
}
```

所以 ES 推断成：

```text
long
```

但如果第一条数据是：

```json
{
  "price": 7999.5
}
```

它会根据这个值推断成浮点类型。

所以 Dynamic Mapping 并不是“ES 永远会把价格变成 long”。

真正的问题是：

> **字段类型取决于最开始写进去的数据，而不是你的业务意图。**

对于商品、订单、知识库这些结构比较明确的数据，我更倾向于自己写 mapping。

---

### IK 和 Dynamic Mapping 的差别

这个就更直观了。

动态创建：

```text
dyn_v1
```

然后：

```bash
curl -s \
  http://127.0.0.1:9200/dyn_v1/_analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "field": "title",
    "text": "华为Mate80手机"
  }'
```

结果：

```text
华
为
mate80
手
机
```

再看我们自己定义 IK 的：

```text
goods_v1
```

```bash
curl -s \
  http://127.0.0.1:9200/goods_v1/_analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "field": "title",
    "text": "华为Mate80手机"
  }'
```

结果：

```text
华为
mate80
mate
80
手机
手
机
```

区别一下就出来了。

不是说 Dynamic Mapping 完全不能用，而是：

```text
业务结构明确
    ↓
最好自己定义 mapping

临时数据 / 快速验证
    ↓
Dynamic Mapping 很方便
```

---

### 为什么代码里要 `ensure_index()`

还有一个实际问题。

假设我们直接写：

```text
POST /goods_v1/_doc/1
```

而 `goods_v1` 根本不存在。

Elasticsearch 默认可能直接帮你创建 Index。

问题是：

```text
goods_v1 不存在
        ↓
ES 自动创建
        ↓
Dynamic Mapping
        ↓
没有我们的 IK 配置
```

那就麻烦了。

所以代码里写数据之前会先：

```python
def insert_docs(docs, index_name=None):
    store = _store(index_name)

    store.ensure_index()

    ...
```

也就是：

```text
写数据
  ↓
Index 存不存在？
  ↓
不存在 → 按我们的 mapping 创建
  ↓
存在 → 直接写
```

至少不会因为一个拼写错误或者初始化遗漏，让 ES 偷偷帮我们创建一个完全不同的 Index。

---

### 自己指定 Index 和 Mapping

默认：

```text
goods_v1
```

只是为了 Demo 方便。

实际调用的时候可以自己指定：

```bash
curl -X POST \
  http://127.0.0.1:5001/rag/graph/es/indexes \
  -H 'Content-Type: application/json' \
  -d '{
    "index": "goods_v2",
    "mapping": {
      "mappings": {
        "properties": {
          "title": {
            "type": "text",
            "analyzer": "ik_max_word",
            "search_analyzer": "ik_smart"
          },
          "category": {
            "type": "keyword"
          },
          "price": {
            "type": "double"
          }
        }
      }
    }
  }'
```

创建：

```text
goods_v2
```

这里代码的优先级是：

```text
请求里传了 mapping
        ↓
使用请求 mapping

请求没传 mapping
        ↓
使用 GOODS_MAPPING
```

所以只传：

```json
{
  "index": "goods_v2"
}
```

也可以。

它还是会使用默认的商品 mapping。

---

### 为什么 Index 从一开始就带版本号

现在使用：

```text
goods_v1
```

而不是：

```text
goods
```

原因还是 mapping。

比如现在：

```text
goods_v1
```

里面：

```text
price → double
```

后面发现结构需要调整。

不能直接把已有字段类型改掉。

更常见的方式是：

```text
goods_v1
   ↓
创建 goods_v2
   ↓
新的 mapping
   ↓
reindex
   ↓
验证数据
   ↓
应用切换到 goods_v2
   ↓
确认稳定
   ↓
删除 goods_v1
```

这样新旧 Index 可以同时存在。

迁移失败也有回退空间。

如果后面真的做生产环境，还可以进一步引入 alias：

```text
goods
  ↓
goods_v1
```

以后切换：

```text
goods
  ↓
goods_v2
```

业务代码甚至不需要知道底层到底是 `v1` 还是 `v2`。

这个后面做到索引迁移的时候再展开。

---

## 三、删除索引

### 删除 Index

接口：

```text
DELETE /rag/graph/es/indexes/<index_name>
```

例如：

```bash
curl -X DELETE \
  http://127.0.0.1:5001/rag/graph/es/indexes/goods_v2
```

返回：

```text
204 No Content
```

如果 Index 不存在：

```text
404
```

这里要特别注意：

> **删除 Index 不只是删除 mapping，里面的数据也一起没了。**

所以生产环境删 Index 之前一定要确认。

---

## 四、写入文档

接口：

```text
POST /rag/graph/es/indexes/<index_name>/docs
```

这个接口的 body 有两种形态：

```text
传对象
    ↓
写单条

传数组
    ↓
走 bulk 批量
```

---

### 写单条

body 传一个对象，走单条写入接口：

![写单条](/images/rag/elasticsearch-insert-1.png)

返回：

```json
{
  "count": 1,
  "ids": ["1001"],
  "index": "goods_v1",
  "mode": "single"
}
```

返回里三个字段：

```text
count   这次写进去几条
ids     实际用的 _id
mode    走的哪条路(single / bulk)
```

看下 `1001` 落库后的效果：

![写单条返回](/images/rag/elasticsearch-insert-2.png)

---

### `_id` 是如何定义的

```text
doc 里有 goods_id
    ↓
拿它当 _id

doc 里没有 goods_id
    ↓
传 None,让 ES 自己生成
```

实测一下不带 `goods_id`：

```json
{
  "count": 1,
  "ids": ["1HPSp6ABvXex7LI9ErSe"],
  "index": "goods_v1",
  "mode": "single"
}
```

ES 生成的是一串随机字符串。

这里的 `_id` 就相当于 MySQL 里的主键。之所以拿 `goods_id` 当 `_id`，是因为商品 ID 本身唯一，用它当主键之后，后面按 id 查询、修改、删除都能对得上。

---

### 同一个 `_id` 再写一次会怎样

`1001` 原本是完整的：

```json
{
  "goods_id": "1001",
  "title": "Huawei Mate 80 手机",
  "desc": "HUAWEI Mate 80是华为公司于2025年11月25日发布的智能手机系列...",
  "category": "mobile_phone",
  "price": 7999
}
```

```text
_version: 1
```

然后我只带了 `goods_id` 和 `title` 再写一次：

再看 `1001`：

```json
{
  "goods_id": "1001",
  "title": "Huawei Mate 80 手机"
}
```

```text
_version: 2
```

`desc`、`category`、`price` 全没了。

原因在这里：

> **同一个 `_id` 再写，是整体替换，不是局部更新。**

ES 看到 `_id` 已经存在，不会新增一条，而是把原来那条全部换掉。没带的字段就真的没了。

这个很容易踩：想只改个价格，就只传了 `price`，回头发现 `title` 也一起消失了。

要改单个字段，得用后面的：

```text
PUT /rag/graph/es/indexes/<index_name>/docs/<doc_id>
```

那个走的才是局部更新。

---

### bulk 批量写入

body 换成数组就是 bulk：

![bulk 批量写入](/images/rag/elasticsearch-insert-3.png)

返回：

```json
{
  "count": 2,
  "errors": [],
  "failed": 0,
  "index": "goods_v1",
  "mode": "bulk"
}
```

`mode` 变成了 `bulk`，并且多了 `failed` 和 `errors` 两个字段。

代码里 bulk 是这样拼的：

```python
def _actions():
    for doc in docs:
        action = {
            "_index": self.index_name,
            "_source": doc,
        }
        doc_id = doc.get(ID_FIELD)
        if doc_id is not None:
            action["_id"] = str(doc_id)
        yield action

success, errors = bulk(
    self.client,
    _actions(),
    raise_on_error=False,
)
```

为什么不用 for 循环一条条调单条接口：

```text
单条写入 N 次
    ↓
N 次 HTTP 往返

bulk 一次
    ↓
1 次 HTTP 往返
```

1000 条数据就是 1000 次请求和 1 次请求的差别。

```text
批量操作使用 bulk，不要使用单条循环操作
```

---

### bulk 里的部分失败

bulk 有个要特别注意的地方：**它允许一部分成功、一部分失败。**

实测两条，其中一条 `price` 写成字符串：

```json
[
  {
    "goods_id": "1003",
    "title": "正常商品",
    "category": "mobile_phone",
    "price": 1999
  },
  {
    "goods_id": "1004",
    "title": "价格非法的商品",
    "category": "mobile_phone",
    "price": "不是数字"
  }
]
```

返回：

```json
{
  "count": 1,
  "errors": [
    {
      "index": {
        "_id": "1004",
        "_index": "goods_v1",
        "error": {
          "type": "document_parsing_exception",
          "reason": "[1:86] failed to parse field [price] of type [double] in document with id '1004'. Preview of field's value: '不是数字'",
          "caused_by": {
            "type": "number_format_exception",
            "reason": "For input string: \"不是数字\""
          }
        },
        "status": 400
      }
    }
  ],
  "failed": 1,
  "index": "goods_v1",
  "mode": "bulk"
}
```

`1003` 写进去了，`1004` 没有，失败原因在 `errors` 里写得很清楚。

所以调 bulk 的时候一定要看 `failed`：

```text
failed > 0
    ↓
有文档没写进去
```

接口里 `errors` 只回前 3 条：

```python
"errors": errors[:3],
```

批量失败几万条的时候不至于把响应刷爆。

顺便，这个失败也顺带说明了一件事：`price` 的 mapping 是 `double`，传字符串 ES 直接拒了。**类型不对在写入阶段就会被拦下来**，这也是自己写 mapping 的好处之一，不会等到检索的时候才发现数据脏了。

---

### body 不合法的情况

空数组：

```json
{
  "error": "文档不能为空，且每条都必须是对象"
}
```

```text
400
```

body 传字符串：

```json
{
  "error": "body 要传一个文档对象，或文档对象数组"
}
```

```text
400
```

---

## 五、查询：按 `_id` 查单条

接口：

```
GET /rag/graph/es/indexes/<index_name>/docs/<doc_id>
```

参数不放在 body，全部走 URL 路径：

| 参数         | 位置 | 含义                   |
| ------------ | ---- | ---------------------- |
| `index_name` | 路径 | 去哪个索引查           |
| `doc_id`     | 路径 | 查哪条（文档的 `_id`） |

例如：

![查询](/images/rag/elasticsearch-insert-4.png)

`_id` 是文档的 id，`_source` 是文档的真实内容。

## 六、更新：局部更新

接口：

```text
PUT /rag/graph/es/indexes/<index_name>/docs/<doc_id>
```

参数来源有两处：

| 参数         | 位置   | 含义                           |
| ------------ | ------ | ------------------------------ |
| `index_name` | 路径   | 哪个索引                       |
| `doc_id`     | 路径   | 改哪条                         |
| body         | 请求体 | **只放要改的字段**（非空对象） |

例如把 `1004` 的价格改成 `7599`：

![更新](/images/rag/elasticsearch-insert-5.png)

`updated` 就是这次实际改了哪些字段。

## 七、删除文档

接口：

```text
DELETE /rag/graph/es/indexes/<index_name>/docs/<doc_id>
```

参数：

| 参数         | 位置 | 含义     |
| ------------ | ---- | -------- |
| `index_name` | 路径 | 哪个索引 |
| `doc_id`     | 路径 | 删哪条   |

删除成功：

注意是 `204`，不是 `200`。删除后没有内容要返回，所以是空 body 的 204。

文档不存在：

```json
{
  "error": "文档 1004 不存在"
}
```

```text
404
```

## 八、检索

接口：

```text
POST /rag/graph/es/indexes/<index_name>/search
```

参数全部走 body，都是可选的：

| 参数           | 含义               | 说明                                         |
| -------------- | ------------------ | -------------------------------------------- |
| `keyword`      | 中文关键词         | 自动拼 `match(title + desc)` + 高亮          |
| `query`        | 完整的 ES 查询 DSL | 设置了就优先，keyword 不生效（bool 等）      |
| `sort`         | 排序               | 如 `[{"price": "desc"}]`                     |
| `from`         | 分页起点           | 浅分页，从第几条开始                         |
| `size`         | 每页返回条数       | 不传用配置的 `ES_TOP_K`（默认 5）            |
| `search_after` | 深分页游标         | 上一页最后一条的 `sort` 值，不能和 from 同用 |
| `highlight`    | 是否高亮           | 有关键词时默认开                             |

### 关键词检索

![检索](/images/rag/elasticsearch-insert-6.png)

代码里自动拼成：

```json
{
  "bool": {
    "should": [
      { "match": { "title": "120HZ刷新率" } },
      { "match": { "desc": "120HZ刷新率" } }
    ]
  }
}
```

title 和 desc 任一边命中都算。

### 直接给 query（bool 复合）

![检索](/images/rag/elasticsearch-insert-7.png)

`must` 必须满足(算分)、`should` 满足其一(算分)、`filter` 过滤(不算分)。

返回值结构：

- `total` 一共命中几条
- `took` 耗时多少毫秒
- `hits` 命中的文档数组
- `hits[].sort` 是分页游标，深分页的时候要拿它当 `search_after`

---

### 分页：`from` / `size`

![检索](/images/rag/elasticsearch-insert-8.png)

原理是 ES 把所有命中先排好序，跳过 `from` 条，再返回 `size` 条。有点像 MySQL 的：

```text
LIMIT from, size
```

ES 是分布式的，每个分片都要先把结果排序，协调节点再归并，然后丢弃前面的文档。所以：

```text
from 越大
    ↓
需要排序、丢弃的文档越多
    ↓
性能越差
```

还有一个硬上限：默认 `index.max_result_window = 10000`。也就是说：

```text
from + size > 10000
    ↓
ES 直接报错
```

深翻页不是调大 from 能解决的。

---

### 深分页：`search_after`

![检索](/images/rag/elasticsearch-insert-9.png)

`search_after` 从"上一页最后一条的 `sort` 值"之后开始取，不需要从头数跳过，所以翻多少页都稳定。

**关键前提**：`sort` 要唯一稳定。只按 `price` 排，两个同价格文档顺序不确定，容易翻到重复或漏条。解决方式是加第二个排序字段（比如 `goods_id`）：

```text
sort
  ├── price desc      主排序
  └── goods_id asc    稳定次序(防止同价抖动)
```

**游标流程**：

```text
第 1 页
    ↓
不带 search_after
    ↓
返回里每条带 sort
    ↓
拿最后一条的 sort 当 search_after
    ↓
第 2 页继续
    ↓
...直到某页 hits 为空 = 翻完
```

### 两种分页怎么选

|          | `from/size` 浅分页      | `search_after` 深分页      |
| -------- | ----------------------- | -------------------------- |
| 适用场景 | 前几页、页码跳转        | 无限往下翻、数据量大       |
| 性能     | 深了变慢                | 稳定                       |
| 上限     | from+size ≤ 10000       | 基本无上限                 |
| 排序要求 | 无                      | 必须唯一稳定（加第二字段） |
| 代表场景 | 「第 1/2/3…页」页码按钮 | 「加载更多」流式滚动       |

判断口诀：

```text
要跳到第 N 页    → 用 from/size
要一直往下刷     → 用 search_after
```

---

## 九、复合查询与常用叶子查询

前面 `match`、`term` 这种是「叶子查询」——真正去匹配某个字段。而 `bool` 属于「复合查询」——负责把多个叶子查询按逻辑组合起来。

### `bool` 的四个属性

| 属性       | 语义       | 满足条件 | 是否参与算分 |
| ---------- | ---------- | -------- | ------------ |
| `must`     | 必须满足   | 全部满足 | 是           |
| `must_not` | 必须不满足 | 全部排除 | 否           |
| `should`   | 满足其一   | 至少一个 | 是           |
| `filter`   | 过滤       | 全部满足 | 否           |

一个典型组合：

```json
{
  "bool": {
    "must": [{ "match": { "title": "手机" } }],
    "filter": [{ "term": { "category": "mobile_phone" } }],
    "must_not": [{ "term": { "goods_id": "1001" } }]
  }
}
```

### 关键区别：算分

- `must` / `should` 会算分，多命中一个子句，相关度分数越高；
- `must_not` / `filter` 不算分，只做「通过与不通过」的过滤，更快且不影响排序分数。

所以「既要过滤、又不想让它影响排序」的精确条件（分类、价格区间），放 `filter` 而不是 `must` 更合适。

### `should` 单独用的坑：`minimum_should_match`

当 `bool` 里只有 `should`、没有 `must` 时，默认满足**一个** `should` 就命中。

但一旦同时有 `must`，`should` 就退化成「加分项」，一个不满足也能通过：

```json
{
  "bool": {
    "must": [{ "match": { "title": "手机" } }],
    "should": [
      { "match": { "desc": "华为" } },
      { "match": { "desc": "Mate" } }
    ],
    "minimum_should_match": 1
  }
}
```

`minimum_should_match` 指明 `should` 至少命中几个。

### 除了 `bool` 还有哪些复合查询

| 查询             | 作用                                                   |
| ---------------- | ------------------------------------------------------ |
| `constant_score` | 把子查询固定成一个分数，只「过滤+统一分数」            |
| `dis_max`        | 取多个查询里的最高分，适合「标题命中比描述命中更重要」 |
| `boosting`       | 命中正查询加分、命中负查询整体降权                     |
| `function_score` | 在打分上叠加函数，比如按 `price`、销量加权             |

### 叶子查询：全文检索类（作用于 text）

| 查询                | 说明                                          |
| ------------------- | --------------------------------------------- |
| `match`             | 字段分词后匹配，任意词命中即算，最常用        |
| `match_phrase`      | 按顺序连续出现，「华为手机」要连着            |
| `multi_match`       | 同一个词同时搜多个字段，`title + desc` 常用它 |
| `match_all`         | 匹配全部文档                                  |
| `query_string`      | 支持 `+ - AND OR` 这类搜索表达式              |
| `match_bool_prefix` | 最后一个词按前缀匹配                          |

### 叶子查询：term 级（作用于 keyword / 数值）

| 查询       | 说明                                              |
| ---------- | ------------------------------------------------- |
| `term`     | 字段完全等于某个值，如 `category == mobile_phone` |
| `terms`    | 等于多个值里的任意一个                            |
| `range`    | 范围，如 `price` 1000~8000、日期区间              |
| `exists`   | 字段存在（非空）                                  |
| `prefix`   | 前缀匹配                                          |
| `wildcard` | 通配符 `*` / `?`                                  |
| `regexp`   | 正则匹配                                          |
| `ids`      | 按 `_id` 列表精确取文档                           |
| `fuzzy`    | 纠错匹配，容忍编辑距离                            |

> 叶子查询负责「匹配哪个值」，`bool` 负责「怎么把这些匹配组合起来，并决定哪些参与算分」。
