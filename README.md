# Skill Installer

从 Git 仓库安装 Agent Skills 的命令行工具。

## 功能特性

- 📦 从 Git 仓库安装技能（GitHub、GitLab 等）
- 🎯 支持多种 Agent（OpenClaw、Claude Code、Codex、Cursor、OpenCode 等）
- 🔗 Symlink 模式（推荐）或 Copy 模式
- 🌍 支持全局和项目级安装
- 🎨 交互式 CLI 界面
- ⚡ 快速浅克隆
- 🔒 路径遍历防护
- 📋 列出仓库中的可用技能
- ⚙️ 支持自定义 Agent 配置

## 安装方式

### 方法一：克隆仓库使用（推荐）

```bash
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖
npm install

# 构建项目
npm run build

# 使用工具
node dist/cli.js --help
```

### 方法二：创建全局命令（可选）

```bash
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖并构建
npm install && npm run build

# 创建全局命令
sudo ln -s $(pwd)/bin/skill-installer.js /usr/local/bin/skill-installer

# 然后可以直接使用
skill-installer --help
```

## 使用方法

### 查看帮助

```bash
node dist/cli.js help
# 或
node dist/cli.js
```

### 列出仓库中的可用技能

```bash
# 使用 GitHub 简写格式
node dist/cli.js list fakeAccount-lab/skills-hub

# 使用完整 URL
node dist/cli.js list https://github.com/fakeAccount-lab/skills-hub.git

# 使用本地路径
node dist/cli.js list /path/to/local/repo
```

### 安装技能

```bash
# 安装到指定 Agent
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --yes

# 全局安装
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --global --yes

# 安装多个技能
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --skill git-helper --yes

# 安装到多个 Agent（建议使用完整 URL）
node dist/cli.js add https://github.com/fakeAccount-lab/skills-hub.git --agent openclaw --agent claude-code --skill weather --yes

# 使用 Copy 模式（而非 Symlink）
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill code-review --mode copy --yes

# 克隆指定分支
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --branch main --skill weather --yes
```

### 查看已安装的技能

```bash
# 查看项目级安装的技能
node dist/cli.js installed --agent openclaw

# 查看全局安装的技能
node dist/cli.js installed --agent openclaw --global
```

## 支持的 Agent

| Agent | 名称 | 项目级路径 | 全局路径 |
|-------|------|-----------|---------|
| OpenClaw | `openclaw` | `./skills/` | `~/.openclaw/skills/` |
| Claude Code | `claude-code` | `./.claude/skills/` | `~/.claude/skills/` |
| Codex | `codex` | `./.codex/skills/` | `~/.codex/skills/` |
| Cursor | `cursor` | `./.cursor/skills/` | `~/.cursor/skills/` |
| OpenCode | `opencode` | `./.agents/skills/` | `~/.config/opencode/skills/` |

## 安装模式

### Symlink 模式（推荐）

- 技能复制到规范位置：`.agents/skills/<skill-name>/`
- 从 Agent 目录创建指向规范位置的符号链接
- 优点：单一数据源、易于更新、节省磁盘空间
- Symlink 失败时自动降级到 Copy 模式

### Copy 模式

- 直接将技能复制到每个 Agent 目录
- 优点：独立副本，适用于不支持 symlink 的系统
- 缺点：占用更多磁盘空间，需要分别更新每个副本

## 配置方式

通过配置文件自定义 Agent 和设置：

```bash
# 配置文件位置
~/.config/skill-installer/config.json
```

配置示例：

```json
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "my-custom-agent": {
      "name": "my-custom-agent",
      "displayName": "我的自定义 Agent",
      "skillsDir": ".my-agent/skills",
      "globalSkillsDir": "~/.my-agent/skills"
    }
  }
}
```

## 仓库 URL 格式

工具支持多种 Git 仓库 URL 格式：

- GitHub 简写：`owner/repo`
- 完整 HTTPS URL：`https://github.com/owner/repo`
- SSH URL：`git@github.com:owner/repo.git`
- 带分支：`owner/repo#branch`
- 本地路径：`./local-repo`

## Skill 格式

技能必须包含 `SKILL.md` 文件，并带有 YAML frontmatter：

```markdown
---
name: my-skill
description: 这个技能的作用和使用场景
---

## 步骤

1. 首先这样做
2. 然后那样做
```

必填字段：
- `name`：唯一标识符（小写，允许连字符）
- `description`：技能功能的简要说明

可选字段：
- `metadata.internal: true` - 标记为内部技能（默认隐藏）

## 冲突解决

当安装同名技能但来源不同时，工具会：

1. 检测到冲突
2. 显示交互式提示，包含以下信息：
   - 技能名称和描述
   - 源仓库
   - 安装状态
3. 让你选择要安装哪一个

## 开发说明

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式运行
npm run dev

# 格式化代码
npm run format

