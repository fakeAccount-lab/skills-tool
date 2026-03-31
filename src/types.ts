export type AgentType = string;
export type InstallMode = 'symlink' | 'copy';

export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir?: string;
  detectInstalled?: () => Promise<boolean>;
}

export interface Skill {
  name: string;
  description: string;
  path: string;
  internal?: boolean;
  repository?: string;
}

export interface SkillMetadata {
  name: string;
  description: string;
  internal?: boolean;
}

export interface InstallResult {
  success: boolean;
  path: string;
  canonicalPath?: string;
  mode: InstallMode;
  symlinkFailed?: boolean;
  error?: string;
}

export interface Config {
  agents?: Record<string, AgentConfig>;
  defaultInstallMode?: InstallMode;
  defaultAgent?: string;
}

export interface SkillHubIndex {
  version: string;
  skills: SkillHubEntry[];
}

export interface SkillHubEntry {
  name: string;
  description: string;
  path: string;
}
