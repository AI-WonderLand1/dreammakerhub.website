import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
const ConfigSchema = z.object({
    version: z.string(),
    projectType: z.enum(['visual', 'code', 'mixed']),
    assetsDir: z.string().default('assets'),
    outputDir: z.string().default('dist'),
});
export const CONFIG_FILE = 'aiw.config.yaml';
export function loadConfig(projectRoot) {
    const configPath = path.join(projectRoot, CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
        throw new Error('Configuration file not found. Run "aiw init" to create one.');
    }
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const parsed = yaml.load(fileContent);
    return ConfigSchema.parse(parsed);
}
export function saveConfig(projectRoot, config) {
    const configPath = path.join(projectRoot, CONFIG_FILE);
    const yamlContent = yaml.dump(config);
    fs.writeFileSync(configPath, yamlContent, 'utf8');
}
