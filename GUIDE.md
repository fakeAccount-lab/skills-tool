# Skill Installer - 删除技能和自定义 Agent 指南

## 如何删除已下载的 Skill

目前工具没有提供自动删除命令，需要手动删除。请根据安装位置和模式选择相应的删除方法。

### 1. 确定技能的安装位置

首先检查技能的安装位置：

```bash
# 查看项目级技能目录
ls -la skills/
ls -la .agents/skills/

# 查看全局技能目录
ls -la ~/.openclaw/skills/
ls -la ~/.claude/skills/
ls -la ~/.codex/skills/
ls -la ~/.cursor/skills/
```

### 2. 项目级安装删除

#### Symlink 模式（推荐）

Symlink 模式会创建两个位置：
1. `.agents/skills/<skill-name>/` - 实际文件
2. `skills/<skill-name>/` - 符号链接

**删除步骤：**
```bash
# 删除符号链接和实际文件
rm -rf skills/<skill-name>
rm -rf .agents/skills/<skill-name>

# 示例：删除 weather 技能
rm -rf skills/weather
rm -rf .agents/skills/weather
```

#### Copy 模式

Copy 模式只有项目级目录：

```bash
# 删除技能目录
rm -rf skills/<skill-name>

# 示例：删除 code-review 技能（Copy 模式）
rm -rf skills/code-review
```

### 3. 全局安装删除

全局安装的技能位于用户主目录：

```bash
# OpenClaw 全局技能
rm -rf ~/.openclaw/skills/<skill-name>

# Claude Code 全局技能
rm -rf ~/.claude/skills/<skill-name>

# Codex 全局技能
rm -rf ~/.codex/skills/<skill-name>

# Cursor 全局技能
rm -rf ~/.cursor/skills/

# OpenCode 全局技能
rm -rf ~/.config/opencode/skills/<skill-name>
```

### 4. 批量删除

如果需要删除多个技能：

```bash
# 删除所有 OpenClaw 项目级技能
rm -rf skills/*
rm -rf .agents/skills/*

# 删除所有 OpenClaw 全局技能
rm -rf ~/.openclaw/skills/*
```

### 5. 删除前检查

删除前可以检查技能内容：

```bash
# 查看技能的 SKILL.md
cat skills/<skill-name>/SKILL.md

# 查看符号链接指向（如果存在）
ls -la skills/<skill-name>
```

---

## 如何添加自定义 Agent

通过配置文件 `~/.config/skill-installer/config.json` 添加自定义 Agent。

### 1. 配置文件位置

```bash
# 配置文件路径
~/.config/skill-installer/config.json
```

如果配置文件不存在，需要先创建：

```bash
mkdir -p ~/.config/skill-installer
```

### 2. 配置文件格式

```json
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "your-agent-name": {
      "name": "your-agent-name",
      "displayName": "Agent 显示名称",
      "skillsDir": ".agent/skills",
      "globalSkillsDir": "~/.agent/skills"
    }
  }
}
```

### 3. 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | Agent 的唯一标识符（小写，使用连字符） |
| `displayName` | string | ✅ | Agent 的显示名称（用于交互界面和日志） |
| `skillsDir` | string | ✅ | 项目级技能目录（相对于项目根目录的路径） |
| `globalSkillsDir` | string | ❌ | 全局技能目录（绝对路径，支持 `~` 展开） |
| `detectInstalled` | function | ❌ | 检测 Agent 是否已安装的异步函数（可选） |

### 4. 完整配置示例

```json
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "my-ai-assistant": {
      "name": "my-ai-assistant",
      "displayName": "我的 AI 助手",
      "skillsDir": ".ai-assistant/skills",
      "globalSkillsDir": "~/.ai-assistant/skills"
    },
    "custom-coder": {
      "name": "custom-coder",
      "displayName": "自定义编码助手",
      "skillsDir": ".coder/skills",
      "globalSkillsDir": "~/.coder/skills"
    },
    "workspace-bot": {
      "name": "workspace-bot",
      "displayName": "工作区机器人",
      "skillsDir": ".workspace-bot/skills",
      "globalSkillsDir": "~/.workspace-bot/skills"
    }
  }
}
```

### 5. 创建自定义 Agent 配置的步骤

#### 步骤 1：创建配置目录

```bash
mkdir -p ~/.config/skill-installer
```

#### 步骤 2：创建配置文件

```bash
cat > ~/.config/skill-installer/config.json << 'EOF'
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "my-agent": {
      "name": "my-agent",
      "displayName": "我的 Agent",
      "skillsDir": ".my-agent/skills",
      "globalSkillsDir": "~/.my-agent/skills"
    }
  }
}
EOF
```

#### 步骤 3：验证配置

```bash
# 查看配置文件
cat ~/.config/skill-installer/config.json

# 查看可用的 Agent（需要在工具中测试）
cd /path/to/skill-installer
node dist/cli.js help
```

### 6. 使用自定义 Agent

配置完成后，可以使用自定义 Agent 安装技能：

```bash
cd /path/to/skill-installer

# 安装到自定义 Agent
node dist/cli.js add fakeAccount-lab/skills-hub --agent my-agent --skill weather --yes

# 全局安装到自定义 Agent
node dist/cli.js add fakeAccount-lab/skills-hub --agent my-agent --skill weather --global --yes
```

