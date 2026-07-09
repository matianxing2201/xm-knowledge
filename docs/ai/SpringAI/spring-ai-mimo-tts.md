---
title: Spring AI + MiMo TTS 语言生成
date: 2026-07-07
tags:
  - Spring AI
  - MiMo
  - TTS
---

# Spring AI + MiMo TTS 语言生成

## 1. 整体流程

```flow
GET /tts?text=...
       ↓
  TtsController
       ↓
  TtsService (RestClient POST)
       ↓
  小米 MiMo TTS API
       ↓
  返回 base64 WAV
       ↓
  拼装 HTML → 嵌入 data:audio/wav;base64,...
       ↓
  浏览器显示 <audio> 播放器
```

---

## 2. 项目初始化

### pom.xml 依赖

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.1.0</version>               <!-- Spring Boot 4.1 (JDK 21) -->
</parent>

<dependencies>
    <!-- 核心: Web 启动器 (包含内嵌 Tomcat + Jackson + RestClient 等) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- 测试: JUnit 5 + Mockito + AssertJ + MockMvc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <!-- @WebMvcTest 需要 (Spring Boot 4.1 新增模块) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-webmvc-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

> ==`spring-boot-starter-web` 一站式包含 Tomcat + Spring MVC + Jackson + RestClient。==

---

## 2. 配置文件 (application.yaml)

```yaml
xiaomi:
  tts:
    api-key: "${MIMO_API_KEY:}" # ==运行时通过环境变量传入==
    url: https://api.xiaomimimo.com/v1/chat/completions
    voice: 冰糖 # 发音人 (冰糖/茉莉/苏打/白桦 等)
```

> ==`${MIMO_API_KEY:}` — 冒号后为空表示"没设置环境变量时默认空字符串"，防止启动失败。==

---

## 3. 核心服务 — TtsService

```java
@Service
public class TtsService {

    private final RestClient restClient;
    private final String voice;

    public TtsService(
            @Value("${xiaomi.tts.api-key}") String apiKey,
            @Value("${xiaomi.tts.url}") String url,
            @Value("${xiaomi.tts.voice}") String voice) {

        // ==RestClient.builder() 手动构建，不依赖 Spring 自动配置==
        // 因为要自定义 baseUrl 和 api-key 请求头
        this.restClient = RestClient.builder()
                .baseUrl(url)
                .defaultHeader("api-key", apiKey)         // ==Xiaomi API 认证头==
                .defaultHeader("Content-Type", "application/json")
                .build();
        this.voice = voice;
    }

    public String synthesize(String text) {
        // ==Record 对象 → Jackson 自动序列化为 JSON==
        var request = new TtsRequest("mimo-v2.5-tts",
                List.of(new ReqMessage("assistant", text)),
                new AudioConfig("wav", voice));

        // ==RestClient 自动执行 POST + 序列化请求体 + 反序列化响应==
        var response = restClient.post()
                .body(request)                // 自动写 JSON
                .retrieve()
                .body(TtsResponse.class);     // 自动读 JSON → Record

        // ==链式取值: choices[0].message.audio.data==
        return response.choices().get(0).message().audio().data();
    }

    // --- 请求 DTO ---
    record TtsRequest(String model, List<ReqMessage> messages, AudioConfig audio) {}
    record ReqMessage(String role, String content) {}
    record AudioConfig(String format, String voice) {}

    // --- 响应 DTO ---
    // { "choices": [ { "message": { "audio": { "data": "base64..." } } } ] }
    record TtsResponse(List<Choice> choices) {}
    record Choice(RespMessage message) {}
    record RespMessage(Audio audio) {}
    record Audio(String data) {}
}
```

> ==**Record 是 Java 16+ 的紧凑类**，自动生成构造器、getter、equals、hashCode。做 DTO 最简洁。==
>
> **RestClient** 是 Spring 6.1+ 引入的新 HTTP 客户端，替代老旧的 `RestTemplate`。链式调用风格简洁清晰。

---

## 4. 表现层 — TtsController

```java
@Controller                                          // ==注意不是 @RestController==
public class TtsController {

    private final TtsService ttsService;

    public TtsController(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    @GetMapping(value = "/tts", produces = "text/html")  // 指定返回 HTML
    @ResponseBody                                        // 直接返回字符串 (不经过视图解析器)
    public String tts(@RequestParam(defaultValue = "") String text) {
        // ==空文本 → 显示输入表单==
        if (text.isBlank()) {
            return """
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head><meta charset="UTF-8"><title>TTS 演示</title></head>
                <body>
                  <h2>TTS 文字转语音</h2>
                  <form>
                    输入文字：<input name="text" size="40">
                    <button type="submit">合成语音</button>
                  </form>
                </body>
                </html>
                """;
        }

        try {
            // ==调用服务层，得到 base64 音频==
            String audioBase64 = ttsService.synthesize(text);
            String escapedText = HtmlUtils.htmlEscape(text);  // 防 XSS

            // ==嵌入 data URL: 浏览器直接播放，无需额外请求==
            return String.format("""
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head><meta charset="UTF-8"><title>TTS 结果</title></head>
                <body>
                  <p>原文：%s</p>
                  <audio src="data:audio/wav;base64,%s" controls autoplay></audio>
                  <p><a href="/tts">返回</a></p>
                </body>
                </html>
                """, escapedText, audioBase64);

        } catch (Exception e) {
            // ==异常时显示友好的错误页面==
            String escapedMessage = HtmlUtils.htmlEscape(e.getMessage());
            return String.format("""
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head><meta charset="UTF-8"><title>TTS 错误</title></head>
                <body>
                  <p style="color:red">TTS 服务调用失败：%s</p>
                  <a href="/tts">返回</a>
                </body>
                </html>
                """, escapedMessage);
        }
    }
}
```

> ==`@Controller` + `@ResponseBody` = 返回纯字符串（这里是 HTML），不经过模板引擎。==
> 如果用 `@RestController` 效果一样，但语义上 `@Controller` 更准确（返回的是视图内容，不是 JSON 数据）。
>
> `<audio src="data:audio/wav;base64,...">` — **data URL** 将音频数据直接嵌入 HTML，无需额外的音频文件请求。适合小段音频的场景。

---

## 5. 知识点总结

| 知识点                          | 说明                                   |
| ------------------------------- | -------------------------------------- |
| `@Controller` + `@ResponseBody` | 返回纯文本（HTML），不经过视图解析器   |
| `RestClient`                    | Spring 6.1+ 的新 HTTP 客户端，链式风格 |
| Java `record`                   | Java 16+ 紧凑类，做 DTO 最简洁         |
| `data:audio/wav;base64,...`     | Data URL 将音频嵌入 HTML，无需额外请求 |
| `${MIMO_API_KEY:}`              | 环境变量占位符，冒号后为默认值         |
| `produces = "text/html"`        | 指定端点返回的内容类型                 |

---

## 6. 小米 MiMo TTS API 格式

```
POST https://api.xiaomimimo.com/v1/chat/completions
Header: api-key: <你的Key>
Body:
{
  "model": "mimo-v2.5-tts",
  "messages": [{"role": "assistant", "content": "你好世界"}],
  "audio": {"format": "wav", "voice": "冰糖"}
}

Response:
{
  "choices": [{
    "message": {
      "audio": { "data": "base64编码的WAV音频..." }
    }
  }]
}
```

> API 兼容 OpenAI Chat Completions 格式，所以用 `model`、`messages`、`choices` 这些字段。
> 支持 8 个预设发音人：冰糖(女) / 茉莉(女) / 苏打(男) / 白桦(男) / Mia / Chloe / Milo / Dean。