# 类型检查
npm tsc --noEmit
```

## 命令参考

| 命令 | 说明 | 示例 |
|------|------|------|
| `add <repo>` | 从仓库安装技能 | `add fakeAccount-lab/skills-hub` |
| `list <repo>` | 列出仓库中的技能 | `list fakeAccount-lab/skills-hub` |
| `installed` | 列出已安装的技能 | `installed --agent openclaw` |
| `help` | 显示帮助信息 | `help` |

## 选项说明

| 选项 | 说明 | 示例 |
|------|------|------|
| `--agent <name>` | 指定目标 Agent | `--agent openclaw` |
| `--skill <name>` | 指定要安装的技能（可多次使用） | `--skill weather` |
| `--global` | 全局安装而非项目级 | `--global` |
| `--mode <mode>` | 安装模式：symlink 或 copy | `--mode copy` |
| `--branch <branch>` | 克隆指定分支 | `--branch main` |
| `--yes` | 跳过确认提示 | `--yes` |

## 使用示例

### 示例 1：查看帮助信息

```bash
cd skill-installer
node dist/cli.js help
```

### 示例 2：列出仓库中的技能

```bash
# 列出 GitHub 仓库中的技能
node dist/cli.js list fakeAccount-lab/skills-hub
```

**预期输出：**
```
┌  📋 Listing Skills

Found 3 skill(s):

• code-review
  Perform code reviews with focus on quality, best practices, and potential issues

• git-helper
  Common Git operations and workflows for version control

• weather
  Get current weather and forecasts for any location

│
└  ✨ Listed 3 skill(s)
```

### 示例 3：安装单个技能

```bash
# 安装 weather 技能到 OpenClaw
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --yes
```

**预期输出：**
```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "weather" to OpenClaw (symlink)
│
└  ✨ Done! 1 installed, 0 failed
```

### 示例 4：全局安装技能

```bash
# 全局安装 git-helper 技能到 OpenClaw
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill git-helper --global --yes
```

### 示例 5：安装到多个 Agent

```bash
# 安装 weather 技能到 OpenClaw 和 Claude Code
node dist/cli.js add https://github.com/fakeAccount-lab/skills-hub.git --agent openclaw --agent claude-code --skill weather --yes
```

**预期输出：**
```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "weather" to OpenClaw (symlink)
✓ Installed "weather" to Claude Code (symlink)
│
└  ✨ Done! 2 installed, 0 failed
```

### 示例 6：使用 Copy 模式安装

```bash
# 使用 Copy 模式安装 code-review 技能
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill code-review --mode copy --yes
```

**预期输出：**
```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "code-review" to OpenClaw (copy)
│
└  ✨ Done! 1 installed, 0 failed
```

### 示例 7：查看已安装的技能

```bash
# 查看 OpenClaw 已安装的技能
node dist/cli.js installed --agent openclaw
```

## 注意事项

1. **多 Agent 安装**：当需要安装到多个 Agent 时，建议使用完整的仓库 URL（如 `https://github.com/owner/repo.git`），而不仅仅是简写格式（`owner/repo`），以避免潜在的克隆超时问题。

2. **安装模式**：Symlink 模式是默认和推荐的模式，但如果系统不支持符号链接，工具会自动降级到 Copy 模式。

3. **权限要求**：全局安装需要写入用户主目录的权限，项目级安装需要写入当前项目目录的权限。

4. **覆盖安装**：如果技能已存在，重新安装会覆盖原有内容。

## 常见问题

### Q: 为什么有时克隆会超时？

A: 这通常发生在：
- 使用 GitHub 简写格式（`owner/repo`）时
- 网络连接不稳定
- 仓库体积较大

**解决方法：**
- 使用完整的仓库 URL（`https://github.com/owner/repo.git`）
- 使用 `--single-branch` 标志（工具已自动添加）
- 检查网络连接

### Q: 如何卸载已安装的技能？

A: 目前工具没有提供卸载命令，需要手动删除：

```bash
# 项目级安装
rm -rf skills/<skill-name> .agents/skills/<skill-name>

# 全局安装
rm -rf ~/.openclaw/skills/<skill-name>
```

### Q: Symlink 和 Copy 模式有什么区别？

A: 
- **Symlink 模式**：技能文件存储在 `.agents/skills/<skill-name>`，各 Agent 目录通过符号链接指向该位置。节省空间，易于更新。
- **Copy 模式**：每个 Agent 都有独立的技能文件副本。占用更多空间，但适用于不支持符号链接的系统。

## 许可证

MIT

## 贡献

欢迎贡献！请提交 Issue 或 Pull Request。

## 相关链接

- **项目仓库**：https://github.com/fakeAccount-lab/skill-installer
- **测试技能仓库**：https://github.com/fakeAccount-lab/skills-hub
- **问题反馈**：https://github.com/fakeAccount-lab/skill-installer/issues
