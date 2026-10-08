---
date: 2026-09-28
title: Neo4j 基础用法
tags:
  - AI
  - AI Agent
  - RAG
  - Graph RAG
  - Neo4j
  - Cypher
---

# Neo4j 基础用法

环境那篇把 Neo4j 跑起来了，这篇开始真正用 Neo4j。

上一篇的图模型是「认识关系」：每个 `Person` 是一个节点，两个人之间用一条 `KNOWS` 关系连起来，构成一张最简单的社交图。

代码都在：

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/graph_rag/neo4j)

我们会在 Neo4j 里建出这样一张示例图：

```text
张三 ──KNOWS──▶ 李四
张三 ──KNOWS──▶ 王五
```

围绕它演示六个操作：**创建节点、合并节点、查询节点、创建关系、查询关系、更新/删除节点**。

所有接口都挂在：

```text
/rag/graph/neo4j/demo/...
```

<br />

## 一、环境与三层结构

### Neo4j 跑在哪里

本地用 Docker 起了一个单实例 Neo4j：

```text
neo4j-graphrag   Up (healthy)

Bolt  127.0.0.1:7687   （客户端连这个）
HTTP  127.0.0.1:7474   （浏览器管理界面）
```

代码里通过 Bolt 协议连接：

```python
GraphDatabase.driver(
    current_app.config["NEO4J_URI"],          # bolt://127.0.0.1:7687
    auth=(
        current_app.config["NEO4J_USER"],     # neo4j
        current_app.config["NEO4J_PASSWORD"],
    ),
)
```

密码从 `config.py` 读，而不是硬编码。

---

```text
controllers
      ↓
services
      ↓
neo4j_store
```

`controllers` 只处理 HTTP 和参数校验，`services` 负责拼 Cypher 和业务编排，`neo4j_store` 只封装连接和一个通用的 `run_cypher()`。

---

### 一个连接，一个入口

`neo4j_store` 是整个数据访问的唯一入口，核心就一个方法：

```python
class Neo4jStore:

    def __init__(self):
        self.driver = GraphDatabase.driver(
            current_app.config["NEO4J_URI"],
            auth=(
                current_app.config["NEO4J_USER"],
                current_app.config["NEO4J_PASSWORD"],
            ),
        )

    def close(self) -> None:
        if self.driver:
            self.driver.close()

    def run_cypher(self, cypher: str, params: dict | None = None) -> list[dict]:
        params = params or {}
        with self.driver.session() as sess:
            res: Result = sess.run(cypher, params)
            return [dict(rec) for rec in res]
```

---

#### 连接不是每次用完就丢

很多人第一次写会这么干：

```python
# 每个 request 都 new 一个 driver
```

这是错的。`GraphDatabase.driver()` 背后是一个**连接池**，创建成本很高。

正确做法是：driver 全局只建一次（这里每次请求 `_store()` 会重建 driver，是 Demo 简化；生产应该把 store 挂到 app 上复用一个 driver），用完只 `close()` 释放当次会话，不反复重建连接池。

---

#### 为什么要 `dict(rec)`，而不是 `rec.data()`

这是 Neo4j Python 驱动最容易踩的坑之一。

```text
rec.data()   →  把 Node / Relationship 摊平成一个普通 dict
                ↓
                丢掉 element_id、type 这些图对象的属性

dict(rec)    →  保留原始记录对象
                ↓
                rec["p"] 拿到的还是 Node,能访问 .element_id
```

区别举个实例。`node.element_id` 是节点的唯一标识（类似 MySQL 主键 / ES 的 `_id`），后面区分同名节点就靠它。

```python
# rec.data() 之后
node["element_id"]   # ❌ AttributeError,普通 dict 没有 element_id

# dict(rec) 之后
node.element_id      # ✅ 7545f4b0-...:5
```

所以 store 统一用 `dict(rec)`。

---

### 参数化 Cypher

每条查询都写成：

```python
"CREATE (p:Person {name: $name, age: $age}) RETURN p",
params={"name": "张三", "age": 28},
```

`$name`、`$age` 是参数占位，值通过 `params` 传，**绝不把值直接格式化进 Cypher 字符串**。

```python
# ❌ 不要
sess.run(f"CREATE (p:Person {{name: '{name}'}})")

# ✅ 要
sess.run("CREATE (p:Person {name: $name})", params={"name": name})
```

