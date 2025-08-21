# 🗃️ **WasteWise 数据库表字段说明文档**

## 📊 **表结构概览**

本数据库采用**无用户表的钱包地址直连设计**，所有业务数据直接关联钱包地址，符合 Web3 去中心化理念。

总共包含**8 个核心表**，支持垃圾分类、积分系统、成就管理、NFT 池管理等功能。

---

## 📋 **1. classifications 表 - 垃圾分类记录**

**表作用**: 存储用户提交的垃圾分类数据及 AI 分析结果

| 字段名                 | 数据类型     | 说明                     | 示例值                               |
| ---------------------- | ------------ | ------------------------ | ------------------------------------ |
| `id`                   | INT (PK)     | 分类记录唯一标识         | 1, 2, 3...                           |
| `wallet_address`       | VARCHAR(42)  | 用户钱包地址             | 0x1234...5678                        |
| `image_url`            | TEXT         | 上传的垃圾图片 URL       | https://ipfs.io/ipfs/Qm...           |
| `expected_category`    | VARCHAR(50)  | 用户选择的垃圾分类       | 可回收垃圾, 湿垃圾, 干垃圾, 有害垃圾 |
| `ai_detected_category` | VARCHAR(50)  | AI 识别出的垃圾分类      | 可回收垃圾                           |
| `ai_confidence`        | DECIMAL(3,2) | AI 识别置信度(0.00-1.00) | 0.95, 0.87                           |
| `is_correct`           | BOOLEAN      | 分类是否正确             | true, false                          |
| `score`                | INT          | 本次分类获得的积分       | 10, 15, 20                           |
| `ai_analysis`          | TEXT         | AI 详细分析文本          | "这是一个塑料瓶，材质为 PET..."      |
| `ai_response`          | JSON         | 完整的 AI 响应数据       | {analysis: "...", confidence: 0.95}  |
| `processing_time_ms`   | INT          | AI 处理耗时(毫秒)        | 1500, 2300                           |
| `user_location`        | VARCHAR(100) | 用户位置信息             | 深圳市南山区                         |
| `device_info`          | VARCHAR(200) | 设备信息                 | iPhone 14, Chrome/91.0               |
| `created_at`           | TIMESTAMP    | 创建时间                 | 2025-01-15 10:30:00                  |
| `updated_at`           | TIMESTAMP    | 更新时间                 | 2025-01-15 10:30:00                  |

**索引说明**:

- `idx_classifications_wallet`: 按钱包地址快速查询用户分类历史
- `idx_classifications_created_at`: 按时间排序分类记录
- `idx_classifications_is_correct`: 统计正确分类数量
- `idx_classifications_ai_category`: 按 AI 识别类别分组统计

---

## 🏆 **2. score_transactions 表 - 积分交易记录**

**表作用**: 记录所有积分变动明细，支持正负积分变动

| 字段名           | 数据类型    | 说明                            | 示例值                                              |
| ---------------- | ----------- | ------------------------------- | --------------------------------------------------- |
| `id`             | INT (PK)    | 交易记录唯一标识                | 1, 2, 3...                                          |
| `wallet_address` | VARCHAR(42) | 钱包地址                        | 0x1234...5678                                       |
| `amount`         | INT         | 积分变动数量(正数获得/负数消耗) | +10, +50, -20                                       |
| `type`           | VARCHAR(50) | 交易类型                        | classification, achievement, daily_bonus, nft_claim |
| `reference_id`   | INT         | 关联业务记录 ID                 | 123 (分类 ID), 456 (成就 ID)                        |
| `reference_type` | VARCHAR(50) | 关联业务类型                    | classification, achievement, nft                    |
| `description`    | TEXT        | 交易描述                        | "正确分类垃圾获得积分", "解锁成就奖励"              |
| `metadata`       | JSON        | 额外元数据                      | {bonus_multiplier: 1.5, event: "double_points"}     |
| `is_valid`       | BOOLEAN     | 交易是否有效                    | true, false                                         |
| `created_at`     | TIMESTAMP   | 交易时间                        | 2025-01-15 10:30:00                                 |

**交易类型说明**:

- `classification`: 分类获得积分
- `achievement`: 成就奖励积分
- `daily_bonus`: 每日签到奖励
- `nft_claim`: NFT 领取消耗积分
- `penalty`: 积分惩罚
- `refund`: 积分退还

**索引说明**:

