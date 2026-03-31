#!/usr/bin/env node
import { intro, outro, text, cancel, isCancel, note, confirm } from '@clack/prompts';
import chalk from 'chalk';
import { parseArgs } from 'node:util';
import { cloneRepo, cleanupTempDir, normalizeGitUrl, GitCloneError } from './git.js';
import { discoverSkills, findSkillByName } from './skills.js';
import { getAgents, getAgent, getDefaultInstallMode, getDefaultAgent } from './config.js';
import { installSkill, isSkillInstalled, removeSkill, listInstalledSkills } from './installer.js';
import {
  selectAgentPrompt,
  selectSkillPrompt,
  resolveConflictPrompt,
  confirmInstallPrompt
} from './prompts.js';
import type { Skill, InstallMode } from './types.js';

const VERSION = '1.0.0';

function printUsage(): void {
  console.log(chalk.bold('Skill Installer v' + VERSION));
  console.log('');
  console.log('Usage:');
  console.log('  skill-installer add <repository> [options]');
  console.log('  skill-installer list <repository>');
  console.log('  skill-installer installed --agent <agent>');
  console.log('  skill-installer remove <skill-name> --agent <agent> [options]');
  console.log('  skill-installer agents');
  console.log('  skill-installer help');
  console.log('');
  console.log('Commands:');
  console.log('  add <repo>       Install skills from a Git repository');
  console.log('  list <repo>      List available skills in a repository');
  console.log('  installed        List installed skills for an agent');
  console.log('  remove <skill>   Remove an installed skill');
  console.log('  agents           List all supported agents');
  console.log('  help             Show this help message');
  console.log('');
  console.log('Options:');
  console.log('  --agent <name>       Target agent (e.g., openclaw, claude-code)');
  console.log('  --skill <name>       Specific skill to install (can be used multiple times)');
  console.log('  --global             Install to global directory instead of project');
  console.log('  --mode <mode>        Install mode: symlink or copy (default: symlink)');
  console.log('  --branch <branch>    Specific branch to clone');
  console.log('  --yes                Skip confirmation prompts');
  console.log('');
  console.log('Examples:');
  console.log('  skill-installer add fakeAccount-lab/skills-hub --agent openclaw');
  console.log('  skill-installer add git@github.com:owner/repo.git --agent claude-code --global');
  console.log('  skill-installer list fakeAccount-lab/skills-hub');
  console.log('  skill-installer remove weather --agent openclaw');
  console.log('  skill-installer remove weather --agent openclaw --global');
  console.log('  skill-installer agents');
}

