export const commands = {
  help: { cmd: 'help', desc: 'Show commands', run: (_, out) => out('help | clear | echo | build | status') },
  clear: { cmd: 'clear', desc: 'Clear screen', run: (_, out) => out('__CLEAR__') },
  echo: { cmd: 'echo', desc: 'Print text', run: (args, out) => out(args.join(' ')) },
  build: { cmd: 'build', desc: 'Build project', run: async (args, out) => { out('🚀 Building...'); await new Promise(r => setTimeout(r, 1000)); out('✅ Done'); }},
  status: { cmd: 'status', desc: 'System status', run: (_, out) => out('✅ All systems OK') }
};
export const exec = async (input, output) => {
  const [cmd, ...args] = input.trim().split(/\s+/);
  const command = commands[cmd];
  if (!command) return output('Command not found: ' + cmd);
  await command.run(args, output);
};