和 SQL 参数化一个道理：防注入，也能让驱动正常工作。

---

## 二、创建节点

### 接口

```text
POST /rag/graph/neo4j/demo/person
```

body：

```json
{
  "name": "张三",
  "age": 28
}
```

创建用的是 `CREATE`：

```cypher
CREATE (p:Person {name: $name, age: $age}) RETURN p
```

#### Cypher 文法

```text
CREATE                    创建
(p:Person)                变量 p,类型标签 Person
{name: $name, age: $age}  节点的属性
RETURN p                  返回这个节点,供上层展示
```

注意 Cypher 里标签和属性用的是**大写驼峰 / 花括号**，别按 SQL 的习惯写。

#### 对应的接口调用

<!-- 截图占位:补图后取消注释
![创建节点](/images/rag/neo4j-create-person.png)
-->

返回：

```json
{
  "element_id": "7545f4b0-442d-4ead-baf5-c23f44ea343c:5",
  "name": "张三",
  "age": 28
}
```

HTTP 状态码：

```text
201 Created
```

`element_id` 是 Neo4j 给这个节点分配的唯一标识。

controller 里对 `name`、`age` 做了校验：

```json
{
  "error": "name 不能为空"
}
```

```text
400
```

---

### CREATE 不幂等

`CREATE` 每次执行都会**新建一条**。

同一个 `name` 调两次，这个节点的 `element_id` 不同，图里会出现**两个张三**。

```bash
curl -X POST http://127.0.0.1:5001/rag/graph/neo4j/demo/person \
  -H 'Content-Type: application/json' \
  -d '{"name":"张三","age":28}'
# 再调一次,返回的 element_id 变了
```

如果不希望重复，用 `MERGE`。

---

## 三、合并节点（MERGE，幂等）

### 接口

```text
POST /rag/graph/neo4j/demo/person/merge
```

body：

```json
{
  "name": "张三",
  "age": 20
}
```

用的是 `MERGE`：

```cypher
MERGE (p:Person {name: $name})
ON CREATE SET p.age = $age
ON MATCH  SET p.age = $age
RETURN p
```

### CREATE vs MERGE

|          | `CREATE`     | `MERGE`        |
| -------- | ------------ | -------------- |
| 幂等     | 否           | 是             |
| 语义     | 无条件新建   | 有则改、无则建 |
| 重复调用 | 多个同名节点 | 始终同一个节点 |

`MERGE` 会先**按匹配键（这里 `name`）去查找**：

```text
找到   → 走 ON MATCH 分支,更新属性
没找到 → 走 ON CREATE 分支,新建节点
```

两个分支二选一，不会都执行。

#### 幂等的实际表现

连续调两次 `merge` 王五（age 分别传 30、35）：

```text
第一次 → element_id = 7545f4b0-...:7,age = 30
第二次 → element_id = 7545f4b0-...:7,age = 35   ← 同一个节点,只是 age 更新了
```

`element_id` 保持不变，节点没有被复制。

所以 `MERGE` 很适合做**种子里数据**：脚本反复跑也不会把图建重复。

---

## 四、查询节点

### 接口

```text
GET /rag/graph/neo4j/demo/persons
```

全部可选的 query 参数：

| 参数      | 含义                    | 举例          |
| --------- | ----------------------- | ------------- |
| （不传）  | 返回所有 Person         |               |
| `name`    | 按 name 精确匹配        | `?name=张三`  |
| `min_age` | 只返回 age ≥ 该值的节点 | `?min_age=20` |

`name` 和 `min_age` 可以组合。

#### 全量查询

```bash
curl http://127.0.0.1:5001/rag/graph/neo4j/demo/persons
```

对应 Cypher：

```cypher
MATCH (p:Person) RETURN p ORDER BY p.name
```

#### 带条件查询

按年龄过滤：

```bash
curl "http://127.0.0.1:5001/rag/graph/neo4j/demo/persons?min_age=25"
```

对应：

```cypher
MATCH (p:Person) WHERE p.age >= $min_age RETURN p ORDER BY p.name
```

按名字查询：

```cypher
MATCH (p:Person) WHERE p.name = $name RETURN p
```

### WHERE 按需拼接

代码里 `WHERE` 是动态拼出来的：

