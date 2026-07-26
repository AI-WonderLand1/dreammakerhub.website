#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexFile = join(__dirname, '../src/index.ts');
const tsxPath = join(__dirname, '../node_modules/.bin/tsx');

spawn(tsxPath, [indexFile, ...process.argv.slice(2)], { stdio: 'inherit' });
