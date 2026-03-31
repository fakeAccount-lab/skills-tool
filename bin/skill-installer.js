#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import cli.js using absolute path
import(join(__dirname, '../dist/cli.js')).catch(error => {
  console.error(error);
  process.exit(1);
});
