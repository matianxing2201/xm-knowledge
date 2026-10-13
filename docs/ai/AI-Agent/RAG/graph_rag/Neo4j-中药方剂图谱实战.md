---
date: 2026-10-13
title: Neo4j 中药方剂图谱实战
tags:
  - AI
  - AI Agent
  - RAG
  - Graph RAG
  - Neo4j
  - Cypher
  - 中药
  - 方剂
---

# Neo4j 中药方剂图谱实战

这篇笔记介绍如何用 Neo4j 把中药、方剂和它们之间的归属、组成关系连成一张图，并结合项目代码说明图模型、JSON 导入和查询接口。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/graph_rag/neo4j/medicine_prescription)

## 一、图模型

如果只用表格记录数据，中药、方剂和分类通常会分开放。这个示例关注它们之间的联系：中药属于哪个分类、方剂属于哪种类型、方剂包含哪些中药。图数据库可以直接表示这些对象和联系。

代码里的核心概念如下：

| 名称     | 含义                               | 代码里的标签或关系     |
| -------- | ---------------------------------- | ---------------------- |
| 中药     | 一味药及它的性味、归经、功用等信息 | `ChineseMedicine`      |
| 中药分类 | 用章节和小节表示的分类             | `MedicineCategory`     |
| 方剂     | 一张方剂及它的功用、主治等信息     | `Prescription`         |
| 方剂类型 | 用单元和子单元表示的分类           | `PrescriptionCategory` |
| 归属     | 中药或方剂属于某个分类             | `BELONGS_TO_CATEGORY`  |
| 组成     | 方剂包含某味中药                   | `CONTAINS`             |

图的大致形状是：

```text
(麻黄:ChineseMedicine)-[:BELONGS_TO_CATEGORY]->(发散风寒药:MedicineCategory)

(麻黄汤:Prescription)-[:BELONGS_TO_CATEGORY]->(辛温解表:PrescriptionCategory)
(麻黄汤:Prescription)-[:CONTAINS]->(麻黄:ChineseMedicine)
```

在 Neo4j Browser 中查询中药的归属关系，可以看到中药节点和分类节点通过一条有方向的边连接：

![中药节点通过归属关系连接到分类节点](/images/rag/neo4j-01.png)

节点保存“是什么”，关系保存“彼此有什么联系”。节点和关系都可以有属性。例如，`麻黄` 节点保存 `nature_flavor`（性味）、`meridian`（归经）和 `dosage`（用量）等信息；`麻黄汤` 节点保存功用、主治和配伍意义等信息。

## 二、数据来源

中药和方剂的示例数据分别放在：

```text
medicine_prescription/data/medicine.json
medicine_prescription/data/prescription.json
```

当前 JSON 中有 134 条中药记录和 126 条方剂记录。中药记录包含章节、小节、名称、性味、归经、应用、用量和注意事项；方剂记录除方剂属性外，还有 `composition` 组成列表。

一条方剂数据大致长这样：

```json
{
  "unit": "第一单元 解表剂",
  "subunit": "一、辛温解表",
  "name": "麻黄汤",
  "composition": [
    { "drug": "麻黄", "dosage": "" },
    { "drug": "桂枝", "dosage": "" }
  ],
  "function": "发汗解表，宣肺平喘",
  "indication": "外感风寒表实证……",
  "compatibility_meaning": "……",
  "compatibility_feature": "……",
  "usage": "……",
  "other": "……"
}
```

`composition` 是一组字典，每项用 `drug` 写中药名称。代码通过名称把它连到中药节点。当前有不少组成药名没有对应的完整 `medicine.json` 记录；导入方剂时，代码会为这些名称创建只有 `name` 属性的中药节点。因此可以查询到组成关系，但这些节点可能没有性味、归经等详细属性。

数据项里虽然还带有 `dosage`，当前服务只读取 `drug`，没有把剂量保存到节点或 `CONTAINS` 关系上。所以这份图目前表达了“方剂包含哪味药”，没有表达“每味药用了多少”。

## 三、导入 JSON 数据

