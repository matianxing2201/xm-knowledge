---
title: Spring AI + 智谱 AI + Milvus RAG 实战
date: 2026-07-09
tags:
  - Spring AI
  - 智谱
  - Milvus
  - RAG
  - 向量数据库
---

# Spring AI + 智谱 AI + Milvus RAG 实战

> 基于 Spring Boot + Spring AI + 智谱 AI + Milvus 向量数据库构建 RAG 应用

## 环境准备

### 前置依赖

- **Docker & Docker Compose** — 用于启动 Milvus 及相关组件
- **Java 21+** — 运行时
- **Maven** — 项目构建

### 启动 Milvus 服务

Milvus 依赖三个组件：**Milvus**（向量数据库）、**MinIO**（存储）、**Etcd**（元数据管理）。通过 Docker Compose 一键启动。

#### docker-compose 文件

```yaml
version: "3.5"

services:
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.25
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/etcd:/etcd
    command: etcd -advertise-client-urls=http://etcd:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    healthcheck:
      test: ["CMD", "etcdctl", "endpoint", "health"]
      interval: 30s
      timeout: 20s
      retries: 3

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2024-05-28T17-19-04Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "9001:9001"
      - "9000:9000"
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/minio:/minio_data
    command: minio server /minio_data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  standalone:
    container_name: milvus-standalone
    image: milvusdb/milvus:v2.6.12
    command: ["milvus", "run", "standalone"]
    security_opt:
      - seccomp:unconfined
    environment:
      MINIO_REGION: us-east-1
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/milvus:/var/lib/milvus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 30s
      start_period: 90s
      timeout: 20s
      retries: 3
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"

networks:
  default:
    name: milvus
```

#### 启动

```bash
docker compose -f milvus-standalone-docker-compose.yml up -d
```

#### 查看状态

```bash
docker compose -f milvus-standalone-docker-compose.yml ps
```

#### 停止

```bash
docker compose -f milvus-standalone-docker-compose.yml down
```

#### 端口说明

| 端口    | 用途                           |
| ------- | ------------------------------ |
| `19530` | Milvus gRPC 服务（应用连接用） |
| `9091`  | Milvus 健康检查 / 指标         |
| `9000`  | MinIO API                      |
| `9001`  | MinIO 控制台                   |
| `2379`  | Etcd 客户端                    |

### 可视化工具 Attu（可选）

Attu 是 Milvus 的图形化管理界面，方便浏览集合、向量和索引。

```bash
docker run -d \
  --name attu \
  -p 8000:3000 \
  -e MILVUS_URL=host.docker.internal:19530 \
  zilliz/attu:latest
```

启动后浏览器打开 `http://localhost:8000`。

> Linux 需加 `--add-host host.docker.internal:host-gateway` 参数。

![Attu 管理界面](/images/ai/spring-ai/milvus-1.png)

## Spring Boot 集成

### 项目结构

```
src/main/java/org/pony/milvus/
├── MilvusApplication.java            # 启动类
├── config/
│   └── MilvusConfig.java             # 读取 application.yml 配置
├── util/
│   └── MilvusUtil.java               # 操作 Milvus 的工具类
├── service/
│   ├── PrescriptionService.java      # 业务逻辑（上传 + RAG 查询）
│   └── InsertResult.java             # 上传结果封装
├── controller/
│   └── PrescriptionController.java   # REST API 入口
├── model/
│   └── QueryRequest.java             # 查询请求的 DTO
└── exception/
    └── GlobalExceptionHandler.java   # 全局异常处理
```

### 依赖配置 — pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.16</version>
        <relativePath/>
    </parent>
    <groupId>org.pony</groupId>
    <artifactId>milvus</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>milvus</name>
    <description>milvus</description>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.ai</groupId>
                <artifactId>spring-ai-bom</artifactId>
                <version>1.1.5</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Spring AI + 智谱 AI（自动配置 EmbeddingModel 和 ChatClient.Builder 的 Bean） -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-starter-model-zhipuai</artifactId>
        </dependency>

        <!-- Milvus SDK 3.0.3 -->
        <dependency>
            <groupId>io.milvus</groupId>
            <artifactId>milvus-sdk-java</artifactId>
            <version>3.0.3</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <repositories>
        <repository>
            <id>spring-snapshots</id>
            <name>Spring Snapshots</name>
            <url>https://repo.spring.io/snapshot</url>
            <releases><enabled>false</enabled></releases>
        </repository>
        <repository>
            <id>central-portal-snapshots</id>
            <name>central-portal-snapshots</name>
            <url>https://central.sonatype.com/repository/maven-snapshots/</url>
            <releases><enabled>false</enabled></releases>
            <snapshots><enabled>true</enabled></snapshots>
        </repository>
    </repositories>