async function cmdAdd(args: any): Promise<void> {
  if (!args._.length) {
    console.error(chalk.red('Error: Repository URL is required'));
    console.log('');
    printUsage();
    process.exit(1);
  }

  const repoUrl = args._[0] as string;
  const { url: normalizedUrl, ref } = normalizeGitUrl(repoUrl, args.branch);

  intro(chalk.cyan('📦 Skill Installer'));

  // Clone repository
  const repoDir = await cloneRepo(normalizedUrl, ref);
  console.log(chalk.green(`✓ Cloned repository: ${normalizedUrl}`));

  try {
    // Discover skills
    const skills = await discoverSkills(repoDir, normalizedUrl);

    if (skills.length === 0) {
      console.log(chalk.yellow('⚠ No skills found in repository'));
      await cleanupTempDir(repoDir);
      return;
    }

    console.log(chalk.gray(`Found ${skills.length} skill(s)`));

    // Filter skills if specified
    let selectedSkills: Skill[] = skills;
    if (args.skill && args.skill.length > 0) {
      const skillNames = args.skill as string[];
      
      // Check for conflicts (same name from different sources)
      const nameGroups = new Map<string, Skill[]>();
      for (const skill of skills) {
        if (skillNames.includes(skill.name)) {
          if (!nameGroups.has(skill.name)) {
            nameGroups.set(skill.name, []);
          }
          nameGroups.get(skill.name)!.push(skill);
        }
      }

      selectedSkills = [];
      for (const name of skillNames) {
        const group = nameGroups.get(name);
        
        if (!group || group.length === 0) {
          console.log(chalk.yellow(`⚠ Skill "${name}" not found`));
          continue;
        }

        if (group.length > 1) {
          // Conflict: multiple skills with same name
          console.log(chalk.yellow(`⚠ Multiple skills found with name "${name}"`));
          
          const conflictOptions = await Promise.all(
            group.map(async (skill) => {
              // Check if already installed (requires agent info)
              return { skill, installed: false };
            })
          );

          const selected = await resolveConflictPrompt(name, conflictOptions);
          if (isCancel(selected)) {
            await cleanupTempDir(repoDir);
            return;
          }
          selectedSkills.push(selected as Skill);
        } else {
          selectedSkills.push(group[0]);
        }
      }

      if (selectedSkills.length === 0) {
        console.log(chalk.yellow('No valid skills selected'));
        await cleanupTempDir(repoDir);
        return;
      }
    } else {
      // Interactive skill selection
      const selected = await selectSkillPrompt(skills, true);
      if (isCancel(selected)) {
        await cleanupTempDir(repoDir);
        return;
      }
      selectedSkills = Array.isArray(selected) ? selected : [selected];
    }

    // Get agents
    const agents = getAgents();
    const availableAgents = Object.entries(agents);

    if (availableAgents.length === 0) {
      console.log(chalk.red('✗ No agents configured'));
      await cleanupTempDir(repoDir);
      return;
    }

    // Select agents
    let targetAgents: string[] = [];
    if (args.agent) {
      if (Array.isArray(args.agent)) {
        targetAgents = args.agent as string[];
      } else {
        targetAgents = [args.agent];
      }
      
      // Validate agents
      const invalidAgents = targetAgents.filter(a => !agents[a]);
      if (invalidAgents.length > 0) {
        console.log(chalk.yellow(`⚠ Unknown agent(s): ${invalidAgents.join(', ')}`));
        targetAgents = targetAgents.filter(a => agents[a]);
      }
    } else {
      // Interactive agent selection
      const selected = await selectAgentPrompt(agents, true);
      if (isCancel(selected)) {
        await cleanupTempDir(repoDir);
        return;
      }
      targetAgents = Array.isArray(selected) ? selected : [selected];
    }

    if (targetAgents.length === 0) {
      console.log(chalk.red('✗ No agents selected'));
      await cleanupTempDir(repoDir);
      return;
    }

    // Confirm installation
    if (!args.yes) {
      const confirmed = await confirmInstallPrompt(selectedSkills, targetAgents);
      if (isCancel(confirmed) || !confirmed) {
        console.log(chalk.gray('Installation cancelled'));
        await cleanupTempDir(repoDir);
        return;
      }
    }

    // Install skills to agents
    const mode = args.mode as InstallMode || getDefaultInstallMode();
    const isGlobal = args.global || false;

    let successCount = 0;
    let failCount = 0;

    for (const agentName of targetAgents) {
      const agent = getAgent(agentName);
      if (!agent) {
        console.log(chalk.yellow(`⚠ Agent "${agentName}" not found`));
        continue;
      }

      for (const skill of selectedSkills) {
        const result = await installSkill(skill, agent, { global: isGlobal, mode });

        if (result.success) {
          const modeStr = result.symlinkFailed ? 'copy (symlink failed)' : result.mode;
          console.log(chalk.green(`✓ Installed "${skill.name}" to ${agent.displayName} (${modeStr})`));
          successCount++;
        } else {
          console.log(chalk.red(`✗ Failed to install "${skill.name}" to ${agent.displayName}: ${result.error}`));
          failCount++;
        }
      }
    }

    outro(chalk.cyan(`✨ Done! ${successCount} installed, ${failCount} failed`));
  } finally {
    await cleanupTempDir(repoDir);
  }
}