- `idx_score_transactions_wallet`: 查询用户积分历史
- `idx_score_transactions_type`: 按交易类型统计
- `idx_score_transactions_created_at`: 按时间排序交易记录
- `idx_score_transactions_reference`: 查询特定业务的积分记录

---

## 🎖️ **3. achievements 表 - 成就定义**

**表作用**: 预定义的成就类型和奖励规则

| 字段名         | 数据类型     | 说明           | 示例值                                |
| -------------- | ------------ | -------------- | ------------------------------------- |
| `id`           | INT (PK)     | 成就唯一标识   | 1, 2, 3...                            |
| `code`         | VARCHAR(50)  | 成就代码(唯一) | first_classification, accuracy_master |
| `name`         | VARCHAR(100) | 成就名称       | 初次尝试, 精准大师                    |
| `description`  | TEXT         | 成就描述       | 完成第一次垃圾分类                    |
| `score_reward` | INT          | 成就奖励积分   | 20, 100, 500                          |
| `icon_url`     | TEXT         | 成就图标 URL   | https://cdn.example.com/icon1.png     |
| `category`     | VARCHAR(50)  | 成就分类       | milestone, streak, accuracy, social   |
| `tier`         | INT          | 成就等级(1-5)  | 1, 2, 3, 4, 5                         |
| `is_active`    | BOOLEAN      | 是否启用       | true, false                           |
| `requirements` | JSON         | 成就触发条件   | {min_score: 100, min_accuracy: 90}    |
| `max_claims`   | INT          | 最大领取次数   | 1, 5, null(无限制)                    |
| `valid_from`   | TIMESTAMP    | 有效期开始     | 2025-01-01 00:00:00                   |
| `valid_until`  | TIMESTAMP    | 有效期结束     | 2025-12-31 23:59:59                   |
| `sort_order`   | INT          | 排序权重       | 1, 2, 3...                            |
| `created_at`   | TIMESTAMP    | 创建时间       | 2025-01-15 10:30:00                   |
| `updated_at`   | TIMESTAMP    | 更新时间       | 2025-01-15 10:30:00                   |

**成就分类说明**:

- `milestone`: 里程碑成就(积分达标、分类次数等)
- `streak`: 连续性成就(连续签到、连续正确等)
- `accuracy`: 准确率成就(90%准确率等)
- `social`: 社交成就(分享、邀请等)
- `seasonal`: 季节性成就(节日活动等)

**requirements JSON 示例**:

```json
{
  "min_score": 1000,           // 最低积分要求
  "min_accuracy": 90,          // 最低准确率要求
  "min_classifications": 100,  // 最低分类次数
  "consecutive_days": 7,       // 连续天数要求
  "specific_categories": ["可回收垃圾", "湿垃圾"]  // 特定分类要求
}
```

---

## 👤 **4. wallet_achievements 表 - 用户成就记录**

**表作用**: 记录用户解锁和领取成就的状态

| 字段名           | 数据类型    | 说明             | 示例值                              |
| ---------------- | ----------- | ---------------- | ----------------------------------- |
| `id`             | INT (PK)    | 记录唯一标识     | 1, 2, 3...                          |
| `wallet_address` | VARCHAR(42) | 钱包地址         | 0x1234...5678                       |
| `achievement_id` | INT (FK)    | 成就 ID          | 1, 2, 3...                          |
| `progress`       | INT         | 完成进度(0-100)  | 0, 50, 100                          |
| `is_completed`   | BOOLEAN     | 是否已完成       | true, false                         |
| `is_claimed`     | BOOLEAN     | 是否已领取奖励   | true, false                         |
| `completed_at`   | TIMESTAMP   | 完成时间         | 2025-01-15 10:30:00                 |
| `claimed_at`     | TIMESTAMP   | 领取时间         | 2025-01-15 11:00:00                 |
| `metadata`       | JSON        | 成就相关额外数据 | {unlock_method: "auto", bonus: 1.2} |
| `created_at`     | TIMESTAMP   | 创建时间         | 2025-01-15 10:30:00                 |
| `updated_at`     | TIMESTAMP   | 更新时间         | 2025-01-15 10:30:00                 |

**状态流转**:

1. `progress < 100`: 进行中
2. `is_completed = true`: 已完成，待领取
3. `is_claimed = true`: 已领取奖励

**唯一约束**: `unique_wallet_achievement` - 确保每个钱包对每个成就只有一条记录

---

## 🎨 **5. nft_pool 表 - NFT 池管理**

