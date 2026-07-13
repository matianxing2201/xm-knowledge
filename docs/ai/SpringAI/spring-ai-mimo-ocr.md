---
title: Spring AI + 小米 MiMo OCR 图片识别
date: 2026-07-09
tags:
  - Spring AI
  - 小米
  - MiMo
  - OCR
---

# Spring AI + 小米 MiMo OCR 图片识别

> 基于 Spring Boot 3.5.16 + 小米 MiMo `mimo-v2.5` 多模态模型
> API 兼容 OpenAI 格式，无需额外 SDK

## 1. 整体流程

```flow
POST /api/ocr/recognize
       ↓
  MimoOcrController
       ↓
  MimoOcrService (RestClient POST)
       ↓
  小米 MiMo chat/completions API (mimo-v2.5)
       ↓
  返回识别文字
```

---

## 2. MiMo 平台介绍

小米 MiMo 是小米公司的 AI 开放平台，提供多模态理解、语音识别/合成、文本生成等能力。

**OCR 相关模型：**

| 模型            | 能力                                       | 本 demo 是否使用 |
| --------------- | ------------------------------------------ | ---------------- |
| `mimo-v2.5`     | 图片理解（含文字识别）、音频理解、视频理解 | ✅               |
| `mimo-v2.5-pro` | 纯文本生成、深度思考（不支持多模态）       | ❌               |

> `mimo-v2.5` 是唯一支持图片理解的模型。通过向模型发送图片 URL + 识别指令，即可实现 OCR。

**API 信息：**

| 项目         | 值                                    |
| ------------ | ------------------------------------- |
| Base URL     | `https://api.xiaomimimo.com/v1`       |
| 认证方式     | `api-key` 请求头（不是 Bearer token） |
| 模型         | `mimo-v2.5`                           |
| 接口格式     | OpenAI `chat/completions` 兼容        |
| 图片格式     | JPEG、PNG、GIF、WebP、BMP             |
| 单张图片限制 | ≤ 50MB                                |
| 图片传入方式 | 公网 URL 或 Base64                    |
| 价格         | 按 Token 计费                         |

---

## 3. 项目初始化

### 依赖配置 — pom.xml

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.16</version>
    <relativePath/>
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

MiMo API 兼容 OpenAI 格式，直接用 `RestClient` 调用，无需 Spring AI Starter 或额外 SDK。

### 项目结构

```
image_generate/
├── pom.xml
└── src/main/java/org/pony/image_generate/
    ├── controller/
    │   └── MimoOcrController.java    ← REST 端点
    ├── service/
    │   └── MimoOcrService.java       ← 核心 OCR 逻辑
    └── dto/
        ├── MimoOcrRequest.java       ← 请求体
        └── MimoOcrResponse.java      ← 响应体
```

---

## 4. 配置 — application.yaml

```yaml
mimo:
  api-key: ${MIMO_API_KEY}
```

启动前设置环境变量：

```bash
export MIMO_API_KEY=你的小米MiMo_API_KEY
```

> `${MIMO_API_KEY}` — 通过环境变量设置 API Key，不要写死在配置里。

---

## 5. 请求/响应 DTO

### MimoOcrRequest

```java
package org.pony.image_generate.dto;

import lombok.Data;

@Data
public class MimoOcrRequest {

    /*
     * imageUrl : 必填。需要 OCR 识别的图片公网 URL
     *            支持 JPEG、PNG、GIF、WebP、BMP 格式，单张 ≤ 50MB
     */
    private String imageUrl;

    /*
     * prompt : 可选，默认 "请识别图中所有文字内容并原样返回"
     *          可以自定义识别指令，如：
     *          - "提取图中的表格数据，用 markdown 格式输出"
     *          - "识别发票上的金额、日期、发票号码"
     */
    private String prompt;
}
```

### MimoOcrResponse

```java
package org.pony.image_generate.dto;

import lombok.Data;

@Data
public class MimoOcrResponse {

    /* text : OCR 识别结果文本 */
    private String text;

    /* imageUrl : 请求中的原始图片 URL，供回显使用 */
    private String imageUrl;
}
```

---

## 6. 核心服务 — MimoOcrService