async function cmdList(args: any): Promise<void> {
  if (!args._.length) {
    console.error(chalk.red('Error: Repository URL is required'));
    process.exit(1);
  }

  const repoUrl = args._[0] as string;
  const { url: normalizedUrl, ref } = normalizeGitUrl(repoUrl, args.branch);

  intro(chalk.cyan('📋 Listing Skills'));

  // Clone repository
  const repoDir = await cloneRepo(normalizedUrl, ref);
  
  try {
    const skills = await discoverSkills(repoDir, normalizedUrl);

    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found in repository'));
      return;
    }

    console.log('');
    console.log(chalk.bold(`Found ${skills.length} skill(s):`));
    console.log('');

    for (const skill of skills) {
      console.log(chalk.cyan(`• ${skill.name}`));
      console.log(chalk.gray(`  ${skill.description}`));
      if (skill.internal) {
        console.log(chalk.gray(`  (internal skill)`));
      }
      console.log('');
    }

    outro(chalk.cyan(`✨ Listed ${skills.length} skill(s)`));
  } finally {
    await cleanupTempDir(repoDir);
  }
}

async function cmdInstalled(args: any): Promise<void> {
  if (!args.agent) {
    console.error(chalk.red('Error: --agent is required'));
    console.log('');
    console.log('Usage: skill-installer installed --agent <agent> [--global]');
    console.log('Use "skill-installer agents" to see all available agents');
    process.exit(1);
  }

  const agentName = args.agent;
  const agent = getAgent(agentName);

  if (!agent) {
    console.error(chalk.red(`Error: Agent "${agentName}" not found`));
    console.log('');
    console.log('Use "skill-installer agents" to see all available agents');
    process.exit(1);
  }

  const isGlobal = args.global || false;

  intro(chalk.cyan('📋 Installed Skills'));

  const skills = await listInstalledSkills(agent, { global: isGlobal });

  if (skills.length === 0) {
    console.log(chalk.yellow(`No skills installed for ${agent.displayName}`));
    console.log('');
    console.log(chalk.gray(`Agent: ${agent.name}`));
    console.log(chalk.gray(`Path: ${isGlobal && agent.globalSkillsDir ? agent.globalSkillsDir : agent.skillsDir}`));
    console.log('');
    console.log(chalk.gray(`Use "skill-installer add <repo> --agent ${agentName}" to install skills`));
    return;
  }

  console.log('');
  console.log(chalk.bold(`Agent: ${agent.displayName} (${agent.name})`));
  console.log(chalk.gray(`Path: ${isGlobal && agent.globalSkillsDir ? agent.globalSkillsDir : agent.skillsDir}`));
  console.log('');
  console.log(chalk.bold(`Found ${skills.length} skill(s):`));
  console.log('');

  for (const skill of skills) {
    console.log(chalk.cyan(`• ${skill.name}`));
    console.log(chalk.gray(`  ${skill.description}`));
    console.log(chalk.gray(`  Path: ${skill.path}`));
    if (skill.internal) {
      console.log(chalk.gray(`  Type: internal`));
    }
    if (skill.repository) {
      console.log(chalk.gray(`  Source: ${skill.repository}`));
    }
    console.log('');
  }

  outro(chalk.cyan(`✨ Listed ${skills.length} skill(s)`));
}

