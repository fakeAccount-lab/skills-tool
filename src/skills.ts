import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, relative, resolve } from 'path';
import { existsSync } from 'fs';
import matter from 'gray-matter';
import type { Skill, SkillMetadata } from './types.js';

const STANDARD_SKILL_DIRS = [
  '',
  'skills',
  'skills/.curated',
  'skills/.experimental',
  'skills/.system',
  '.agents/skills',
  '.agent/skills',
  '.claude/skills',
  '.codex/skills',
  '.cursor/skills',
  '.cline/skills',
  '.codebuddy/skills',
  '.continue/skills',
  '.crush/skills',
  '.factory/skills',
  '.gemini/skills',
  '.github/skills',
  '.goose/skills',
  '.kilocode/skills',
  '.kiro/skills',
  '.mcpjam/skills',
  '.mux/skills',
  '.openhands/skills',
  '.opencode/skills',
  '.pi/skills',
  '.qoder/skills',
  '.qwen/skills',
  '.roo/skills',
  '.trae/skills',
  '.windsurf/skills',
  '.zencoder/skills',
];

const EXCLUDE_FILES = new Set(['metadata.json']);
const EXCLUDE_DIRS = new Set(['.git', '__pycache__', '__pypackages__', 'node_modules', 'dist']);

function isExcluded(name: string, isDirectory: boolean = false): boolean {
  if (EXCLUDE_FILES.has(name)) return true;
  if (name.startsWith('.')) return true;
  if (isDirectory && EXCLUDE_DIRS.has(name)) return true;
  return false;
}

/**
 * Parse SKILL.md file and extract metadata
 */
export function parseSkillMd(content: string): SkillMetadata | null {
  try {
    const { data } = matter(content);
    
    if (!data.name || !data.description) {
      return null;
    }

    return {
      name: String(data.name),
      description: String(data.description),
      internal: data.metadata?.internal === true || data.internal === true,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a directory contains a valid SKILL.md
 */
async function hasValidSkill(dir: string): Promise<boolean> {
  const skillMdPath = join(dir, 'SKILL.md');
  
  if (!existsSync(skillMdPath)) {
    return false;
  }

  try {
    const content = await readFile(skillMdPath, 'utf-8');
    const metadata = parseSkillMd(content);
    return metadata !== null;
  } catch {
    return false;
  }
}

/**
 * Recursively search for skills in a directory
 */
async function searchSkillsRecursive(
  rootDir: string,
  currentDir: string,
  maxDepth: number = 5
): Promise<Skill[]> {
  if (maxDepth <= 0) {
    return [];
  }

  const skills: Skill[] = [];

  try {
    // Check if current directory has a SKILL.md
    if (await hasValidSkill(currentDir)) {
      const skillMdPath = join(currentDir, 'SKILL.md');
      const content = await readFile(skillMdPath, 'utf-8');
      const metadata = parseSkillMd(content);

      if (metadata) {
        skills.push({
          name: metadata.name,
          description: metadata.description,
          path: currentDir,
          internal: metadata.internal,
          repository: rootDir,
        });
      }
    }

    // Search subdirectories
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !isExcluded(entry.name, true)) {
        const subSkills = await searchSkillsRecursive(
          rootDir,
          join(currentDir, entry.name),
          maxDepth - 1
        );
        skills.push(...subSkills);
      }
    }
  } catch {
    // Ignore errors
  }

  return skills;
}

/**
 * Discover skills in a repository
 */
export async function discoverSkills(repoDir: string, repositoryUrl: string): Promise<Skill[]> {
  const allSkills: Skill[] = [];

  // First, search in standard directories
  for (const dir of STANDARD_SKILL_DIRS) {
    const fullPath = join(repoDir, dir);

    if (!existsSync(fullPath)) {
      continue;
    }

    try {
      const statResult = await stat(fullPath);
      if (!statResult.isDirectory()) {
        continue;
      }

      // Check if directory itself has SKILL.md
      if (await hasValidSkill(fullPath)) {
        const skillMdPath = join(fullPath, 'SKILL.md');
        const content = await readFile(skillMdPath, 'utf-8');
        const metadata = parseSkillMd(content);

        if (metadata) {
          allSkills.push({
            name: metadata.name,
            description: metadata.description,
            path: fullPath,
            internal: metadata.internal,
            repository: repositoryUrl,
          });
        }
      }

      // Search subdirectories
      const entries = await readdir(fullPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !isExcluded(entry.name, true)) {
          const subDir = join(fullPath, entry.name);
          if (await hasValidSkill(subDir)) {
            const skillMdPath = join(subDir, 'SKILL.md');
            const content = await readFile(skillMdPath, 'utf-8');
            const metadata = parseSkillMd(content);

            if (metadata) {
              allSkills.push({
                name: metadata.name,
                description: metadata.description,
                path: subDir,
                internal: metadata.internal,
                repository: repositoryUrl,
              });
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // If no skills found in standard dirs, do recursive search
  if (allSkills.length === 0) {
    const recursiveSkills = await searchSkillsRecursive(repoDir, repoDir, 5);
    allSkills.push(...recursiveSkills);
  }

  // Deduplicate skills by name (keep first occurrence)
  const seenNames = new Set<string>();
  const uniqueSkills: Skill[] = [];

  for (const skill of allSkills) {
    if (!seenNames.has(skill.name)) {
      seenNames.add(skill.name);
      uniqueSkills.push(skill);
    }
  }

  return uniqueSkills;
}

/**
 * Find a specific skill by name
 */
export async function findSkillByName(
  repoDir: string,
  repositoryUrl: string,
  skillName: string
): Promise<Skill | null> {
  const skills = await discoverSkills(repoDir, repositoryUrl);
  return skills.find(s => s.name === skillName) || null;
}
