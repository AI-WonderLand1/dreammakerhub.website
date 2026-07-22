import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { saveConfig } from '../core/config.js';
export function registerNewCommand(program) {
    program
        .command('new <project>')
        .description('Create a new AIW builder project directory')
        .action(async (project) => {
        const projectPath = path.join(process.cwd(), project);
        const spinner = ora(`Creating project ${project}...`).start();
        if (fs.existsSync(projectPath)) {
            spinner.fail(chalk.red(`Directory ${project} already exists.`));
            return;
        }
        try {
            fs.mkdirSync(projectPath);
            fs.mkdirSync(path.join(projectPath, 'assets'));
            saveConfig(projectPath, {
                version: '1.0.0',
                projectType: 'visual',
                assetsDir: 'assets',
                outputDir: 'dist',
            });
            spinner.succeed(chalk.green(`Created project ${project}.`));
        }
        catch (error) {
            spinner.fail(chalk.red(`Failed to create project ${project}.`));
            console.error(error);
        }
    });
}
