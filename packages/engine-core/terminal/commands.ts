export type CommandOutput = (text: string) => void;
export type CommandHandler = (args: string[], out: CommandOutput) => void | Promise<void>;

export interface TerminalCommand {
  cmd: string;
  desc: string;
  run: CommandHandler;
}

export const commands: Record<string, TerminalCommand> = {
  help: { cmd: 'help', desc: 'Show commands', run: (_: string[], out: CommandOutput) => out('help | clear | echo | build | status') },
  clear: { cmd: 'clear', desc: 'Clear screen', run: (_: string[], out: CommandOutput) => out('__CLEAR__') },
  echo: { cmd: 'echo', desc: 'Print text', run: (args: string[], out: CommandOutput) => out(args.join(' ')) },
  build: { cmd: 'build', desc: 'Build project', run: async (_: string[], out: CommandOutput) => { out('Building...'); await new Promise(r => setTimeout(r, 1000)); out('Done'); }},
  status: { cmd: 'status', desc: 'System status', run: (_: string[], out: CommandOutput) => out('All systems OK') }
};

export const exec = async (input: string, output: CommandOutput): Promise<void> => {
  const [cmd, ...args] = input.trim().split(/\s+/);
  const command = commands[cmd];
  if (!command) {
    output('Command not found: ' + cmd);
    return;
  }
  await command.run(args, output);
};