```java
package org.pony.image_generate.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * MiMo OCR 服务
 *
 * 调用小米 MiMo 的 mimo-v2.5 多模态模型进行图片文字识别。
 * API 兼容 OpenAI 格式，通过 chat/completions 接口传入图片 URL，让模型识别文字。
 *
 * API 地址：POST https://api.xiaomimimo.com/v1/chat/completions
 * 认证方式：api-key 请求头
 * 模型：mimo-v2.5（唯一支持多模态理解的模型）
 * 图片限制：单张 ≤ 50MB，支持 JPEG/PNG/GIF/WebP/BMP
 */
@Service
public class MimoOcrService {

    private static final String BASE_URL = "https://api.xiaomimimo.com/v1";
    private static final String MODEL = "mimo-v2.5";

    private final RestClient restClient;

    public MimoOcrService(@Value("${mimo.api-key}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader("api-key", apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * 识别图片中的文字
     *
     * @param imageUrl 图片的公网 URL
     * @param prompt   识别指令，如"请识别图中所有文字内容"
     * @return OCR 识别结果文本
     */
    public String recognizeText(String imageUrl, String prompt) {
        MimoChatRequest request = new MimoChatRequest();
        request.setModel(MODEL);
        request.setMaxCompletionTokens(4096);
        request.setMessages(List.of(
                new Message("system", "You are MiMo, an AI assistant developed by Xiaomi."),
                new Message("user", List.of(
                        new Content("image_url", new ImageUrl(imageUrl)),
                        new Content("text", prompt)
                ))
        ));

        MimoChatResponse response = restClient.post()
                .uri("/chat/completions")
                .body(request)
                .retrieve()
                .body(MimoChatResponse.class);

        if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
            throw new RuntimeException("MiMo OCR 识别失败，响应为空");
        }

        return response.getChoices().get(0).getMessage().getContent();
    }

    // ========== 内部 DTO：MiMo API 请求/响应结构 ==========

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class MimoChatRequest {
        private String model;
        private List<Message> messages;
        @JsonProperty("max_completion_tokens")
        private int maxCompletionTokens;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Message {
        private String role;
        private Object content;

        Message() {}

        Message(String role, String content) {
            this.role = role;
            this.content = content;
        }

        Message(String role, List<Content> content) {
            this.role = role;
            this.content = content;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Content {
        private String type;
        @JsonProperty("image_url")
        private ImageUrl imageUrl;
        private String text;

        Content() {}

        Content(String type, ImageUrl imageUrl) {
            this.type = type;
            this.imageUrl = imageUrl;
        }

        Content(String type, String text) {
            this.type = type;
            this.text = text;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ImageUrl {
        private String url;

        ImageUrl() {}

        ImageUrl(String url) {
            this.url = url;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class MimoChatResponse {
        private List<Choice> choices;

        @Data
        static class Choice {
            private ChoiceMessage message;

            @Data
            static class ChoiceMessage {
                private String content;
            }
        }
    }
}
```

### 关键设计说明

| 设计选择                                           | 原因                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `static class` + `@Data` + `@JsonIgnoreProperties` | 封装性好，`static class` 默认包可见；容错，防止 MiMo 新增字段时序列化报错；`@JsonProperty` 处理命名映射 |
| 不用 `Map<String, Object>` 拼 JSON                 | 类型安全（字段类型编译时固定）、可读性（看到类定义就知道结构）、序列化精确控制                          |
| `RestClient` 手动构建                              | 需自定义 baseUrl 和 `api-key` 请求头，不依赖 Spring 自动配置                                            |

---

## 7. 控制器 — MimoOcrController

