# Windows 系统配置指南

本文档详细说明如何在 Windows 系统上配置和使用 skill-installer。

## ⚠️ 重要说明

在 Windows 系统上，由于路径和工作目录的问题，需要特别注意配置方法。

### 为什么原来的方法不行？

`bin/skill-installer.js` 文件使用了相对路径 `import('../dist/cli.js')` 来导入主程序。虽然这个相对路径是相对于调用文件的位置解析的，但在 Windows 上配置全局命令时，可能会遇到以下问题：

1. **工作目录问题**：批处理文件需要正确设置工作目录
2. **路径分隔符问题**：Windows 使用反斜杠 `\`，而 Unix 使用正斜杠 `/`
3. **PATH 环境变量问题**：添加到 PATH 的目录需要包含可执行文件

## ✅ 推荐配置方法

### 方法 A：使用批处理文件（最简单）

#### 步骤 1：克隆并构建

```powershell
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖并构建
npm install && npm run build
```

#### 步骤 2：验证本地运行

```powershell
# 在项目根目录下测试
node dist/cli.js --help
```

**预期输出**：
```
Skill Installer v1.0.0

Usage:
  skill-installer add <repository> [options]
  ...
```

#### 步骤 3：配置全局命令

项目根目录已经包含一个 `skill-installer.bat` 文件，其内容如下：

```batch
@echo off
REM Skill Installer - Windows Batch Script
REM This script sets the working directory to the script's location
REM and then runs the main CLI.

cd /d "%~dp0"
node dist\cli.js %*
```

这个批处理文件会：
1. 切换到脚本所在的目录（项目根目录）
2. 运行 `node dist\cli.js` 并传递所有参数

#### 步骤 4：将批处理文件添加到 PATH

**选项 1：复制到 WindowsApps 目录**

```powershell
# 复制批处理文件到系统目录
copy skill-installer.bat C:\Users\YourName\AppData\Local\Microsoft\WindowsApps\

# 注意：需要管理员权限
```

**选项 2：创建专门的 bin 目录**

```powershell
# 创建 bin 目录
mkdir C:\Users\YourName\bin

# 复制批处理文件
copy skill-installer.bat C:\Users\YourName\bin\

# 将 C:\Users\YourName\bin 添加到 PATH 环境变量
```

**选项 3：直接添加项目目录到 PATH**

```powershell
# 获取当前目录的完整路径
pwd

# 将以下路径添加到 PATH 环境变量：
# C:\Users\YourName\skill-installer
```

#### 步骤 5：添加 PATH 环境变量

1. 右键点击"此电脑" → "属性"
2. 点击"高级系统设置"
3. 点击"环境变量"
4. 在"用户变量"或"系统变量"中找到 `Path`，点击"编辑"
5. 点击"新建"，添加你的路径（例如 `C:\Users\YourName\bin` 或 `C:\Users\YourName\skill-installer`）
6. 点击"确定"保存
7. **重启终端**或**重新登录**以使更改生效

#### 步骤 6：验证配置

```powershell
# 重启终端后，从任意目录测试
skill-installer --help

# 或者在任意目录运行
cd C:\
skill-installer agents
```

---

### 方法 B：PowerShell 别名（适用于 PowerShell 用户）

#### 步骤 1：克隆并构建

```powershell
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer
npm install && npm run build
```

#### 步骤 2：编辑 PowerShell 配置文件

```powershell
# 编辑配置文件
notepad $PROFILE

# 如果提示文件不存在，选择"是"创建新文件
```

#### 步骤 3：添加别名

在配置文件中添加以下内容（**替换为你的实际路径**）：

```powershell
# Skill Installer
function skill-installer {
    node C:\Users\YourName\skill-installer\dist\cli.js $args
}
```

**更高级的版本**（自动检测项目位置）：

```powershell
# Skill Installer - 自动查找项目位置
function skill-installer {
    $possiblePaths = @(
        "$HOME\skill-installer",
        "$HOME\projects\skill-installer",
        "$HOME\Documents\skill-installer"
    )

    $projectPath = $possiblePaths | Where-Object { Test-Path (Join-Path $_ "dist\cli.js") } | Select-Object -First 1

    if ($projectPath) {
        node (Join-Path $projectPath "dist\cli.js") $args
    } else {
        Write-Error "skill-installer project not found. Please check the path in your PowerShell profile."
    }
}
```

#### 步骤 4：重新加载配置

```powershell
# 重新加载配置文件
. $PROFILE

