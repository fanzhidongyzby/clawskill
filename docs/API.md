# OpenClaw 技能平台 API 文档

**版本:** 1.0.0  
**基础URL:** `http://localhost:8000/api`

## 目录

- [认证](#认证)
- [技能管理](#技能管理)
- [用户管理](#用户管理)
- [搜索](#搜索)
- [版本管理](#版本管理)
- [审核管理](#审核管理)

---

## 认证

### 登录

**POST** `/auth/login`

登录系统获取访问令牌。

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应 (200 OK):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user|developer|admin"
  }
}
```

### 登出

**POST** `/auth/logout`

**认证:** Bearer Token

**响应 (200 OK):**
```json
{
  "message": "成功登出"
}
```

### 获取当前用户

**GET** `/auth/me`

**认证:** Bearer Token

**响应 (200 OK):**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user|developer|admin",
  "created_at": "string",
  "last_active": "string"
}
```

### 刷新令牌

**POST** `/auth/refresh`

**认证:** Bearer Token

**响应 (200 OK):**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

---

## 技能管理

### 获取技能列表

**GET** `/skills`

**查询参数:**
- `page` (integer): 页码，默认 1
- `page_size` (integer): 每页数量，默认 20
- `category` (string): 按分类筛选
- `sort_by` (string): 排序方式 (`popular`, `newest`, `downloads`, `rating`)

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "author": "string",
      "version": "string",
      "category": "string",
      "tags": ["string"],
      "rating": "number",
      "downloads": "integer",
      "status": "published|draft|archived",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "total": "integer",
  "page": "integer",
  "page_size": "integer"
}
```

### 获取技能详情

**GET** `/skills/{skill_id}`

**路径参数:**
- `skill_id` (string): 技能 ID

**响应 (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "author": "string",
  "version": "string",
  "category": "string",
  "tags": ["string"],
  "rating": "number",
  "downloads": "integer",
  "status": "published|draft|archived",
  "readme": "string",
  "changelog": "string",
  "created_at": "string",
  "updated_at": "string",
  "versions": [
    {
      "version": "string",
      "created_at": "string",
      "changelog": "string"
    }
  ]
}
```

### 创建技能

**POST** `/skills`

**认证:** Bearer Token

**请求体:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "version": "string",
  "archive": "file"
}
```

**响应 (201 Created):**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "author": "string",
  "version": "string",
  "category": "string",
  "tags": ["string"],
  "status": "pending",
  "created_at": "string"
}
```

### 更新技能

**PUT** `/skills/{skill_id}`

**认证:** Bearer Token

**路径参数:**
- `skill_id` (string): 技能 ID

**请求体:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "version": "string"
}
```

**响应 (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "version": "string",
  "category": "string",
  "tags": ["string"],
  "updated_at": "string"
}
```

### 删除技能

**DELETE** `/skills/{skill_id}`

**认证:** Bearer Token

**路径参数:**
- `skill_id` (string): 技能 ID

**响应 (204 No Content)**

### 获取我的技能

**GET** `/skills/my`

**认证:** Bearer Token

**响应 (200 OK):** 同获取技能列表

---

## 搜索

### 关键词搜索

**GET** `/skills/search`

**查询参数:**
- `q` (string): 搜索关键词
- `category` (string): 按分类筛选
- `limit` (integer): 结果数量限制，默认 20
- `offset` (integer): 结果偏移量，默认 0

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "score": "number"
    }
  ],
  "total": "integer"
}
```

### 语义搜索

**POST** `/skills/semantic-search`

**请求体:**
```json
{
  "query": "string",
  "category": "string",
  "limit": 20,
  "offset": 0
}
```

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "similarity": "number"
    }
  ],
  "total": "integer"
}
```

### 混合搜索

**POST** `/skills/hybrid-search`

