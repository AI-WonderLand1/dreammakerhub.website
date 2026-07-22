import chalk from 'chalk';
import path from 'path';
import { saveConfig } from '../core/config.js';
import ora from 'ora';
export function registerInitCommand(program) {
    program
        .command('init')
        .description('Initialize a new AIW builder project')
        .action(async () => {
        const spinner = ora('Initializing project...').start();
        const config = {
            version: '1.0.0',
            projectType: 'visual',
            assetsDir: 'assets',
            outputDir: 'dist',
        };
        try {
            saveConfig(process.cwd(), config);
            spinner.succeed(chalk.green('Initialized AI Wonderland builder project.'));
            console.log(chalk.gray(`Created ${path.join(process.cwd(), 'aiw.config.yaml')}`));
        }
        catch (error) {
            spinner.fail(chalk.red('Failed to initialize project.'));
            console.error(error);
        }
    });
}
