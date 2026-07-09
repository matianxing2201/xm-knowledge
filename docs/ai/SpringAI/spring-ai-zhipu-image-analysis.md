---
title: Spring AI + 智谱多模态图片分析
date: 2026-07-06
tags:
  - Spring AI
  - 智谱
  - 多模态
---

# Spring AI + 智谱多模态图片分析

## 1. 项目初始化

使用 [Spring Initializr](https://start.spring.io) 创建项目：

| 配置        | 值                            |
| ----------- | ----------------------------- |
| Spring Boot | 3.5.16                        |
| Java        | 21                            |
| 依赖        | Spring Web, Spring AI ZhiPuAI |

## 2. 依赖配置 — pom.xml

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
    <artifactId>Image_generate</artifactId>
    <version>0.0.1-SNAPSHOT</version>
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
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <!-- Spring AI 智谱多模态 -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-starter-model-zhipuai</artifactId>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>

```

**关键说明：**

- `spring-ai-bom` 统一管理 Spring AI 各模块版本
- `spring-ai-starter-model-zhipuai` 会自动配置 `ZhiPuAiChatModel` 和 `ChatClient.Builder`

## 3. 智谱配置 — application.yaml

`src/main/resources/application.yaml`

```yaml
spring:
  application:
    name: Image_generate
  ai:
    zhipuai:
      api-key: ${ZHIPUAI_API_KEY}
      chat:
        options:
          model: glm-4.6v-flash # 多模态视觉模型
      image:
        options:
          model: cogview-3-flash # 图片生成模型
```

## 4. ImageService — 核心服务层

`src/main/java/org/pony/image_generate/service/ImageService.java`

```java
package org.pony.image_generate.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import reactor.core.publisher.Flux;

import java.net.MalformedURLException;
import java.net.URL;

@Service
public class ImageService {

    private final ChatClient chatClient;

    public ImageService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public Flux<String> analyseImage(String question, String imageUrl) {
        try {
            URL url = new URL(imageUrl);
            return chatClient.prompt()
                    .user(u -> u
                            .text(question)
                            .media(MimeTypeUtils.IMAGE_JPEG, url))
                    .stream()
                    .content();
        } catch (MalformedURLException e) {
            return Flux.error(new IllegalArgumentException("Invalid image URL: " + imageUrl, e));
        }
    }
}
```

**核心要点：**

| 代码                                    | 说明                                  |
| --------------------------------------- | ------------------------------------- |
| `ChatClient.Builder`                    | Spring AI 自动注入的原型 Bean         |
| `.stream().content()`                   | 返回 `Flux<String>`，实现流式响应     |
| `.media(MimeTypeUtils.IMAGE_JPEG, url)` | 将在线图片 URL 作为多模态输入传给模型 |
| `Flux.error(...)`                       | URL 非法时返回错误流                  |

**流式 vs 非流式对比：**

```java
// 非流式（一次性返回）
String result = chatClient.prompt().user(text).call().content();

// 流式（逐字推送）
Flux<String> result = chatClient.prompt().user(text).stream().content();
```

---

## 5. ImageController — REST 控制器

`src/main/java/org/pony/image_generate/controller/ImageController.java`

```java
package org.pony.image_generate.controller;

import org.pony.image_generate.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/image")
public class ImageController {

    @Autowired
    private ImageService imageService;

    @GetMapping(value = "/analyze", produces = "text/event-stream;charset=UTF-8")
    public Flux<String> analyze(
            @RequestParam(value = "prompt", defaultValue = "") String prompt,
            @RequestParam(value = "imageUrl") String imageUrl,
            HttpServletResponse response
    ) {
        response.setContentType("text/event-stream;charset=UTF-8");
        return imageService.analyseImage(prompt, imageUrl);
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateDecoration(
            @RequestParam("description") String description) {
        String imageUrl = imageService.generateDecoration(description);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
}
```

**关键说明：**

- 返回 `Flux<String>` — Spring MVC 自动以 SSE 格式流式输出
- `response.setContentType("text/event-stream;charset=UTF-8");` 注意 这里要设置相应头的字符格式 要不然就会显示乱码

---

## 6. 启动与测试

### 启动项目

### 测试图片分析

```bash
# 用一张舌苔图片测试中医辨证
curl -N "http://localhost:8080/api/image/analyze?imageUrl=https://pic.rmb.bdstatic.com/bjh/250911/dump/d9943bc60791af9b3df1352bdf888c69.jpeg&prompt=帮我看看什么情况 可以用什么中药方剂进行调理"
```

### 前端接入示例（HTML + EventSource）

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="output"></div>
    <script>
      const es = new EventSource(
        "/api/image/analyze?imageUrl=...&prompt=描述这张图片",
      );
      es.onmessage = (e) => {
        document.getElementById("output").textContent += e.data;
      };
      es.onerror = () => es.close();
    </script>
  </body>
</html>
```

<img src="https://cdn.nlark.com/yuque/0/2026/png/12961835/1783326054766-abb227ff-180c-49f9-a655-b4c085d34630.png" width="1920" title="" crop="0,0,1,1" id="u721cacaa" class="ne-image">

## 7. 参考文档

- [Spring AI 官方文档](https://docs.spring.io/spring-ai/reference/1.1/)
- [Spring AI ChatClient API](https://docs.spring.io/spring-ai/reference/1.1/api/chatclient.html)
- [Spring AI 多模态支持](https://docs.spring.io/spring-ai/reference/1.1/api/multimodality.html)
- [Spring AI 智谱 Chat](https://docs.spring.io/spring-ai/reference/1.1/api/chat/zhipuai-chat.html)
- [智谱开放平台](https://open.bigmodel.cn/)
