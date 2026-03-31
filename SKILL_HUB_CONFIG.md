# 使用 .skills-hub/index.json 配置技能发现

本文档说明如何使用 `.skills-hub/index.json` 配置文件来显式声明技能信息，提供更稳定和可控制的技能发现机制。

## 📋 概述

`.skills-hub/index.json` 是一个可选的配置文件，用于显式声明代码仓库中的技能信息。当此文件存在时，工具会优先使用它来发现技能，而不是依赖目录扫描或递归搜索。

## ✅ 优点

1. **稳定可靠**：不依赖目录结构变化
2. **显式声明**：清楚知道哪些技能会被发现
3. **灵活定位**：技能可以放在任意位置
4. **性能优异**：无需遍历整个目录树
5. **易于维护**：开发者完全控制技能列表

## 📄 配置文件格式

### 文件位置

```
your-repo/
├── .skills-hub/
│   └── index.json    ← 配置文件位置
├── skills/
│   ├── weather/
│   └── git-helper/
└── ...
```

### JSON 结构

```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "skill-id",
      "description": "Brief description of the skill",
      "path": "path/to/skill/directory"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | `string` | ✅ | 配置文件版本（当前固定为 "1.0"） |
| `skills` | `array` | ✅ | 技能列表数组 |
| `skills[].name` | `string` | ✅ | 技能的唯一标识符 |
| `skills[].description` | `string` | ✅ | 技能的简要描述 |
| `skills[].path` | `string` | ✅ | 技能目录的相对路径（相对于仓库根目录） |

## 📝 完整示例

### 示例 1：基本配置

```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "weather",
      "description": "Get current weather and forecasts for any location",
      "path": "skills/weather"
    },
    {
      "name": "git-helper",
      "description": "Common Git operations and workflows",
      "path": "skills/git-helper"
    }
  ]
}
```

### 示例 2：技能分散在多个目录

```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "weather",
      "description": "Get current weather and forecasts",
      "path": "skills/weather"
    },
    {
      "name": "custom-tool",
      "description": "A custom tool in a different location",
      "path": "tools/custom-tool"
    },
    {
      "name": "internal-helper",
      "description": "Internal helper utility",
      "path": "src/utils/internal-helper"
    }
  ]
}
```

对应的目录结构：

```
your-repo/
├── .skills-hub/
│   └── index.json
├── skills/
│   └── weather/
│       └── SKILL.md
├── tools/
│   └── custom-tool/
│       └── SKILL.md
└── src/
    └── utils/
        └── internal-helper/
            └── SKILL.md
```

### 示例 3：使用嵌套目录

```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "devops-deploy",
      "description": "Automated deployment for DevOps",
      "path": "tools/devops/deploy"
    },
    {
      "name": "devops-monitor",
      "description": "Monitoring tools for DevOps",
      "path": "tools/devops/monitor"
    }
  ]
}
```

## 🔍 技能发现优先级

工具按照以下优先级发现技能：

1. **`.skills-hub/index.json`**（最高优先级）
   - 如果文件存在且格式正确，使用配置文件中的技能列表
   - 跳过目录扫描和递归搜索

2. **标准目录扫描**
   - 扫描预定义的标准目录（`skills/`、`.agents/skills/` 等）

3. **递归搜索**（兜底方案）
   - 从仓库根目录递归查找包含 `SKILL.md` 的目录

## ⚠️ 错误处理

### 1. 文件不存在

如果 `.skills-hub/index.json` 不存在，工具会自动降级到标准发现机制，不会报错。

### 2. JSON 格式错误

如果 JSON 格式无效，工具会显示警告并降级到标准发现机制。

```
Warning: Failed to parse .skills-hub/index.json: <error message>
```

### 3. 字段缺失

如果技能条目缺少必填字段（`name`、`description`、`path`），工具会跳过该条目并显示警告。

```
Warning: Invalid skill entry in .skills-hub/index.json: {"name":"incomplete-skill","path":"skills/weather"}
```

### 4. 路径不存在

如果配置的路径不存在，工具会跳过该技能并显示警告。

```
Warning: Skill path does not exist: nonexistent/skill
```

### 5. 路径不是目录

如果配置的路径不是目录，工具会跳过该技能并显示警告。

```
Warning: Skill path is not a directory: README.md
```

## 🧪 使用示例

### 1. 创建配置文件

在仓库根目录创建 `.skills-hub/index.json`：

```bash
mkdir -p .skills-hub
cat > .skills-hub/index.json << 'EOF'
{
  "version": "1.0",
  "skills": [
    {
      "name": "weather",
      "description": "Get current weather and forecasts",
      "path": "skills/weather"
    }
  ]
}
EOF
```

### 2. 创建技能

确保技能目录存在且包含 `SKILL.md`：

```bash
mkdir -p skills/weather
cat > skills/weather/SKILL.md << 'EOF'
---
name: weather
description: Get current weather and forecasts
---