</project>
```

关键依赖说明：

| 依赖                              | 作用                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `spring-boot-starter-web`         | 提供 `@RestController`、`@PostMapping` 等 Web 注解                                  |
| `spring-ai-starter-model-zhipuai` | Spring AI 智谱 AI 启动器，自动创建 `EmbeddingModel` 和 `ChatClient.Builder` 的 Bean |
| `milvus-sdk-java:3.0.3`           | Milvus 官方 SDK，提供 `MilvusClientV2`、`ConnectConfig` 等类                        |

### 配置 — application.yml

```yaml
server:
  port: 8080

# ========== 智谱 AI 配置 ==========
spring:
  ai:
    zhipuai:
      base-url: https://open.bigmodel.cn/api/paas
      api-key: 你的API密钥（去 open.bigmodel.cn 获取）
      chat:
        options:
          temperature: 0.3 # 随机度 0-1，越低回答越稳定
      embedding:
        options:
          model: embedding-3 # 向量模型，默认输出 2048 维

# ========== Milvus 配置（自定义前缀）==========
milvus:
  host: localhost
  port: 19530
  username: root
  password: Milvus
  database-name: tcm_db
  collection-name: tcm_prescriptions
  dimension: 2048 # 必须和 embedding-3 默认输出维度一致
  metric-type: IP # 距离算法：IP(内积) / COSINE(余弦) / L2(欧氏距离)
  index-type: AUTOINDEX # 索引类型：AUTOINDEX 自动选最优
```

### 核心代码

#### MilvusConfig — 配置映射

```java
@Component
@ConfigurationProperties(prefix = "milvus")
@Data
public class MilvusConfig {
    private String host;
    private int port;
    private String username;
    private String password;
    private String databaseName;
    private String collectionName;
    private int dimension;
    private String metricType;
    private String indexType;
}
```

#### MilvusUtil — 核心工具类

`@PostConstruct void init()` 在项目启动时自动执行：

```
1. 连接 Milvus（uri=http://host:port，token=user:pass）
2. 创建数据库 tcm_db（已存在则跳过）
3. 检查集合 tcm_prescriptions 是否存在
   ├─ 存在：直接加载（loadCollection）
   └─ 不存在：创建集合 → 创建索引 → 加载
```

集合 Schema（4 个字段）：

| 字段                | 类型              | 说明          |
| ------------------- | ----------------- | ------------- |
| `id`                | VarChar(36)，主键 | UUID          |
| `vector`            | FloatVector(2048) | AI 生成的向量 |
| `content`           | VarChar(65535)    | 处方完整 JSON |
| `prescription_type` | VarChar(100)      | 处方分类      |

```java
@Slf4j
@Component
public class MilvusUtil {

    private final MilvusConfig config;
    private MilvusClientV2 client;

    public MilvusUtil(MilvusConfig config) {
        this.config = config;
    }

    @PostConstruct
    public void init() {
        // v3.x 连接方式
        ConnectConfig connectConfig = ConnectConfig.builder()
                .uri("http://" + config.getHost() + ":" + config.getPort())
                .token(config.getUsername() + ":" + config.getPassword())
                .build();
        client = new MilvusClientV2(connectConfig);

        // 创建数据库（已存在则 catch）
        try {
            client.createDatabase(CreateDatabaseReq.builder()
                    .databaseName(config.getDatabaseName()).build());
        } catch (Exception e) {
            log.warn("数据库可能已存在: {}", e.getMessage());
        }

        // 检查并初始化集合
        Boolean hasCollection = client.hasCollection(HasCollectionReq.builder()
                .databaseName(config.getDatabaseName())
                .collectionName(config.getCollectionName()).build());
        if (Boolean.TRUE.equals(hasCollection)) {
            loadCollection();
            return;
        }
        createCollection();
        createIndexes();
        loadCollection();
    }

    /** 插入数据（批量） */
    public InsertResp insertData(List<Map<String, Object>> records) {
        List<JsonObject> rows = new ArrayList<>();
        for (Map<String, Object> record : records) {
            JsonObject row = new JsonObject();
            row.addProperty("id", (String) record.get("id"));
            @SuppressWarnings("unchecked")
            List<Double> vector = (List<Double>) record.get("vector");
            JsonArray vectorArray = new JsonArray();
            for (Double v : vector) vectorArray.add(v.floatValue());
            row.add("vector", vectorArray);
            row.addProperty("content", (String) record.get("content"));
            row.addProperty("prescription_type", (String) record.get("prescription_type"));
            rows.add(row);
        }
        return client.insert(InsertReq.builder()
                .databaseName(config.getDatabaseName())
                .collectionName(config.getCollectionName())
                .data(rows).build());
    }