async function cmdRemove(args: any): Promise<void> {
  if (!args._.length) {
    console.error(chalk.red('Error: Skill name is required'));
    console.log('');
    console.log('Usage: skill-installer remove <skill-name> --agent <agent> [--global]');
    console.log('Use "skill-installer installed --agent <agent>" to see installed skills');
    process.exit(1);
  }

  const skillName = args._[0] as string;

  if (!args.agent) {
    console.error(chalk.red('Error: --agent is required'));
    console.log('');
    console.log('Usage: skill-installer remove <skill-name> --agent <agent> [--global]');
    console.log('Use "skill-installer agents" to see all available agents');
    process.exit(1);
  }

  const agentName = args.agent;
  const agent = getAgent(agentName);

  if (!agent) {
    console.error(chalk.red(`Error: Agent "${agentName}" not found`));
    console.log('');
    console.log('Use "skill-installer agents" to see all available agents');
    process.exit(1);
  }

  const isGlobal = args.global || false;

  intro(chalk.cyan('🗑️  Removing Skill'));

  // Check if skill is installed
  const isInstalled = await isSkillInstalled(skillName, agent, { global: isGlobal });

  if (!isInstalled) {
    console.log(chalk.yellow(`Skill "${skillName}" is not installed for ${agent.displayName}`));
    console.log('');
    console.log(chalk.gray(`Use "skill-installer installed --agent ${agentName}" to see installed skills`));
    return;
  }

  // Confirm removal
  if (!args.yes) {
    const confirmed = await confirm({
      message: `Remove skill "${skillName}" from ${agent.displayName}?`,
    });

    if (isCancel(confirmed) || !confirmed) {
      console.log(chalk.gray('Removal cancelled'));
      return;
    }
  }

  // Remove skill
  const result = await removeSkill(skillName, agent, { global: isGlobal });

  if (result.success) {
    console.log(chalk.green(`✓ Removed "${skillName}" from ${agent.displayName}`));
  } else {
    console.log(chalk.red(`✗ Failed to remove "${skillName}": ${result.error}`));
  }

  outro(chalk.cyan('✨ Done!'));
}

async function cmdAgents(): Promise<void> {
  intro(chalk.cyan('🤖 Supported Agents'));

  const agents = getAgents();
  const agentEntries = Object.entries(agents);

  if (agentEntries.length === 0) {
    console.log(chalk.yellow('No agents configured'));
    return;
  }

  console.log('');
  console.log(chalk.bold(`Found ${agentEntries.length} agent(s):`));
  console.log('');

  for (const [name, agent] of agentEntries) {
    console.log(chalk.cyan(`• ${agent.displayName}`));
    console.log(chalk.gray(`  Name: ${name}`));
    console.log(chalk.gray(`  Skills Directory: ${agent.skillsDir}`));
    if (agent.globalSkillsDir) {
      console.log(chalk.gray(`  Global Skills Directory: ${agent.globalSkillsDir}`));
    } else {
      console.log(chalk.gray(`  Global Skills Directory: not supported`));
    }

    // Check if agent is installed
    if (agent.detectInstalled) {
      const isInstalled = await agent.detectInstalled();
      if (isInstalled) {
        console.log(chalk.green(`  Status: ✓ installed`));
      } else {
        console.log(chalk.gray(`  Status: not detected`));
      }
    }

    console.log('');
  }

  outro(chalk.cyan(`✨ Listed ${agentEntries.length} agent(s)`));
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      agent: {
        type: 'string',
        multiple: true,
      },
      skill: {
        type: 'string',
        multiple: true,
      },
      global: {
        type: 'boolean',
      },
      mode: {
        type: 'string',
      },
      branch: {
        type: 'string',
      },
      yes: {
        type: 'boolean',
      },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  switch (command) {
    case 'add':
      await cmdAdd({ ...values, _: positionals.slice(1) });
      break;
    case 'list':
      await cmdList({ ...values, _: positionals.slice(1) });
      break;
    case 'installed':
      await cmdInstalled(values);
      break;
    case 'remove':
      await cmdRemove({ ...values, _: positionals.slice(1) });
      break;
    case 'agents':
      await cmdAgents();
      break;
    case 'help':
    case undefined:
      printUsage();
      break;
    default:
      console.error(chalk.red(`Error: Unknown command "${command}"`));
      console.log('');
      printUsage();
      process.exit(1);
  }
}

main().catch(error => {
  if (error instanceof GitCloneError) {
    console.error(chalk.red(error.message));
  } else {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  }
  process.exit(1);
});