# Weather Skill

This skill provides weather information.
EOF
```

### 3. 提交到 Git

```bash
git add .skills-hub/ skills/
git commit -m "Add skill hub configuration"
```

### 4. 使用 skill-installer

```bash
# 列出仓库中的技能（会使用 index.json）
skill-installer list your-repo

# 安装技能
skill-installer add your-repo --agent openclaw --skill weather
```

## 📊 与 SKILL.md 的关系

### 配置文件中的字段

`index.json` 中的 `name` 和 `description` 字段用于：
- 列出技能时显示
- 匹配要安装的技能

### SKILL.md 中的字段

`SKILL.md` frontmatter 中的字段用于：
- 验证技能是否有效
- 获取额外的元数据（如 `internal`）
- 实际使用时提供完整信息

### 推荐做法

**保持一致性**：确保 `index.json` 和 `SKILL.md` 中的 `name` 和 `description` 一致。

**示例**：

```json
// .skills-hub/index.json
{
  "name": "weather",
  "description": "Get current weather and forecasts"
}
```

```markdown
// skills/weather/SKILL.md
---
name: weather
description: Get current weather and forecasts
internal: false
---

# Weather Skill
...
```

## 🎯 最佳实践

1. **使用小写和连字符**：技能名称使用 kebab-case（如 `my-skill`）
2. **保持描述简洁**：描述应该简短清晰（50-100 字符）
3. **使用相对路径**：路径应该相对于仓库根目录
4. **验证技能存在**：确保每个配置的路径都存在且有效
5. **版本控制**：将 `index.json` 提交到 Git
6. **文档说明**：在 README 中说明如何使用配置文件

## 🔄 迁移指南

### 从自动发现迁移到配置文件

如果你已经有一个有技能的仓库，可以这样迁移：

#### 步骤 1：列出当前技能

```bash
skill-installer list your-repo
```

#### 步骤 2：创建配置文件

```bash
mkdir -p .skills-hub
```

#### 步骤 3：添加技能到配置文件

```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "skill1",
      "description": "Description from step 1",
      "path": "actual/path/to/skill1"
    },
    {
      "name": "skill2",
      "description": "Description from step 1",
      "path": "actual/path/to/skill2"
    }
  ]
}
```

#### 步骤 4：验证配置

```bash
skill-installer list your-repo
```

应该会显示：`Found X skill(s) from .skills-hub/index.json`

## 🐛 故障排除

### 问题 1：配置文件被忽略

**症状**：创建了 `index.json` 但仍然使用自动发现

**解决方案**：
1. 确认文件路径正确：`.skills-hub/index.json`
2. 确认 JSON 格式有效（使用 JSON 验证器）
3. 确认文件已提交到 Git（如果从远程仓库克隆）

### 问题 2：技能未被发现

**症状**：配置文件中的某些技能未显示

**解决方案**：
1. 检查路径是否正确（相对于仓库根目录）
2. 确认技能目录存在且包含 `SKILL.md`
3. 查看警告信息（工具会跳过无效的条目）

### 问题 3：描述不一致

**症状**：`index.json` 和 `SKILL.md` 中的描述不同

**解决方案**：
统一两者中的 `name` 和 `description`，确保一致性。

## 📚 相关文档

- [README.md](README.md) - 主要文档
- [SKILL_FORMAT.md](SKILL_FORMAT.md) - SKILL.md 格式说明

## 💡 常见问题

### Q: 必须使用配置文件吗？

A: 不是必须的。如果没有 `.skills-hub/index.json`，工具会使用标准的发现机制。

### Q: 可以混用配置文件和自动发现吗？

A: 不可以。如果配置文件存在，工具只会使用配置文件，不会扫描其他目录。

### Q: 配置文件的优先级是什么？

A: 配置文件的优先级最高。如果存在，工具会优先使用它。

### Q: 如何禁用配置文件？

A: 删除或重命名 `.skills-hub/index.json` 文件即可。

### Q: 配置文件会影响已安装的技能吗？

A: 不会。配置文件只影响技能发现，不影响已安装的技能。