```java
package org.pony.image_generate.controller;

import org.pony.image_generate.dto.MimoOcrRequest;
import org.pony.image_generate.dto.MimoOcrResponse;
import org.pony.image_generate.service.MimoOcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ocr")
public class MimoOcrController {

    @Autowired
    private MimoOcrService mimoOcrService;

    /**
     * 图片文字识别（OCR）
     *
     * POST /api/ocr/recognize
     *
     * 请求体：
     * { "imageUrl": "https://example.com/invoice.jpg",   ← 必填
     *   "prompt":   "请识别图中所有文字"                     ← 可选 }
     *
     * 响应：
     * { "text": "识别出的文字内容...", "imageUrl": "https://..." }
     *
     * prompt 可以自定义，例如：
     * - "提取图中的表格数据，用 markdown 格式输出"
     * - "识别发票上的金额、日期、发票号码"
     */
    @PostMapping("/recognize")
    public ResponseEntity<MimoOcrResponse> recognize(
            @RequestBody MimoOcrRequest request) {

        String imageUrl = request.getImageUrl();
        String prompt = request.getPrompt();
        if (prompt == null || prompt.isBlank()) {
            prompt = "请识别图中所有文字内容并原样返回";
        }

        String text = mimoOcrService.recognizeText(imageUrl, prompt);

        MimoOcrResponse resp = new MimoOcrResponse();
        resp.setText(text);
        resp.setImageUrl(imageUrl);
        return ResponseEntity.ok(resp);
    }
}
```

---

## 8. 启动 & 测试

### 启动

```bash
export MIMO_API_KEY=你的小米MiMo_API_KEY
./mvnw spring-boot:run
```

### 测试 OCR

```bash
curl -X POST http://localhost:8080/api/ocr/recognize \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://cdn.bigmodel.cn/static/logo/introduction.png",
    "prompt": "识别图中所有文字"
  }'
```

成功时返回：

```json
{
  "text": "识别出的文字内容...",
  "imageUrl": "https://cdn.bigmodel.cn/static/logo/introduction.png"
}
```

![OCR 识别 结果](/images/ai/spring-ai/ocr-1.png)

### 自定义识别指令

```bash
# 提取表格数据
curl -X POST http://localhost:8080/api/ocr/recognize \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/table.png",
    "prompt": "提取图中的表格数据，用 markdown 格式输出"
  }'

# 识别发票信息
curl -X POST http://localhost:8080/api/ocr/recognize \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/invoice.jpg",
    "prompt": "识别发票上的金额、日期、发票号码并返回 JSON"
  }'
```

---

## 9. MiMo API 多模态消息结构详解

OpenAI 兼容格式下的多模态消息体结构：

```
POST https://api.xiaomimimo.com/v1/chat/completions
Headers:
  api-key: sk-xxxxx
  Content-Type: application/json

Body:
{
  "model": "mimo-v2.5",
  "max_completion_tokens": 4096,
  "messages": [
    {
      "role": "system",
      "content": "You are MiMo, an AI assistant developed by Xiaomi."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "https://..."
          }
        },
        {
          "type": "text",
          "text": "请识别图中所有文字"
        }
      ]
    }
  ]
}
```

**图片传入方式对比：**

| 方式        | 适用场景                 | url 格式                             |
| ----------- | ------------------------ | ------------------------------------ |
| 公网 URL    | 图片已在线上             | `https://example.com/image.jpg`      |
| Base64 编码 | 图片在本地，无法公网访问 | `data:image/jpeg;base64,/9j/4AAQ...` |

---

## 10. 知识点总结

| 知识点          | 说明                                                  |
| --------------- | ----------------------------------------------------- |
| MiMo API 认证   | 使用 `api-key` 请求头（不是 `Authorization: Bearer`） |
| `mimo-v2.5`     | MiMo 唯一支持多模态（图片理解）的模型                 |
| OpenAI 兼容格式 | 请求体结构与 OpenAI `chat/completions` 一致           |
| 多模态消息      | `content` 字段可传 `image_url` + `text` 数组          |
| `RestClient`    | Spring 6.1+ 新 HTTP 客户端，链式调用风格              |
| Base64 图片     | `data:image/jpeg;base64,...` 格式，用于本地图片       |
| Token 计费      | 图片按分辨率消耗 Token，见 MiMo 定价页                |
| 429 限流        | 高频请求会触发限流，建议实现重试和退避策略            |

---

## 11. 参考文档

- [小米 MiMo API 首次调用](https://mimo.mi.com/docs/zh-CN/quick-start/summary/first-api-call)
- [小米 MiMo 图片理解/OCR](https://mimo.mi.com/docs/zh-CN/quick-start/usage-guide/multimodal-understanding/image-understanding)
- [小米 MiMo 模型列表](https://mimo.mi.com/docs/zh-CN/quick-start/summary/model)
- [小米 MiMo 定价](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go)