```python
conditions = []
if name:
    conditions.append("p.name = $name")
    params["name"] = name
if min_age is not None:
    conditions.append("p.age >= $min_age")
    params["min_age"] = min_age

where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
cypher = f"MATCH (p:Person) {where_clause} RETURN p ORDER BY p.name"
```

```text
都不传     →  MATCH ... RETURN p
只传 min_age →  MATCH ... WHERE p.age >= $min_age RETURN p
同时传 name →  MATCH ... WHERE p.name = $name AND p.age >= $min_age RETURN p
```

条件越多用 `AND` 连起来。

注意：**拼的是范围 / 条件结构，值永远走 `params`**，不会把搜索词写进字符串。

#### 实际返回

<!-- 截图占位:补图后取消注释
![查询节点](/images/rag/neo4j-find-persons.png)
-->

```json
[
  {
    "name": "张三",
    "age": 28,
    "element_id": "7545f4b0-...:5"
  },
  {
    "name": "李四",
    "age": 25,
    "element_id": "7545f4b0-...:6"
  },
  {
    "name": "王五",
    "age": 35,
    "element_id": "7545f4b0-...:7"
  }
]
```

---

## 五、创建关系

前面只是三个孤立的节点，还没有「认识」关系。

### 接口

```text
POST /rag/graph/neo4j/demo/relationship
```

body：

```json
{
  "p1_name": "张三",
  "p2_name": "李四",
  "since": 2020
}
```

对应 Cypher：

```cypher
MATCH (p1:Person {name: $p1_name}), (p2:Person {name: $p2_name})
MERGE (p1)-[r:KNOWS {since: $since}]->(p2)
ON CREATE SET r.since = $since
ON MATCH  SET r.since = $since
RETURN p1, r, p2
```

分两步：

```text
MATCH (p1), (p2)    先定位两个已存在的节点
MERGE (p1)-[r:KNOWS]->(p2)   再在它们之间建关系
```

#### 关系也有类型和属性

```text
(p1)-:[r:KNOWS {since: 2020}]->(p2)
      └─ 关系类型 KNOWS      └─ 关系属性 since
```

关系不是一根光秃秃的线，它和节点一样能带属性。`since` 记录「哪一年认识的」。

`->` 表示**有向**：`张三 -KNOWS-> 李四` 表示张三认识李四。

#### 幂等

对同一对 `p1/p2`，`MERGE` 不会重复建边：

```text
张三-KNOWS->李四 建了一次再建一次 → 还是同一条边
```

#### 两端不存在则不建

`MATCH` 匹配不到节点时不会建边，返回：

```json
{
  "created": false,
  "reason": "一端或两端 Person 不存在"
}
```

#### 建两条关系，把示例图补全

```bash
curl -X POST http://127.0.0.1:5001/rag/graph/neo4j/demo/relationship \
  -H 'Content-Type: application/json' \
  -d '{"p1_name":"张三","p2_name":"李四","since":2020}'

curl -X POST http://127.0.0.1:5001/rag/graph/neo4j/demo/relationship \
  -H 'Content-Type: application/json' \
  -d '{"p1_name":"张三","p2_name":"王五","since":2023}'
```

返回：

<!-- 截图占位:补图后取消注释
![创建关系](/images/rag/neo4j-create-relationship.png)
-->

```json
{
  "p1": "张三",
  "p2": "李四",
  "type": "KNOWS",
  "since": 2020
}
```

现在图变成了：

```text
张三 ──KNOWS(2020)──▶ 李四
张三 ──KNOWS(2023)──▶ 王五
```

---

## 六、查询关系

### 接口

```text
GET /rag/graph/neo4j/demo/relationships
```

可选的 query 参数：

| 参数        | 含义                                  |
| ----------- | ------------------------------------- |
| （不传）    | 返回所有 KNOWS 关系（无向，两边都算） |
| `from_name` | 只查「此人作为起点认识的人」          |

#### 查某个人认识谁（有向）

```bash
curl "http://127.0.0.1:5001/rag/graph/neo4j/demo/relationships?from_name=张三"
```

对应 Cypher：

```cypher
MATCH (p:Person {name: $from_name})-[r:KNOWS]->(o:Person)
RETURN p.name AS from_name, r.since AS since, o.name AS to_name
```

这里 `->` 很重要：

```text
(p)-[r:KNOWS]->(o)
  └─ 单向:从 p 指向 o,只算 p 作为起点的边
```

返回：