**表作用**: 存储预先铸造的 NFT 集合，等待用户领取

| 字段名             | 数据类型     | 说明               | 示例值                                    |
| ------------------ | ------------ | ------------------ | ----------------------------------------- |
| `id`               | INT (PK)     | NFT 池记录唯一标识 | 1, 2, 3...                                |
| `token_id`         | INT          | 链上 TokenID       | 1, 2, 3...                                |
| `contract_address` | VARCHAR(42)  | 智能合约地址       | 0xABCD...1234                             |
| `metadata_uri`     | TEXT         | IPFS 元数据 URI    | ipfs://QmHash...                          |
| `image_url`        | TEXT         | 图片 URL(缓存)     | https://gateway.pinata.cloud/ipfs/...     |
| `name`             | VARCHAR(100) | NFT 名称           | 环保战士 #001                             |
| `description`      | TEXT         | NFT 描述           | 完成 100 次正确分类的环保战士             |
| `status`           | VARCHAR(20)  | NFT 状态           | AVAILABLE, RESERVED, CLAIMED, DISABLED    |
| `rarity`           | INT          | 稀有度(1-5)        | 1(普通), 3(稀有), 5(传说)                 |
| `category`         | VARCHAR(50)  | NFT 类别           | achievement, milestone, special, seasonal |

### **领取条件字段**:

| 字段名                     | 数据类型     | 说明               | 示例值                                      |
| -------------------------- | ------------ | ------------------ | ------------------------------------------- |
| `required_score`           | INT          | 需要的最低积分     | 100, 500, 1000                              |
| `required_classifications` | INT          | 需要的分类次数     | 10, 50, 100                                 |
| `required_accuracy`        | DECIMAL(5,2) | 需要的准确率       | 85.00, 90.00, 95.00                         |
| `required_achievements`    | STRING[]     | 需要的成就代码列表 | ["first_classification", "accuracy_master"] |
| `required_level`           | INT          | 需要的用户等级     | 1, 2, 3, 4, 5                               |

### **领取信息字段**:

| 字段名              | 数据类型    | 说明             | 示例值              |
| ------------------- | ----------- | ---------------- | ------------------- |
| `claimed_by_wallet` | VARCHAR(42) | 被领取的钱包地址 | 0x1234...5678       |
| `claimed_at`        | TIMESTAMP   | 领取时间         | 2025-01-15 10:30:00 |
| `reserved_until`    | TIMESTAMP   | 预留截止时间     | 2025-01-15 11:00:00 |

### **NFT 属性字段**:

| 字段名             | 数据类型   | 说明          | 示例值                                 |
| ------------------ | ---------- | ------------- | -------------------------------------- |
| `attributes`       | JSON       | NFT 属性 JSON | [{trait_type: "Level", value: "Epic"}] |
| `external_url`     | TEXT       | 外部链接      | https://wastewise.com/nft/1            |
| `animation_url`    | TEXT       | 动画 URL      | https://cdn.example.com/anim.mp4       |
| `background_color` | VARCHAR(7) | 背景色        | #FF5733                                |

### **管理字段**:

| 字段名       | 数据类型    | 说明       | 示例值              |
| ------------ | ----------- | ---------- | ------------------- |
| `is_active`  | BOOLEAN     | 是否启用   | true, false         |
| `sort_order` | INT         | 排序权重   | 1, 2, 3...          |
| `created_by` | VARCHAR(42) | 创建者钱包 | 0xADMIN...1234      |
| `created_at` | TIMESTAMP   | 创建时间   | 2025-01-15 10:30:00 |
| `updated_at` | TIMESTAMP   | 更新时间   | 2025-01-15 10:30:00 |

**NFT 状态说明**:

- `AVAILABLE`: 可领取
- `RESERVED`: 已预留(30 分钟内)
- `CLAIMED`: 已被领取
- `DISABLED`: 已禁用

**稀有度等级**:

- `1`: 普通 (Common)
- `2`: 不常见 (Uncommon)
- `3`: 稀有 (Rare)
- `4`: 史诗 (Epic)
- `5`: 传说 (Legendary)

**NFT 类别说明**:

- `achievement`: 成就类 NFT
- `milestone`: 里程碑 NFT
- `special`: 特殊活动 NFT
- `seasonal`: 季节性 NFT

---

## 🎁 **6. nft_claims 表 - NFT 领取记录**

**表作用**: 记录用户 NFT 领取历史和区块链交易状态