**请求体:**
```json
{
  "query": "string",
  "category": "string",
  "limit": 20,
  "offset": 0
}
```

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "score": "number"
    }
  ],
  "total": "integer"
}
```

---

## 版本管理

### 获取技能版本历史

**GET** `/skills/{skill_id}/versions`

**路径参数:**
- `skill_id` (string): 技能 ID

**响应 (200 OK):**
```json
{
  "versions": [
    {
      "version": "string",
      "created_at": "string",
      "changelog": "string",
      "author": "string"
    }
  ]
}
```

### 回滚技能版本

**POST** `/skills/{skill_id}/rollback`

**认证:** Bearer Token

**路径参数:**
- `skill_id` (string): 技能 ID

**请求体:**
```json
{
  "target_version": "string"
}
```

**响应 (200 OK):**
```json
{
  "message": "回滚成功",
  "current_version": "string"
}
```

---

## 审核管理

### 获取待审核技能

**GET** `/admin/skills`

**认证:** Bearer Token (Admin)

**查询参数:**
- `status` (string): 审核状态 (`pending`, `approved`, `rejected`)

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "author": "string",
      "version": "string",
      "description": "string",
      "audit_status": "pending|approved|rejected",
      "submitted_at": "string"
    }
  ],
  "total": "integer"
}
```

### 审核通过技能

**POST** `/admin/skills/{skill_id}/approve`

**认证:** Bearer Token (Admin)

**路径参数:**
- `skill_id` (string): 技能 ID

**响应 (200 OK):**
```json
{
  "message": "审核通过",
  "skill_id": "string"
}
```

### 拒绝技能

**POST** `/admin/skills/{skill_id}/reject`

**认证:** Bearer Token (Admin)

**路径参数:**
- `skill_id` (string): 技能 ID

**请求体:**
```json
{
  "reason": "string"
}
```

**响应 (200 OK):**
```json
{
  "message": "已拒绝",
  "skill_id": "string",
  "reason": "string"
}
```

---

## 用户管理

### 获取用户列表

**GET** `/admin/users`

**认证:** Bearer Token (Admin)

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "user|developer|admin",
      "created_at": "string",
      "last_active": "string"
    }
  ],
  "total": "integer"
}
```

### 更新用户

**PUT** `/admin/users/{user_id}`

**认证:** Bearer Token (Admin)

**路径参数:**
- `user_id` (string): 用户 ID

**请求体:**
```json
{
  "role": "user|developer|admin",
  "email": "string"
}
```

**响应 (200 OK):**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "user|developer|admin"
}
```

### 删除用户

**DELETE** `/admin/users/{user_id}`

**认证:** Bearer Token (Admin)

**路径参数:**
- `user_id` (string): 用户 ID

**响应 (204 No Content)**

### 获取审核日志

**GET** `/admin/audit`

**认证:** Bearer Token (Admin)

**响应 (200 OK):**
```json
{
  "items": [
    {
      "id": "string",
      "action": "string",
      "operator": "string",
      "target": "string",
      "result": "success|failure",
      "ip": "string",
      "timestamp": "string"
    }
  ],
  "total": "integer"
}
```

---

## 错误响应

所有错误响应遵循以下格式：

**400 Bad Request:**
```json
{
  "detail": "错误详情"
}
```

**401 Unauthorized:**
```json
{
  "detail": "未认证"
}
```

**403 Forbidden:**
```json
{
  "detail": "权限不足"
}
```

**404 Not Found:**
```json
{
  "detail": "资源不存在"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "服务器内部错误"
}
```

---

## 数据模型

### Skill (技能)

```typescript
interface Skill {
  id: string
  name: string
  description?: string
  author: string
  version: string
  category: string
  tags?: string[]
  rating?: number
  downloads?: number
  status?: 'published' | 'draft' | 'archived'
  audit_status?: 'pending' | 'approved' | 'rejected'
  readme?: string
  changelog?: string
  created_at: string
  updated_at?: string
}
```

### User (用户)

```typescript
interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'developer' | 'admin'
  created_at: string
  last_active?: string
}
```

### SkillVersion (技能版本)

```typescript
interface SkillVersion {
  version: string
  created_at: string
  changelog?: string
  author: string
}
```

### AuditLog (审核日志)

```typescript
interface AuditLog {
  id: string
  action: string
  operator: string
  target: string
  result: 'success' | 'failure'
  ip: string
  timestamp: string
}
```