调用以下接口可以导入两份 JSON：

```text
POST /rag/graph/neo4j/medicine/seed
```

`seed_graph()` 的顺序是先遍历全部中药，再遍历全部方剂：

```text
medicine.json
    ↓
创建或更新中药节点和中药分类关系
    ↓
prescription.json
    ↓
创建或更新方剂节点、方剂分类关系和组成关系
```

先导入中药的好处是，大部分组成药名已经有完整节点，方剂随后只需要连边。若组成列表里有尚未导入的药名，方剂代码仍然会用 `MERGE` 建出中药节点。

成功后接口返回两份输入文件的记录数：

```json
{
  "medicines": 134,
  "prescriptions": 126
}
```

这里的数字表示读到多少条 JSON 记录，不是数据库这次新增了多少个节点。导入使用了 `MERGE`，因此重复调用会复用匹配的节点和关系，并把节点属性更新为这次传入的值。需要注意，整个导入过程是逐条执行的；如果中途出错，前面已写入的部分不会由 `seed_graph()` 自动回滚。

## 四、创建或更新中药

单条中药接口是：

```text
POST /rag/graph/neo4j/medicine
```

请求体需要包含完整属性：

```json
{
  "name": "麻黄",
  "chapter": "第一章 解表药",
  "section": "第一节 发散风寒药",
  "nature_flavor": "辛、微苦，温",
  "meridian": "归肺、膀胱经",
  "application": "风寒感冒；胸闷喘咳",
  "dosage": "煎服 2～10g",
  "caution": "表虚自汗者禁用"
}
```

创建节点的核心 Cypher 是：

```cypher
MERGE (m:ChineseMedicine {name: $name})
SET
  m.chapter = $chapter,
  m.section = $section,
  m.nature_flavor = $nature_flavor,
  m.meridian = $meridian,
  m.application = $application,
  m.dosage = $dosage,
  m.caution = $caution
```

代码用 `name` 作为中药的匹配键：找到节点就更新属性，找不到就创建节点。`$name`、`$chapter` 等是参数占位符，实际值通过参数字典传给 `run_cypher()`，不直接拼到 Cypher 字符串里。

路由只检查 `name` 是否存在，服务还会直接读取其余字段，因此请求也需要提供完整属性。接口返回的 `created` 是中药名称；即使本次实际更新了已有节点，返回字段仍然叫 `created`。

接着代码按章节和小节找到或创建分类，再连上归属关系：

```cypher
MERGE (c:MedicineCategory {chapter: $chapter, section: $section})
WITH c
MATCH (m:ChineseMedicine {name: $name})
MERGE (m)-[:BELONGS_TO_CATEGORY]->(c)
```

分类本身也被建成节点，而不是只把分类名称复制到中药节点上。查询时可以从分类节点沿关系找到该分类下的中药。

下面这张图展示了一个中药分类节点和多味中药之间的归属关系：

![一个分类节点连接多味中药](/images/rag/neo4j-01-belongs-category.png)

按当前实现，如果已有中药的章节或小节发生变化，代码会连接到新的分类，但不会移除旧的 `BELONGS_TO_CATEGORY` 关系；方剂类型也是一样。这段代码适合反复导入分类稳定的数据，分类变更时还需要额外清理旧关系。

## 五、创建或更新方剂

单条方剂接口是：

```text
POST /rag/graph/neo4j/medicine/prescription
```

请求体需要包含方剂属性和组成列表：

```json
{
  "name": "麻黄汤",
  "unit": "第一单元 解表剂",
  "subunit": "一、辛温解表",
  "function": "发汗解表，宣肺平喘",
  "indication": "外感风寒表实证",
  "compatibility_meaning": "麻黄发汗宣肺；桂枝助麻黄解表",
  "compatibility_feature": "麻桂相须发汗",
  "usage": "按示例数据中的说明使用",
  "other": "出自《伤寒论》",
  "composition": [{ "drug": "麻黄" }, { "drug": "桂枝" }]
}
```

