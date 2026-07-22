import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerNewCommand } from './commands/new.js';
import { registerBuildCommand } from './commands/build.js';
import { registerWPCommands } from './commands/wordpress.js';
const program = new Command();
program
    .name('aiw')
    .description('AI Wonderland Builder CLI')
    .version('1.0.0');
registerInitCommand(program);
registerNewCommand(program);
registerBuildCommand(program);
registerWPCommands(program);
program.parse(process.argv);
