# Skill Installer

A CLI tool for installing Agent Skills from Git repositories to various coding agents.

## Features

- 📦 Install skills from Git repositories (GitHub, GitLab, etc.)
- 🎯 Support for multiple agents (OpenClaw, Claude Code, Codex, Cursor, OpenCode, etc.)
- 🔗 Symlink mode (recommended) or Copy mode
- 🌍 Global and project-level installation
- 🎨 Interactive CLI with beautiful prompts
- ⚡ Fast shallow clones
- 🔒 Path traversal protection
- 📋 List available skills in a repository

## Installation

```bash
npm install -g @fakeaccount-lab/skill-installer
```

Or use directly with npx:

```bash
npx @fakeaccount-lab/skill-installer add fakeAccount-lab/skills-hub
```

## Usage

### Add skills from a repository

```bash
# Interactive mode (select skills and agents)
skill-installer add fakeAccount-lab/skills-hub

# Install to specific agent
skill-installer add fakeAccount-lab/skills-hub --agent openclaw

# Install globally
skill-installer add fakeAccount-lab/skills-hub --agent openclaw --global

# Install specific skills
skill-installer add fakeAccount-lab/skills-hub --agent openclaw --skill weather --skill git-helper

# Install to multiple agents
skill-installer add fakeAccount-lab/skills-hub --agent openclaw --agent claude-code

# Use copy mode instead of symlink
skill-installer add fakeAccount-lab/skills-hub --agent openclaw --mode copy

# Skip confirmation prompts
skill-installer add fakeAccount-lab/skills-hub --agent openclaw --yes

# Clone specific branch
skill-installer add fakeAccount-lab/skills-hub --agent openclaw --branch main
```

### List available skills in a repository

```bash
skill-installer list fakeAccount-lab/skills-hub
```

### List installed skills

```bash
skill-installer installed --agent openclaw
skill-installer installed --agent openclaw --global
```

## Supported Agents

| Agent | Name | Project Path | Global Path |
|-------|------|--------------|-------------|
| OpenClaw | `openclaw` | `./skills/` | `~/.openclaw/skills/` |
| Claude Code | `claude-code` | `./.claude/skills/` | `~/.claude/skills/` |
| Codex | `codex` | `./.codex/skills/` | `~/.codex/skills/` |
| Cursor | `cursor` | `./.cursor/skills/` | `~/.cursor/skills/` |
| OpenCode | `opencode` | `./.agents/skills/` | `~/.config/opencode/skills/` |

## Installation Modes

### Symlink Mode (Recommended)

- Skills are copied to a canonical location: `.agents/skills/<skill-name>/`
- Symlinks are created from agent directories to the canonical location
- Benefits: Single source of truth, easy updates, saves disk space
- Fallback to copy mode if symlinks fail

### Copy Mode

- Skills are copied directly to each agent directory
- Benefits: Independent copies, works on systems without symlink support
- Drawbacks: More disk usage, need to update each copy separately

## Configuration

Customize agents and settings via configuration file:

```bash
# Configuration directory
~/.config/skill-installer/config.json
```

Example configuration:

```json
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "my-custom-agent": {
      "name": "my-custom-agent",
      "displayName": "My Custom Agent",
      "skillsDir": ".my-agent/skills",
      "globalSkillsDir": "~/.my-agent/skills"
    }
  }
}
```

## Repository URL Formats

The tool supports various Git repository URL formats:

- GitHub shorthand: `owner/repo`
- Full HTTPS URL: `https://github.com/owner/repo`
- SSH URL: `git@github.com:owner/repo.git`
- With branch: `owner/repo#branch`
- Local path: `./local-repo`

## Skill Format

Skills must contain a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does and when to use it
---

## Steps

1. First do this
2. Then do that
```

Required fields:
- `name`: Unique identifier (lowercase, hyphens allowed)
- `description`: Brief explanation of what the skill does

Optional fields:
- `metadata.internal: true` - Mark as internal skill (hidden by default)

## Conflict Resolution

When installing skills with the same name from different sources, the tool will:

1. Detect the conflict
2. Show an interactive prompt with details:
   - Skill name and description
   - Source repository
   - Installation status
3. Let you choose which one to install

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Format code
npm run format

# Type check
npm tsc --noEmit
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