| 字段名           | 数据类型    | 说明             | 示例值        |
| ---------------- | ----------- | ---------------- | ------------- |
| `id`             | INT (PK)    | 领取记录唯一标识 | 1, 2, 3...    |
| `wallet_address` | VARCHAR(42) | 领取者钱包地址   | 0x1234...5678 |
| `nft_pool_id`    | INT (FK)    | NFT 池 ID        | 1, 2, 3...    |

### **区块链交易信息**:

| 字段名             | 数据类型    | 说明          | 示例值                |
| ------------------ | ----------- | ------------- | --------------------- |
| `transaction_hash` | VARCHAR(66) | 交易哈希      | 0x1234567890abcdef... |
| `block_number`     | BIGINT      | 区块高度      | 18500000              |
| `gas_used`         | BIGINT      | 消耗的 gas    | 150000                |
| `gas_fee`          | VARCHAR(50) | gas 费用(wei) | 1500000000000000      |

### **状态跟踪**:

| 字段名           | 数据类型    | 说明     | 示例值                                |
| ---------------- | ----------- | -------- | ------------------------------------- |
| `status`         | VARCHAR(20) | 领取状态 | PENDING, CONFIRMED, FAILED, CANCELLED |
| `failure_reason` | TEXT        | 失败原因 | Gas 价格过低, 网络拥堵                |
| `retry_count`    | INT         | 重试次数 | 0, 1, 2, 3                            |

### **时间戳**:

| 字段名         | 数据类型  | 说明     | 示例值              |
| -------------- | --------- | -------- | ------------------- |
| `requested_at` | TIMESTAMP | 请求时间 | 2025-01-15 10:30:00 |
| `confirmed_at` | TIMESTAMP | 确认时间 | 2025-01-15 10:35:00 |
| `failed_at`    | TIMESTAMP | 失败时间 | 2025-01-15 10:32:00 |

### **额外信息**:

| 字段名       | 数据类型    | 说明       | 示例值                               |
| ------------ | ----------- | ---------- | ------------------------------------ |
| `user_agent` | TEXT        | 用户代理   | Mozilla/5.0 (iPhone...)              |
| `ip_address` | VARCHAR(45) | IP 地址    | 192.168.1.100                        |
| `metadata`   | JSON        | 额外元数据 | {device: "mobile", location: "深圳"} |
| `created_at` | TIMESTAMP   | 创建时间   | 2025-01-15 10:30:00                  |
| `updated_at` | TIMESTAMP   | 更新时间   | 2025-01-15 10:35:00                  |

**NFT 领取状态流转**:

1. `PENDING`: 请求已提交，等待区块链确认
2. `CONFIRMED`: 区块链交易确认成功
3. `FAILED`: 交易失败
4. `CANCELLED`: 用户取消或超时

---

## ⚙️ **7. system_config 表 - 系统配置**

**表作用**: 存储系统级别的配置信息，支持动态配置

| 字段名        | 数据类型     | 说明             | 示例值                            |
| ------------- | ------------ | ---------------- | --------------------------------- |
| `id`          | INT (PK)     | 配置记录唯一标识 | 1, 2, 3...                        |
| `key`         | VARCHAR(100) | 配置键(唯一)     | base_score_per_classification     |
| `value`       | TEXT         | 配置值           | 10, true, {"min": 1, "max": 100}  |
| `type`        | VARCHAR(20)  | 配置值类型       | string, number, boolean, json     |
| `category`    | VARCHAR(50)  | 配置分类         | scoring, nft, achievement, system |
| `description` | TEXT         | 配置描述         | 每次正确分类获得的基础积分        |
| `is_public`   | BOOLEAN      | 是否对外公开     | true, false                       |
| `is_active`   | BOOLEAN      | 是否启用         | true, false                       |
| `updated_by`  | VARCHAR(42)  | 最后更新者钱包   | 0xADMIN...1234                    |
| `created_at`  | TIMESTAMP    | 创建时间         | 2025-01-15 10:30:00               |
| `updated_at`  | TIMESTAMP    | 更新时间         | 2025-01-15 10:30:00               |

**配置分类说明**:

- `scoring`: 积分相关配置
- `nft`: NFT 相关配置
- `achievement`: 成就相关配置
- `system`: 系统级配置

**常用配置示例**:

```json
{
  "base_score_per_classification": "10",
  "accuracy_bonus_threshold": "90",
  "daily_classification_limit": "50",
  "nft_reservation_timeout_minutes": "30",
  "achievement_check_interval_hours": "1"
}
```

