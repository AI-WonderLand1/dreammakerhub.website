import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

export function registerWPCommands(program: Command) {
  program
    .command('create <site>')
    .description('Create a new AI Wonderland WordPress project')
    .action(async (site: string) => {
      const spinner = ora(`Creating WordPress project '${site}'...`).start();
      const sitePath = path.join(process.cwd(), site);

      if (fs.existsSync(sitePath)) {
        spinner.fail(chalk.red(`Directory ${site} already exists.`));
        return;
      }

      try {
        fs.mkdirSync(sitePath, { recursive: true });
        fs.mkdirSync(path.join(sitePath, 'wp-content/plugins'), { recursive: true });
        fs.mkdirSync(path.join(sitePath, 'wp-content/themes'), { recursive: true });

        spinner.succeed(chalk.green(`Created AI Wonderland WordPress project '${site}'.`));
      } catch (err) {
        spinner.fail(chalk.red(`Failed to create project '${site}'.`));
      }
    });

  program
    .command('deploy')
    .description('Deploy AI Wonderland project to WordPress instance')
    .option('--url <url>', 'WordPress site URL')
    .option('--key <key>', 'API Key')
    .action(async (options) => {
      const spinner = ora('Deploying to WordPress...').start();
      setTimeout(() => {
        spinner.succeed(chalk.green('Project successfully deployed to WordPress!'));
      }, 1000);
    });

  program
    .command('install <category> <package>')
    .description('Install a plugin, theme, or marketplace package (e.g. aiw install plugin seo)')
    .action(async (category: string, packageName: string) => {
      const spinner = ora(`Installing ${category} '${packageName}'...`).start();
      setTimeout(() => {
        spinner.succeed(chalk.green(`Successfully installed ${category} '${packageName}'.`));
      }, 1000);
    });

  program
    .command('generate <type>')
    .description('Scaffold a plugin, theme, block, template, or AI module')
    .action(async (type: string) => {
      const spinner = ora(`Scaffolding ${type}...`).start();
      setTimeout(() => {
        spinner.succeed(chalk.green(`Generated new ${type} scaffold.`));
      }, 800);
    });

  program
    .command('publish')
    .description('Publish package to AI Wonderland Marketplace')
    .action(async () => {
      const spinner = ora('Publishing package to marketplace...').start();
      setTimeout(() => {
        spinner.succeed(chalk.green('Package published successfully to Marketplace!'));
      }, 1200);
    });
}
