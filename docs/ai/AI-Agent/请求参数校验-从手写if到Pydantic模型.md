---
date: 2026-07-29
title: 请求参数校验：从手写 if 到 Pydantic 模型
tags:
  - AI
  - AI Agent
  - Flask
  - Pydantic
---

# 请求参数校验：从手写 if 到 Pydantic 模型

之前每个接口都要手写 6-8 行 `if not data` / `if not isinstance`，啰嗦且容易遗漏。后面用 Pydantic 模型一行搞定，校验失败自动返回标准错误。

## 1. 原来的写法有什么问题

### 一个最简单的校验，要写 6 行

```python
# routes/chat.py —— 改之前
data = request.get_json(silent=True)
if not data:
    return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "..."}}), 400

messages = data.get('messages')
if not messages:
    return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "..."}}), 400

if not isinstance(messages, list):
    return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "..."}}), 400
```

**三个问题：**

| 问题       | 说明                                               |
| ---------- | -------------------------------------------------- |
| 样板代码太多 | 每个参数至少 6 行，10 个参数就 60 行               |
| 格式不统一 | 有人写 `BAD_REQUEST`，有人写 `INVALID_PARAMS`      |
| 类型只停留在 TypeHint | `messages: list` 运行时没人管，传个字符串进来照样崩 |

### 而且每个接口都重复

```
/api/chat 写了一轮
/api/chat/stream 又写一轮，几乎一样
以后加 /api/order、/api/user 还得再写
```

## 2. Pydantic 怎么解决

### Pydantic 是什么

Pydantic 是一个"数据建模 + 运行时校验"的库。你定义一个类，声明每个字段的类型，实例化时自动校验。

```
定义模型：
    class ChatRequest(BaseModel):
        messages: list    ← 声明类型

使用：
    req = ChatRequest(**data)   ← 自动校验，类型不对就抛异常
```

### 项目中的两个模型

```python
# app/utils/schemas.py

class ChatRequest(BaseModel):
    """POST /api/chat 的请求参数"""
    messages: list

    @field_validator('messages')
    @classmethod
    def check_not_empty(cls, v):
        if not v:
            raise ValueError('messages 不能为空')
        return v


class ChatStreamRequest(BaseModel):
    """POST /api/chat/stream 的请求参数"""
    message: str
    session_id: str | None = None   # 可选，不给就后端生成
```

### 路由里怎么用

```python
# 改之前                         # 改之后
data = request.get_json()        data = request.get_json()
if not data:                     if not data:
    return fail(...)                  return fail(...)

messages = data.get('messages')  req = ChatRequest(**data)
if not messages:                 result = mimo_service.chat(req.messages)
    return fail(...)
if not isinstance(messages, list):
    return fail(...)

result = mimo_service.chat(messages)
```

6 行 → 1 行，而且 `ChatRequest(**data)` 这行同时做了三件事：

| 以前手动做的事                   | Pydantic 自动做                    |
| -------------------------------- | ---------------------------------- |
| `messages = data.get('messages')` | `req.messages`                    |
| `if not messages`                | `field_validator('check_not_empty')` |
| `if not isinstance(messages, list)` | `messages: list`                 |

## 3. 全局异常处理器

Pydantic 校验失败会抛 `ValidationError`，Flask 默认返回 HTML 错误页。不能让这个漏出去，得全局捕获并转成 JSON。

```python
# app/__init__.py

from pydantic import ValidationError

@app.errorhandler(ValidationError)
def handle_validation_error(error):
    errors = error.errors()
    first = errors[0] if errors else {}
    message = first.get('msg', '请求参数校验失败')

    details = [
        {
            "field": ".".join(str(x) for x in e.get('loc', [])),
            "message": e.get('msg', ''),
        }
        for e in errors
    ]

    return jsonify({
        "success": False,
        "error": {
            "code": "VALIDATION_ERROR",
            "message": message,
            "details": details,
        }
    }), 422
```

### 异常处理优先级

```
Flask 收到异常 → 寻找最匹配的 errorhandler
                    ↓
  是 AppException？    → handle_app_exception → JSON
  是 ValidationError？ → handle_validation_error → JSON
  其他 Exception？     → handle_500 → JSON
```

所以现在路由层可以这样：

```python
# 校验失败 → 自动被 ValidationError 处理器捕获 → 422 JSON
req = ChatRequest(**data)

# 业务异常 → 自动被 AppException 处理器捕获 → 4xx JSON
raise BadRequestError("xxx")

# 意外异常 → 自动被 500 处理器捕获 → 500 JSON
1 / 0  # ZeroDivisionError
```

### 前端收到的三种错误

| 场景         | HTTP 状态码 | 响应                                                        |
| ------------ | ----------- | ----------------------------------------------------------- |
| 缺少必填参数 | 422         | `{"error": {"code": "VALIDATION_ERROR", "message": "...", "details": [...]}}` |
| 业务逻辑拒绝 | 4xx         | `{"error": {"code": "BAD_REQUEST", "message": "..."}}`     |
| 服务器崩溃   | 500         | `{"error": {"code": "INTERNAL_ERROR", "message": "服务器内部错误"}}` |

## 4. 三种校验场景的写法对比

### 场景 1：简单字段存在性检查

```python
# 手动
message = data.get('message')
if not message or not isinstance(message, str):
    return fail(...)

# Pydantic
class ChatStreamRequest(BaseModel):
    message: str           # 一行搞定：必填 + 必须是字符串
```

### 场景 2：列表非空检查

```python
# 手动
messages = data.get('messages')
if not messages:
    return fail(...)
if not isinstance(messages, list):
    return fail(...)

# Pydantic
class ChatRequest(BaseModel):
    messages: list

    @field_validator('messages')
    @classmethod
    def check_not_empty(cls, v):
        if not v:
            raise ValueError('messages 不能为空')
        return v
```

### 场景 3：可选字段

```python
# 手动
session_id = data.get('session_id')
if not session_id:
    session_id = uuid.uuid4().hex

# Pydantic
class ChatStreamRequest(BaseModel):
    session_id: str | None = None  # 一行搞定

# 使用
session_id = req.session_id or uuid.uuid4().hex
```

## 5. 小结

```
        改之前                                     改之后
  ┌──────────────────────────┐          ┌──────────────────────┐
  │ 6 行 if/return           │          │ 1 行模型实例化        │
  │ jsonify 散落在各处        │    →     │ 全局处理器统一格式    │
  │ 类型只在 TypeHint 上      │          │ 类型同时在运行时生效  │
  │ 每个接口独立重复          │          │ 模型复用              │
  └──────────────────────────┘          └──────────────────────┘
```

1. **Pydantic 把参数校验从"手动 if/return"变成"声明式模型"**——定义字段类型即可，运行时自动校验
2. **全局 `ValidationError` 处理器**统一错误格式，路由层只需一行 `Model(**data)`
3. **三种校验场景**（必填字段、列表非空、可选字段）对比下，Pydantic 的声明式写法始终更短更清晰
4. **异常处理三层级**（ValidationError → AppException → 500）覆盖所有错误，前端统一格式接收