---

## 📊 **8. api_logs 表 - API 调用日志**

**表作用**: 记录重要的 API 调用信息，用于监控和分析

| 字段名           | 数据类型     | 说明             | 示例值                                             |
| ---------------- | ------------ | ---------------- | -------------------------------------------------- |
| `id`             | INT (PK)     | 日志记录唯一标识 | 1, 2, 3...                                         |
| `wallet_address` | VARCHAR(42)  | 调用者钱包(可选) | 0x1234...5678                                      |
| `endpoint`       | VARCHAR(200) | API 端点         | /api/v1/classifications                            |
| `method`         | VARCHAR(10)  | HTTP 方法        | GET, POST, PUT, DELETE                             |
| `status_code`    | INT          | 响应状态码       | 200, 400, 500                                      |
| `response_time`  | INT          | 响应时间(毫秒)   | 150, 500, 2000                                     |
| `user_agent`     | TEXT         | 用户代理         | Mozilla/5.0...                                     |
| `ip_address`     | VARCHAR(45)  | IP 地址          | 192.168.1.100, 2001:db8::1                         |
| `request_size`   | INT          | 请求大小(字节)   | 1024, 5120                                         |
| `response_size`  | INT          | 响应大小(字节)   | 2048, 10240                                        |
| `error_message`  | TEXT         | 错误信息         | Validation failed: invalid wallet address          |
| `metadata`       | JSON         | 额外日志信息     | {classification_id: 123, ai_processing_time: 1500} |
| `created_at`     | TIMESTAMP    | 日志时间         | 2025-01-15 10:30:00                                |

**日志级别说明**:

- 记录所有重要业务 API 调用
- 自动清理 30 天前的日志数据
- 用于性能监控和错误追踪

---

## 🔗 **表之间的关系说明**

### **核心关系**:

1. **classifications** ↔ **score_transactions**

   - 通过 `reference_id` + `reference_type` 关联
   - 一次分类可产生多条积分交易记录

2. **achievements** ↔ **wallet_achievements**

   - 外键关联: `wallet_achievements.achievement_id` → `achievements.id`
   - 一对多关系: 一个成就可被多个钱包解锁

3. **nft_pool** ↔ **nft_claims**
   - 外键关联: `nft_claims.nft_pool_id` → `nft_pool.id`
   - 一对多关系: 一个 NFT 可有多条领取记录(包括失败记录)

### **钱包地址作为连接点**:

- 所有表通过 `wallet_address` 字段关联到同一用户
- 支持跨表查询用户完整档案
- 无需传统的用户表，完全去中心化设计

---

## 📈 **数据库视图建议**

为了提高查询性能，建议创建以下视图:

```sql
-- 钱包统计汇总视图
CREATE VIEW wallet_summary AS
SELECT
  wallet_address,
  COUNT(*) as total_classifications,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_classifications,
  ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0 END), 2) as accuracy_rate,
  SUM(score) as total_score_from_classifications,
  MIN(created_at) as first_classification_at,
  MAX(created_at) as last_classification_at
FROM classifications
GROUP BY wallet_address;

-- 钱包积分汇总视图
CREATE VIEW wallet_score_summary AS
SELECT
  wallet_address,
  SUM(amount) as total_score,
  COUNT(*) as total_transactions,
  MAX(created_at) as last_transaction_at
FROM score_transactions
WHERE is_valid = true
GROUP BY wallet_address;
```

---

## 🏷️ **重要约束和规则**

### **数据完整性**:

- 钱包地址必须符合以太坊地址格式 (42 字符，0x 开头)
- AI 置信度范围: 0.00-1.00
- NFT 稀有度范围: 1-5
- 成就进度范围: 0-100

### **业务规则**:

- 一个钱包对每个成就只能有一条记录
- NFT 预留时间不超过 30 分钟
- 积分交易支持正负数，但总积分不能为负
- API 日志自动清理，只保留 30 天数据

### **性能优化**:

- 所有表都有适当的索引
- 频繁查询的字段都有专门索引
- JSON 字段用于存储灵活的元数据
- 使用视图提高复杂查询性能

### 表之间的实体关系预览

https://dbdiagram.io/
在该网站中粘贴 智慧垃圾分类实体关系.sql

---

**📝 文档版本**: v1.0  
**🕒 更新时间**: 2025-08-09  
**👥 维护团队**: WasteWise Backend Team
