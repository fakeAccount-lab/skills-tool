import { select, multiselect, confirm } from '@clack/prompts';
import type { Skill, AgentConfig } from './types.js';

/**
 * Prompt user to select agent(s)
 */
export async function selectAgentPrompt(agents: Record<string, AgentConfig>, multiple: boolean = false): Promise<string | string[] | symbol> {
  const options = Object.entries(agents).map(([key, agent]) => ({
    value: key,
    label: agent.displayName,
  }));

  if (multiple) {
    return await multiselect({
      message: 'Select agent(s) to install to:',
      options,
      required: true,
    });
  } else {
    return await select({
      message: 'Select agent to install to:',
      options,
    });
  }
}

/**
 * Prompt user to select skill(s)
 */
export async function selectSkillPrompt(skills: Skill[], multiple: boolean = false): Promise<Skill | Skill[] | symbol> {
  const options = skills.map(skill => ({
    value: skill,
    label: skill.name,
    description: skill.description,
  }));

  if (multiple) {
    const selected = await multiselect({
      message: 'Select skill(s) to install:',
      options,
      required: true,
    });
    return selected as Skill[];
  } else {
    return await select({
      message: 'Select skill to install:',
      options,
    }) as Skill | symbol;
  }
}

/**
 * Prompt user to choose between conflicting skills (same name, different source)
 */
export async function resolveConflictPrompt(
  skillName: string,
  options: Array<{ skill: Skill; installed?: boolean }>
): Promise<Skill | symbol> {
  const promptOptions = options.map((opt, index) => ({
    value: opt.skill,
    label: opt.skill.name,
    description: `${opt.skill.description}\n  Source: ${opt.skill.repository || 'unknown'}${opt.installed ? ' (already installed)' : ''}`,
  }));

  return await select({
    message: `Multiple skills found with name "${skillName}". Which one would you like to install?`,
    options: promptOptions,
  }) as Skill | symbol;
}

/**
 * Confirm installation
 */
export async function confirmInstallPrompt(
  skills: Skill[],
  agents: string[]
): Promise<boolean | symbol> {
  const skillNames = skills.map(s => s.name).join(', ');
  const agentNames = agents.join(', ');

  return await confirm({
    message: `Install ${skillNames} to ${agentNames}?`,
  });
}