```json
[
  {
    "from_name": "张三",
    "since": 2020,
    "to_name": "李四"
  },
  {
    "from_name": "张三",
    "since": 2023,
    "to_name": "王五"
  }
]
```

张三认识李四、王五。

#### 查所有关系（无向）

不传 `from_name`：

<!-- 截图占位:补图后取消注释
![查询关系](/images/rag/neo4j-find-relationships.png)
-->

对应 Cypher：

```cypher
MATCH (p1:Person)-[r:KNOWS]-(p2:Person)
RETURN p1.name AS from_name, r.since AS since, p2.name AS to_name
```

注意签名从 `->` 变成了 `-`（无向），两边都会匹配到。

---

## 七、更新节点

### 接口

```text
POST /rag/graph/neo4j/demo/person/update
```

body：

```json
{
  "name": "李四",
  "age": 25,
  "city": "北京"
}
```

对应 Cypher：

```cypher
MATCH (p:Person {name: $name}) SET p.age = $age, p.city = $city RETURN p
```

`name` 是定位键，不会变；要更新的字段是 `age` / `city`。

和 Elasticsearch 局部更新类似，代码里 `SET` 也是按需拼接：

```python
assignments = []
if age is not None:
    assignments.append("p.age = $age")
    params["age"] = age
if city:
    assignments.append("p.city = $city")
    params["city"] = city

cypher = f"MATCH (p:Person {{name: $name}}) SET {', '.join(assignments)} RETURN p"
```

```text
传 age   →  SET p.age = $age
传 city  →  SET p.city = $city
都传     →  SET p.age = $age, p.city = $city
```

返回：

```json
{
  "updated": true,
  "name": "李四",
  "age": 25,
  "city": "北京"
}
```

### 名字不存在

匹配不到节点时：

```json
{
  "updated": false,
  "reason": "Person 王六 不存在"
}
```

空字段也不让你空更新：

```json
{
  "updated": false,
  "reason": "没有可更新的字段(age / city 至少给一个)"
}
```

---

## 八、删除节点

### 接口

```text
DELETE /rag/graph/neo4j/demo/person
```

body：

```json
{
  "name": "张三"
}
```

对应 Cypher：

```cypher
MATCH (p:Person {name: $name}) DETACH DELETE p RETURN count(p) AS c
```

返回：

```json
{
  "deleted": 1
}
```

#### 为什么用 `DETACH` 而不是 `DELETE`

删除之前，张三身上拉着两条关系：

```text
张三 ──KNOWS──▶ 李四
张三 ──KNOWS──▶ 王五
```

如果直接 `DELETE`：

```text
张三 还有关系连着
    ↓
Neo4j 报错:不能删除仍有关系的节点
```

`DETACH DELETE` 会**先把节点上的所有关系一并拔掉**，再删节点。

```text
DETACH DELETE
    ↓
删张三
    ↓
张三-KNOWS->李四 / 张三-KNOWS->王五 这两条关系也一起没了
```

所以图库删节点默认用 `DETACH DELETE`。

#### 节点不存在

`deleted` 为 `0`：

```json
{
  "deleted": 0
}
```

---

## 九、小结

| 操作     | Cypher 关键词                    | 幂等 | 备注                     |
| -------- | -------------------------------- | ---- | ------------------------ |
| 创建节点 | `CREATE`                         | 否   | 重复调会出现多个同名节点 |
| 合并节点 | `MERGE` + `ON CREATE`/`ON MATCH` | 是   | 有则改、无则建，适合种子 |
| 查询节点 | `MATCH` + `WHERE`                | -    | 条件按需用 `AND` 拼接    |
| 创建关系 | `MATCH` + `MERGE` 关系           | 是   | `->` 有向，关系能带属性  |
| 查询关系 | `MATCH` 关系                     | -    | `->` 有向 / `-` 无向     |
| 更新节点 | `SET`                            | -    | 按需拼 SET 字段          |
| 删除节点 | `DETACH DELETE`                  | -    | 连节点的关系一起删       |

几个容易踩的点：

1. **`rec.data()` vs `dict(rec)`**：要用 `element_id` 这种图对象属性，必须 `dict(rec)`。
2. **`CREATE` 不幂等，`MERGE` 幂等**：使用 `MERGE`，避免重复节点。
3. **`DETACH`**：删还有关系的节点必须 detach，否则报错。
4. **参数化**：值走 `params`，别拼进 Cypher 字符串。