代码先按方剂名 `MERGE` 节点并更新方剂属性，再按 `unit` 和 `subunit` 合并方剂类型节点，创建 `BELONGS_TO_CATEGORY` 关系。最后遍历 `composition`，为每味药建立 `CONTAINS` 关系：

```cypher
MATCH (p:Prescription {name: $prescription_name})
MERGE (m:ChineseMedicine {name: $medicine_name})
MERGE (p)-[:CONTAINS]->(m)
```

这里有个容易忽略的细节：建立组成关系时，中药节点也用 `MERGE`。如果单独创建方剂，而组成中的药名还不存在，代码会先创建一个只有名称的中药节点。批量导入时先导入中药 JSON，通常能避免大部分这种“只有名字”的节点。

导入完成后，可以看到方剂节点向外连接多味中药。图里的每条 `CONTAINS` 边都表示“这张方剂包含这味药”：

![方剂节点通过 CONTAINS 关系连接组成中药](/images/rag/neo4j-02-contains.png)

## 六、按名称查询方剂

查询接口是：

```text
GET /rag/graph/neo4j/medicine/prescription?name=麻黄汤
```

核心查询：

```cypher
MATCH (p:Prescription {name: $prescription_name})
OPTIONAL MATCH (p)-[:CONTAINS]->(m:ChineseMedicine)
RETURN
  p{.*} AS prescription_info,
  collect(m{.*}) AS medicine_list
```

查询先用 `MATCH` 按名称找到方剂，再用 `OPTIONAL MATCH` 查找它包含的中药。`OPTIONAL MATCH` 的作用是：即使方剂暂时没有组成关系，方剂本身仍然能被查询出来。`p{.*}` 把方剂的全部属性整理成一个对象；`collect(m{.*})` 把多味中药的属性收进一个列表。

返回结构大致如下：

```json
[
  {
    "prescription_info": {
      "name": "麻黄汤",
      "unit": "第一单元 解表剂",
      "subunit": "一、辛温解表",
      "function": "发汗解表，宣肺平喘"
    },
    "medicine_list": [
      { "name": "麻黄", "nature_flavor": "辛、微苦，温" },
      { "name": "桂枝", "nature_flavor": "辛、甘，温" }
    ]
  }
]
```

实际属性会比示例更多，因为查询使用了 `p{.*}` 和 `m{.*}`。如果名称没有匹配到方剂，服务返回空列表 `[]`。

## 七、小结

| 操作 | Cypher 关键词 | 幂等 | 备注 |
| --- | --- | --- | --- |
| 导入中药 | `MERGE` + `SET` | 是 | 按 `name` 合并节点并更新属性 |
| 关联中药分类 | `MERGE` | 是 | 按章节、小节复用分类节点和关系 |
| 导入方剂 | `MERGE` + `SET` | 是 | 按 `name` 合并节点并更新属性 |
| 关联方剂类型 | `MERGE` | 是 | 按单元、子单元复用类型节点和关系 |
| 保存方剂组成 | `MERGE` | 是 | 用 `CONTAINS` 关系连接方剂和中药 |
| 查询方剂 | `MATCH` + `OPTIONAL MATCH` | - | `collect` 将组成中药收成列表 |

几个容易忽略的点：

1. **`MERGE` 不等于唯一约束**：当前代码没有创建数据库唯一性约束。
2. **组成剂量尚未入图**：JSON 中有 `composition[].dosage`，但服务目前只读取 `drug`。
3. **缺失中药会建成简略节点**：创建方剂时，未导入的药名会生成只有 `name` 属性的 `ChineseMedicine` 节点。
4. **分类变更不会清理旧关系**：已有中药或方剂改了分类后，旧的 `BELONGS_TO_CATEGORY` 关系仍会保留。
5. **批量导入不是一个整体事务**：导入按记录逐条执行，中途失败时已写入的数据不会自动回滚。
6. **参数化查询**：值通过 `params` 传入，不要直接拼进 Cypher 字符串。

这个示例展示了图建模的基本思路：把中药、方剂和分类表示为节点，用归属和组成关系连接它们，再沿着关系查询需要的信息。
