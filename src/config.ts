import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { xdgConfig } from 'xdg-basedir';
import type { Config, AgentConfig } from './types.js';
import { DEFAULT_AGENTS } from './agents.js';

const configHome = xdgConfig || join(homedir(), '.config');
const CONFIG_DIR = join(configHome, 'skill-installer');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getAgents(): Record<string, AgentConfig> {
  const config = loadConfig();
  
  // Merge custom agents with default agents
  const customAgents = config.agents || {};
  
  return {
    ...DEFAULT_AGENTS,
    ...customAgents
  };
}

export function getAgent(agentType: string): AgentConfig | undefined {
  const agents = getAgents();
  return agents[agentType];
}

export function getDefaultInstallMode(): 'symlink' | 'copy' {
  const config = loadConfig();
  return config.defaultInstallMode || 'symlink';
}

export function getDefaultAgent(): string | undefined {
  const config = loadConfig();
  return config.defaultAgent;
}