    /** 向量相似度搜索 */
    public List<Map<String, Object>> search(float[] queryVector, int topK) {
        List<Float> vectorList = new ArrayList<>();
        for (float v : queryVector) vectorList.add(v);
        FloatVec floatVec = new FloatVec(vectorList);

        SearchResp resp = client.search(SearchReq.builder()
                .databaseName(config.getDatabaseName())
                .collectionName(config.getCollectionName())
                .annsField("vector")
                .data(List.of(floatVec))
                .topK(topK)
                .metricType(IndexParam.MetricType.valueOf(config.getMetricType()))
                .outputFields(List.of("content", "prescription_type"))
                .consistencyLevel(ConsistencyLevel.EVENTUALLY)
                .build());

        List<SearchResp.SearchResult> results = resp.getSearchResults().get(0);
        List<Map<String, Object>> resultList = new ArrayList<>();
        for (SearchResp.SearchResult result : results) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", result.getId());
            item.put("score", result.getScore());
            item.put("content", result.getEntity().get("content"));
            item.put("prescription_type", result.getEntity().get("prescription_type"));
            resultList.add(item);
        }
        return resultList;
    }
}

```

![Milvus 初始化日志](/images/ai/spring-ai/milvus-init.png)

![Milvus 插入数据日志](/images/ai/spring-ai/milvus-2.png)

## RAG 实战

### 整体流程

```
用户上传 txt → 拆成多条处方 → embedding 转向量 → 存入 Milvus
                                                        ↓
用户提问 → embedding 转向量 → Milvus 搜 top3 → 拼 prompt → 调智谱 AI chat → 返回
```

### 业务服务层 — PrescriptionService

通过构造器注入 4 个依赖：

| 依赖                 | 来源                 | 作用               |
| -------------------- | -------------------- | ------------------ |
| `MilvusUtil`         | 手动编写的 Bean      | 操作 Milvus 增删查 |
| `EmbeddingModel`     | Spring AI 自动创建   | text → 2048 维向量 |
| `ChatClient.Builder` | Spring AI 自动创建   | 调智谱 AI 对话模型 |
| `ObjectMapper`       | Spring Boot 自动配置 | Java 对象 ↔ JSON   |

```java
@Slf4j
@Service
public class PrescriptionService {

    private final MilvusUtil milvusUtil;
    private final EmbeddingModel embeddingModel;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public PrescriptionService(MilvusUtil milvusUtil,
                               EmbeddingModel embeddingModel,
                               ChatClient.Builder chatClientBuilder,
                               ObjectMapper objectMapper) {
        this.milvusUtil = milvusUtil;
        this.embeddingModel = embeddingModel;
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    /** 上传知识库 txt：解析 → 向量化 → 入库 */
    public InsertResult upload(MultipartFile file) {
        // 1. 读取文件
        String text = new BufferedReader(new InputStreamReader(
                file.getInputStream(), StandardCharsets.UTF_8))
                .lines().collect(Collectors.joining("\n"));

        // 2. 按 === 类型 === 格式解析
        List<Map<String, String>> entries = parseKnowledgeText(text);

        // 3. 每条转 JSON → 向量化 → 组装记录
        List<Map<String, Object>> records = new ArrayList<>();
        for (Map<String, String> entry : entries) {
            String content = objectMapper.writeValueAsString(entry);
            float[] vector = embeddingModel.embed(content);
            List<Double> vectorList = new ArrayList<>();
            for (float v : vector) vectorList.add((double) v);

            Map<String, Object> record = new HashMap<>();
            record.put("id", UUID.randomUUID().toString());
            record.put("vector", vectorList);
            record.put("content", content);
            record.put("prescription_type", entry.get("type"));
            records.add(record);
        }

        // 4. 批量插入 Milvus
        milvusUtil.insertData(records);
        return new InsertResult(records.size(), records.size(), 0);
    }

    /** RAG 查询：向量化 → Milvus 搜索 → 拼 prompt → AI 回答 */
    public String query(QueryRequest request) {
        // Step 1: 问题 → 向量
        float[] queryVector = embeddingModel.embed(request.getQuestion());

        // Step 2: 向量 → Milvus 搜 top3
        List<Map<String, Object>> searchResults = milvusUtil.search(queryVector, 3);

        // Step 3: 搜索结果拼成 context
        String context = searchResults.stream()
                .map(r -> (String) r.get("content"))
                .collect(Collectors.joining("\n---\n"));

        // Step 4: 组装 prompt
        String prompt = """
                你是一个中医助手。以下是与用户问题相关的处方知识库内容：
                ---
                %s
                ---
                请根据上述知识库回答用户的用药问题，
                如果知识库中没有相关信息，请如实告知。
                用户问题：%s
                """.formatted(context, request.getQuestion());

        // Step 5: 调智谱 AI 对话模型
        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    /** 解析知识库 txt（=== 分型 === 格式） */
    private List<Map<String, String>> parseKnowledgeText(String text) {
        List<Map<String, String>> entries = new ArrayList<>();
        String[] blocks = text.split("(?m)^=== ");
        for (String block : blocks) {
            if (block.isBlank()) continue;
            String[] lines = block.split("\n");
            Map<String, String> entry = new HashMap<>();
            entry.put("type", lines[0].replace(" ===", "").trim());
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                int colonIdx = line.indexOf("：");
                if (colonIdx == -1) colonIdx = line.indexOf(":");
                if (colonIdx > 0) {
                    entry.put(line.substring(0, colonIdx).trim(),
                              line.substring(colonIdx + 1).trim());
                }
            }
            entries.add(entry);
        }
        return entries;
    }
}
```

### REST 控制器

```java
@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping("/upload")
    public int upload(@RequestParam("file") MultipartFile file) {
        return prescriptionService.upload(file).getSuccessCount();
    }