### 7. 自定义 Agent 示例场景

#### 场景 1：为现有 AI 工具添加技能支持

假设你有一个 AI 工具 `my-ai-tool`，它在项目根目录的 `.my-ai-tool/skills/` 中查找技能：

```json
{
  "agents": {
    "my-ai-tool": {
      "name": "my-ai-tool",
      "displayName": "My AI Tool",
      "skillsDir": ".my-ai-tool/skills",
      "globalSkillsDir": "~/.my-ai-tool/skills"
    }
  }
}
```

#### 场景 2：为团队工具添加技能支持

假设团队工具 `team-assistant` 使用 `workspace/` 目录：

```json
{
  "agents": {
    "team-assistant": {
      "name": "team-assistant",
      "displayName": "团队助手",
      "skillsDir": "workspace/assistant/skills",
      "globalSkillsDir": "~/.team-assistant/skills"
    }
  }
}
```

#### 场景 3：使用环境变量指定路径

如果你的 Agent 使用环境变量指定的路径，可以在 `globalSkillsDir` 中使用绝对路径：

```json
{
  "agents": {
    "env-agent": {
      "name": "env-agent",
      "displayName": "环境变量 Agent",
      "skillsDir": ".env-agent/skills",
      "globalSkillsDir": "/opt/env-agent/skills"
    }
  }
}
```

### 8. 配置验证

配置完成后，可以验证配置是否正确：

#### 验证步骤

1. **检查配置文件语法**
```bash
# 使用 jq 验证 JSON 语法（如果已安装）
jq '.' ~/.config/skill-installer/config.json

# 或使用 node
node -e "console.log(JSON.parse(require('fs').readFileSync('~/.config/skill-installer/config.json', 'utf8')))"
```

2. **测试 Agent 选择**
```bash
cd /path/to/skill-installer
# 尝试安装到自定义 Agent
node dist/cli.js add <repo> --agent my-agent --skill <skill> --yes
```

3. **检查安装结果**
```bash
# 查看自定义 Agent 的技能目录
ls -la .my-agent/skills/

# 或全局安装
ls -la ~/.my-agent/skills/
```

### 9. 常见问题

#### Q1: 配置文件不生效怎么办？

**A:** 检查以下几点：
1. 配置文件路径是否正确：`~/.config/skill-installer/config.json`
2. JSON 语法是否正确（可以使用在线 JSON 验证器检查）
3. 配置文件是否有可读权限

#### Q2: 可以添加多个自定义 Agent 吗？

**A:** 可以。在 `agents` 字段中添加多个 Agent 即可：

```json
{
  "agents": {
    "agent1": { ... },
    "agent2": { ... },
    "agent3": { ... }
  }
}
```

#### Q3: 自定义 Agent 会覆盖默认 Agent 吗？

**A:** 不会。自定义 Agent 和默认 Agent 会合并，自定义 Agent 的配置会覆盖同名的默认 Agent 配置。

#### Q4: 如何删除自定义 Agent 配置？

**A:** 从配置文件中删除对应的 Agent 条目即可：

```json
{
  "agents": {
    "my-agent": {
      "name": "my-agent",
      ...
    }
  }
}
```

删除 `my-agent` 条目后，保存文件即可。

### 10. 最佳实践

1. **命名规范**
   - Agent 标识符使用小写字母和连字符：`my-agent`
   - 显示名称可以使用中文或英文：`我的助手` 或 `My Assistant`

2. **路径选择**
   - 项目级路径：使用相对路径，以 `.` 开头
   - 全局路径：使用绝对路径或 `~` 开头

3. **配置备份**
   ```bash
   # 备份配置文件
   cp ~/.config/skill-installer/config.json ~/.config/skill-installer/config.json.backup
   ```

4. **测试配置**
   在正式使用前，先用测试 Agent 验证配置是否正确。

---

## 完整示例

### 示例 1：删除已安装的技能

```bash
# 查看已安装的技能
ls -la skills/

# 删除 weather 技能（Symlink 模式）
rm -rf skills/weather
rm -rf .agents/skills/weather

# 验证删除
ls -la skills/
```

### 示例 2：添加自定义 Agent 并使用

```bash
# 1. 创建配置文件
mkdir -p ~/.config/skill-installer
cat > ~/.config/skill-installer/config.json << 'EOF'
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "my-assistant": {
      "name": "my-assistant",
      "displayName": "我的助手",
      "skillsDir": ".my-assistant/skills",
      "globalSkillsDir": "~/.my-assistant/skills"
    }
  }
}
EOF

# 2. 使用自定义 Agent 安装技能
cd /path/to/skill-installer
node dist/cli.js add fakeAccount-lab/skills-hub --agent my-assistant --skill weather --yes

# 3. 验证安装
ls -la .my-assistant/skills/
```

---

## 总结

- **删除技能**：手动删除对应目录（Symlink 模式需要删除两个位置）
- **添加自定义 Agent**：编辑 `~/.config/skill-installer/config.json` 配置文件
- **配置格式**：JSON 格式，包含 name、displayName、skillsDir 等字段
- **验证配置**：检查 JSON 语法，测试安装技能到自定义 Agent

如有问题，请检查配置文件语法和路径设置。