# 或者重启 PowerShell
```

#### 步骤 5：验证

```powershell
skill-installer --help
```

---

### 方法 C：使用 Git Bash（如果已安装）

如果你使用 Git Bash，可以创建一个 bash 脚本：

#### 步骤 1：克隆并构建

```bash
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer
npm install && npm run build
```

#### 步骤 2：创建脚本

```bash
# 转换 Windows 路径为 Git Bash 格式
# C:\Users\YourName\skill-installer -> /c/Users/YourName/skill-installer

cat > /usr/local/bin/skill-installer << 'EOF'
#!/bin/bash
cd /c/Users/YourName/skill-installer
node dist/cli.js "$@"
EOF

# 添加执行权限
chmod +x /usr/local/bin/skill-installer
```

#### 步骤 3：验证

```bash
skill-installer --help
```

---

## 🧪 测试配置

无论使用哪种方法，配置完成后都应该能够：

1. **从任意目录运行命令**

```powershell
cd C:\
skill-installer --help
```

2. **查看支持的 agents**

```powershell
skill-installer agents
```

3. **列出仓库中的技能**

```powershell
skill-installer list fakeAccount-lab/skills-hub
```

---

## 🔍 故障排除

### 问题 1：找不到命令

**症状**：`'skill-installer' 不是内部或外部命令`

**解决方案**：
1. 确认已将正确的目录添加到 PATH
2. 重启终端或重新登录
3. 检查批处理文件是否存在：`dir C:\Users\YourName\bin\skill-installer.bat`

### 问题 2：批处理文件运行失败

**症状**：运行 `skill-installer` 时提示找不到文件

**解决方案**：
1. 检查批处理文件中的路径是否正确
2. 确认 `dist/cli.js` 文件存在
3. 尝试直接运行：`node dist/cli.js --help`

### 问题 3：PowerShell 别名不生效

**症状**：`skill-installer` 命令无法使用

**解决方案**：
1. 确认配置文件路径正确：`$PROFILE`
2. 重新加载配置：`. $PROFILE`
3. 检查别名是否定义：`Get-Command skill-installer`

### 问题 4：Git Bash 脚本无法运行

**症状**：Permission denied 或找不到文件

**解决方案**：
1. 确认脚本有执行权限：`ls -l /usr/local/bin/skill-installer`
2. 检查路径是否正确（Git Bash 使用 `/c/Users/` 格式）
3. 确认 node 在 PATH 中：`which node`

---

## 📝 批处理文件说明

`skill-installer.bat` 文件的详细说明：

```batch
@echo off                    # 关闭命令回显
REM ...                      # 注释说明
cd /d "%~dp0"               # 切换到批处理文件所在的目录
node dist\cli.js %*         # 运行 node 并传递所有参数
```

**关键命令解释**：

- `@echo off`：不显示批处理文件的命令本身
- `cd /d "%~dp0"`：
  - `%~dp0`：批处理文件所在的驱动器和路径
  - `/d`：允许切换驱动器
- `node dist\cli.js %*`：
  - `node`：Node.js 运行时
  - `dist\cli.js`：主程序文件
  - `%*`：所有传递给批处理文件的参数

---

## 🎯 最佳实践

1. **使用批处理文件**：这是最简单且最可靠的方法
2. **避免直接使用 bin 目录**：`bin/skill-installer.js` 使用相对路径，可能会出问题
3. **始终从项目根目录运行**：或者使用批处理文件确保正确的工作目录
4. **测试配置**：从不同的目录运行命令以验证配置正确性
5. **使用完整的路径**：在 PowerShell 别名中使用完整路径更可靠

---

## 📚 相关文档

- [README.md](README.md) - 主要文档
- [ADD_CUSTOM_AGENT.md](ADD_CUSTOM_AGENT.md) - 添加自定义 agent
- [EXAMPLE_ADD_AGENT.md](EXAMPLE_ADD_AGENT.md) - 配置示例