    @PostMapping("/query")
    public String query(@RequestBody QueryRequest request) {
        return prescriptionService.query(request);
    }
}
```

### 知识库文件格式

创建 `感冒知识库.txt`，严格按以下格式：

```
=== 风寒束表感冒 ===
分型：风寒束表感冒
典型症状：恶寒重、发热轻、无汗、头身酸痛、鼻塞流清涕、咳嗽吐白稀痰、口不渴
舌脉：舌淡红，苔薄白；脉浮紧
代表方剂：麻黄汤、荆防败毒散
常用中成药：风寒感冒颗粒、荆防颗粒
=== 风热犯表感冒 ===
分型：风热犯表感冒
典型症状：发热重、微恶风、微汗、咽喉红肿疼痛、鼻塞流黄稠涕、咳嗽黄黏痰、口干喜冷饮
舌脉：舌尖红，苔薄黄；脉浮数
代表方剂：银翘散
常用中成药：银翘解毒片、连花清瘟胶囊
```

格式要点：

- `===` 前后各有一个空格
- 每行用中文冒号 `：` 分隔字段名和值
- 不同条目之间用空行分隔

### 运行测试

```bash

# 上传知识库
curl -X POST -F "file=@感冒知识库.txt" \
  http://localhost:8080/api/prescriptions/upload

# RAG 查询
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"怕冷无汗吃什么药"}' \
  http://localhost:8080/api/prescriptions/query
```

插入数据成功：

![Milvus 插入数据](/images/ai/spring-ai/milvus-insert.png)

RAG 查询结果：

![Milvus RAG 查询](/images/ai/spring-ai/milvus-query.png)

## 知识点总结

| 概念                           | 说明                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| **向量（Vector）**             | 文本被 AI 模型转成的一串数字（如 2048 维），语义相近的文本向量也相近                            |
| **Embedding**                  | 文本 → 向量的过程，本项目用智谱 AI `embedding-3` 模型                                           |
| **Milvus**                     | 向量数据库，存向量并做相似度搜索，类比 MySQL 存表格数据                                         |
| **Milvus Collection**          | 类似 MySQL 的表，含 id/vector/content 等字段                                                    |
| **RAG**                        | 先检索后生成：搜知识库 → 拼 prompt → AI 回答，解决 AI 不知道私有知识的问题                      |
| **`@PostConstruct`**           | Spring 生命周期回调，构造器执行完后自动调用，适合做初始化                                       |
| **`@ConfigurationProperties`** | 读取 yml 配置自动赋值到字段，prefix 指定前缀                                                    |
| **`EmbeddingModel`**           | Spring AI 抽象，智谱 AI starter 自动创建 Bean，调用 `embed(text)` 转向量                        |
| **`ChatClient`**               | Spring AI 抽象，智谱 AI starter 自动创建 Builder，`prompt().user().call().content()` 调对话模型 |
| **Milvus SDK v3**              | 连接用 `ConnectConfig.builder().uri()`, 搜索用 `MilvusClientV2.search()`                        |

## 常见问题

### 连接不到 Milvus

确保 Milvus 已启动，`docker ps` 查看容器状态。

### dimension mismatch

Milvus 集合维度和 embedding 模型输出维度不一致。检查 `milvus.dimension` 是否和模型匹配（embedding-3 默认 2048）。

### 重建集合

在 Attu 管理界面或命令行删除集合后重启应用即可重建。

### API Key

打开 [智谱 AI 开放平台](https://open.bigmodel.cn)，登录后左侧菜单创建 API Key，填入 `application.yml`。

## 参考文档

- [智谱 AI 开放平台](https://open.bigmodel.cn)
- [Milvus 官方文档](https://milvus.io/docs)
- [Spring AI 官方文档](https://docs.spring.io/spring-ai/reference/)
