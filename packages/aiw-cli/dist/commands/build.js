import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../core/config.js';
export function registerBuildCommand(program) {
    program
        .command('build')
        .description('Build the project')
        .action(async () => {
        const spinner = ora('Building project...').start();
        try {
            const config = loadConfig(process.cwd());
            // Placeholder for actual build logic
            spinner.succeed(chalk.green(`Built project with type: ${config.projectType}`));
        }
        catch (error) {
            spinner.fail(chalk.red('Failed to build project.'));
            console.error(error.message);
        }
    });
}
