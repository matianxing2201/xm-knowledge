---
title: Spring AI + 智谱文生图与视频
date: 2026-07-09
tags:
  - Spring AI
  - 智谱
  - 文生图
  - 文生视频
---

# Spring AI + 智谱文生图与视频

> 基于 Spring Boot 3.5.16 + Spring AI 1.1.2 + 智谱 Cogview-3-Flash / CogVideoX-Flash

## 1. 整体流程

系统分为图片生成和视频生成两条链路：

**文生图流程（同步）：**
```flow
POST /api/image/generate
       ↓
  ImageController
       ↓
  ImageService (Spring AI ImageModel)
       ↓
  智谱 Cogview-3-Flash API
       ↓
  返回图片临时 URL
```

**文生视频流程（异步）：**
```flow
① POST /api/video/generate
       ↓
  VideoController → VideoService
       ↓
  智谱 CogVideoX-Flash API
       ↓
  返回 taskId

② GET /api/video/result?taskId=xxx
       ↓
  VideoController → VideoService 查询结果
       ↓
  返回视频 URL / 完成状态
```

## 2. 项目初始化

### 依赖配置 — pom.xml

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.16</version>
    <relativePath/>
</parent>

<properties>
    <java.version>21</java.version>
    <spring-ai.version>1.1.2</spring-ai.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>${spring-ai.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Spring AI 智谱 Starter：自动配置 ZhiPuAiImageModel、ChatClient.Builder -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-model-zhipuai</artifactId>
    </dependency>
</dependencies>
```

`spring-ai-starter-model-zhipuai` 会自动配置 `ZhiPuAiImageModel` 和 `ChatClient.Builder`。

### 项目结构

```
Image_generate/
├── pom.xml
└── src/main/java/org/pony/image_generate/
    ├── ImageGenerateApplication.java
    ├── controller/
    │   ├── ImageController.java        ← 图片分析 / 文生图
    │   └── VideoController.java        ← 文生视频 / 查询结果
    ├── service/
    │   ├── ImageService.java           ← 调用 Spring AI ImageModel
    │   └── VideoService.java           ← 直接调用智谱 REST API
    └── dto/
        ├── GenerateImageRequest.java     ← 文生图请求体
        ├── GenerateVideoRequest.java     ← 文生视频请求体
        └── QueryVideoResultResponse.java ← 视频结果查询响应
```

## 3. 配置文件 — application.yaml

```yaml
spring:
  ai:
    model:
      image: zhipuai # 启用智谱作为图像模型提供方（默认是 stabilityai）
    zhipuai:
      api-key: ${ZHIPUAI_API_KEY} # 从环境变量读取，不要写死
      image:
        options:
          model: cogview-3-flash # 文生图模型。可选：cogview-3-flash(免费) / cogview-4 / glm-image
```

> `${ZHIPUAI_API_KEY}` — 通过环境变量设置 API Key，不要写死在配置里。

## 4. 核心服务层

### 文生图 — ImageService

```java
@Service
public class ImageService {

    private final ImageModel imageModel;

    public ImageService(ImageModel imageModel) {
        this.imageModel = imageModel;
    }

    /**
     * 文字生成图片
     * @param description 图片提示词，如"一只戴着墨镜的橘猫"
     * @param width  图片宽，如 1024
     * @param height 图片高，如 1024
     * @return 图片临时 URL（有效期 30 天）
     */
    public String generateImage(String description, int width, int height) {
        ImagePrompt prompt = new ImagePrompt(
                description,
                ImageOptionsBuilder.builder().width(width).height(height).build()
        );
        ImageResponse response = imageModel.call(prompt);
        return response.getResult().getOutput().getUrl();
    }
}
```

> `imageModel` 由 Spring AI 自动注入为 `ZhiPuAiImageModel`，`.call()` 是同步调用。

### 文生视频 — VideoService

Spring AI 没有视频抽象，直接调用智谱 REST API。

```java
@Service
public class VideoService {

    private final RestClient restClient;

    public VideoService(RestClient.Builder builder,
                        @Value("${spring.ai.zhipuai.api-key}") String apiKey) {
        this.restClient = builder
                .baseUrl("https://open.bigmodel.cn/api/paas/v4")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    // ========== 内部 DTO ==========

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    static class ZhipuVideoCreateRequest {
        private String model;    // 固定 "cogvideox-flash"
        private String prompt;   // 视频描述，最多 512 字符
        private String size;     // 分辨率，如 "1920x1080"
        private int fps;         // 帧率，30 或 60
        private String quality;  // "speed" 或 "quality"
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    static class ZhipuVideoCreateResponse {
        private String id;       // 任务 ID
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    static class ZhipuAsyncResultResponse {
        @JsonProperty("task_status")
        private String taskStatus;           // PROCESSING / SUCCESS / FAIL
        @JsonProperty("video_result")
        private List<ZhipuVideoItem> videoResult;
    }

    @Data
    static class ZhipuVideoItem {
        private String url;  // 视频临时链接
    }

    /** 公开返回值 */
    @Data
    public static class QueryVideoResult {
        private String taskId;
        private String videoUrl;
        private boolean finished;
    }

    // ========== 核心方法 ==========

    /** 创建视频生成任务，返回 taskId */
    public String generateVideo(String prompt, String size, int fps) {
        ZhipuVideoCreateRequest req = new ZhipuVideoCreateRequest();
        req.setModel("cogvideox-flash");
        req.setPrompt(prompt);
        req.setSize(size);
        req.setFps(fps);
        req.setQuality("speed");

        ZhipuVideoCreateResponse resp = restClient.post()
                .uri("/videos/generations")
                .body(req)
                .retrieve()
                .body(ZhipuVideoCreateResponse.class);
        return resp.getId();
    }



    /** 查询视频生成结果 */
    public QueryVideoResult queryVideoResult(String taskId) {
        ZhipuAsyncResultResponse resp = restClient.get()
                .uri("/async-result/{taskId}", taskId)
                .retrieve()
                .body(ZhipuAsyncResultResponse.class);

        QueryVideoResult result = new QueryVideoResult();
        result.setTaskId(taskId);
        result.setFinished(false);
        if (resp != null && "SUCCESS".equalsIgnoreCase(resp.getTaskStatus())) {
            result.setFinished(true);
            result.setVideoUrl(resp.getVideoResult().get(0).getUrl());
        }
        return result;
    }



}
```

![执行生成视频 返回的taskId](/images/ai/spring-ai/text-to-video-image1.png)
![根据 taskId 查询返回的视频结果](/images/ai/spring-ai/text-to-video-image2.png)

> **注意：** `QueryVideoResult` 定义为 `public static class`，VideoService 内部 DTO 为 `static class` + `@Data` + `@JsonIgnoreProperties(ignoreUnknown=true)`，防止智谱新增字段时序列化报错。

## 5. 控制服务层

### 请求体 DTO

**GenerateImageRequest：**

```java
@Data
public class GenerateImageRequest {
    private String description;  // 必填。图片提示词
    private String size = "1024x1024";  // 可选，默认 1024x1024
    private String quality = "standard";  // 可选，"standard" 或 "hd"

    public void setDescription(String description) {
        if (description == null || description.isBlank())
            throw new IllegalArgumentException("description must not be blank");
        this.description = description;
    }
    public void setSize(String size) {
        this.size = (size == null || !size.contains("x")) ? "1024x1024" : size;
    }
    public void setQuality(String quality) {
        this.quality = (quality == null || quality.isBlank()) ? "standard" : quality;
    }
}
```

> Cogview-3-Flash 支持尺寸：1024x1024（默认）、768x1344、864x1152、1344x768、1152x864、1440x720、720x1440

**GenerateVideoRequest：**

```java
@Data
public class GenerateVideoRequest {
    private String prompt;  // 必填。视频提示词，最多 512 字符
    private String size = "1920x1080";  // 可选，默认 1920x1080
    private Integer fps = 30;  // 可选，30 或 60
}
```

> CogVideoX-Flash 支持分辨率：720x480、1024x1024、1280x960、960x1280、1920x1080、1080x1920、2048x1080、3840x2160

### ImageController

```java
@RestController
@RequestMapping("/api/image")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping("/generate")
    public ResponseEntity<String> generateImage(@RequestBody GenerateImageRequest request) {
        String[] parts = request.getSize().split("x");
        String imageUrl = imageService.generateImage(
                request.getDescription(),
                Integer.parseInt(parts[0]),
                Integer.parseInt(parts[1]));
        return ResponseEntity.ok(imageUrl);
    }
}
```

### VideoController

```java
@RestController
@RequestMapping("/api/video")
public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    /** 创建视频生成任务，返回 taskId */
    @PostMapping("/generate")
    public ResponseEntity<String> generateVideo(@RequestBody GenerateVideoRequest request) {
        String taskId = videoService.generateVideo(
                request.getPrompt(), request.getSize(), request.getFps());
        return ResponseEntity.ok(taskId);
    }

    /** 查询视频生成结果 */
    @GetMapping("/result")
    public ResponseEntity<QueryVideoResultResponse> queryVideoResult(
            @RequestParam("taskId") String taskId) {
        QueryVideoResult result = videoService.queryVideoResult(taskId);
        QueryVideoResultResponse resp = new QueryVideoResultResponse();
        resp.setTaskId(result.getTaskId());
        resp.setVideoUrl(result.getVideoUrl() == null ? "" : result.getVideoUrl());
        resp.setFinished(result.isFinished());
        return ResponseEntity.ok(resp);
    }
}
```

## 6. 知识点总结

### REST 接口一览

| 方法   | 路径                        | 请求                                              | 响应                               |
| ------ | --------------------------- | ------------------------------------------------- | ---------------------------------- |
| `POST` | `/api/image/generate`       | `{"description":"提示词","size":"1024x1024"}`     | `"图片URL"`                        |
| `POST` | `/api/video/generate`       | `{"prompt":"提示词","size":"1920x1080","fps":30}` | `"taskId"`                         |
| `GET`  | `/api/video/result?taskId=` | query 参数                                        | `{"taskId","videoUrl","finished"}` |

### 模型对比

| 模型                | 类型     | 能力             | 是否免费 |
| ------------------- | -------- | ---------------- | -------- |
| **Cogview-3-Flash** | 图像生成 | 文字 → 图片      | 是       |
| **CogVideoX-Flash** | 视频生成 | 文字/图片 → 视频 | 是       |

### 智谱异步结果 API 响应结构

```
GET /paas/v4/async-result/{id}

返回 oneOf 三种结构：
├─ ChatCompletionResponse          ← 对话补全的异步结果
│   ├─ choices[] / usage / ...
│   └─ video_result[]              ← 也有 video_result，但没有 task_status
│
├─ AsyncVideoGenerationResponse    ← 视频生成的异步结果（本 demo 走这条）
│   ├─ task_status: PROCESSING / SUCCESS / FAIL
│   └─ video_result[]: [{ url, cover_image_url }]
│
└─ AsyncImageGenerationResponse    ← 图片生成的异步结果
    ├─ task_status
    └─ image_result[]: [{ url }]
```

判断完成逻辑：先看 `task_status` 是否为 `SUCCESS`，再取 `video_result[0].url`。

![调用智谱 API 返回的 taskId](/images/ai/spring-ai/text-to-video-image1.png)
![根据 taskId 查询返回的视频结果](/images/ai/spring-ai/text-to-video-image2.png)

### 注意事项

1. **链接有效期**：智谱生成的图片/视频 URL 有效期 30 天，生产环境请转存到自己的 OSS/S3。
2. **视频异步**：通常需要几十秒到几分钟，前端需轮询 `/api/video/result`，建议每 5-10 秒一次。
3. **免费额度**：Cogview-3-Flash 和 CogVideoX-Flash 都是免费模型，但有速率限制，可在智谱控制台查看。
4. **Content-Type**：POST 请求必须加 `Content-Type: application/json`，否则 Spring 返回 400。
5. **API Key**：通过环境变量 `ZHIPUAI_API_KEY` 设置，不要写死在配置文件或代码里。
6. **405 错误**：`/result` 是 GET 接口，不要用 POST 请求。

## 7. 参考文档

- [智谱图像生成 API](https://docs.bigmodel.cn/api-reference/模型-api/图像生成.md)
- [智谱视频生成 API（异步）](https://docs.bigmodel.cn/api-reference/模型-api/视频生成异步.md)
- [智谱异步结果查询 API](https://docs.bigmodel.cn/api-reference/模型-api/查询异步结果.md)
- [智谱 Cogview-3-Flash 模型](https://docs.bigmodel.cn/cn/guide/models/free/cogview-3-flash.md)
- [智谱 CogVideoX-Flash 模型](https://docs.bigmodel.cn/cn/guide/models/free/cogvideox-flash.md)
- [Spring AI ZhiPuAI Image Generation](https://docs.spring.io/spring-ai/reference/1.1/api/image/zhipuai-image.html)
