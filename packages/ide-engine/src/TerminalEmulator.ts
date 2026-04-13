import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { WebContainerProcess } from '@webcontainer/api';

export const WONDERSPACE_TERMINAL_THEME = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  cursor: '#58a6ff',
  cursorAccent: '#0d1117',
  selectionBackground: '#264f78',
  black: '#0d1117',
  red: '#ff7b72',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#c9d1d9',
  brightBlack: '#484f58',
  brightRed: '#ffa198',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#f0f6fc',
};

export class TerminalEmulator {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private container: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private shellProcess: WebContainerProcess | null = null;

  create(container: HTMLDivElement): void {
    this.container = container;

    this.terminal = new Terminal({
      theme: WONDERSPACE_TERMINAL_THEME,
      fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace',
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(container);

    setTimeout(() => this.fitAddon?.fit(), 100);

    this.resizeObserver = new ResizeObserver(() => {
      try {
        this.fitAddon?.fit();
      } catch {}
    });
    this.resizeObserver.observe(container);
  }

  async attachShell(spawnProcess: () => Promise<WebContainerProcess>): Promise<void> {
    if (!this.terminal) throw new Error('Terminal not created');

    this.shellProcess = await spawnProcess();

    this.shellProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminal?.write(data);
        },
      })
    );

    const writer = this.shellProcess.input.getWriter();
    this.terminal.onData((data) => {
      writer.write(data);
    });
  }

  fit(): void {
    this.fitAddon?.fit();
  }

  getDimensions(): { cols: number; rows: number } {
    if (!this.terminal) return { cols: 80, rows: 24 };
    return { cols: this.terminal.cols, rows: this.terminal.rows };
  }

  write(data: string): void {
    this.terminal?.write(data);
  }

  focus(): void {
    this.terminal?.focus();
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.terminal?.dispose();
    this.terminal = null;
    this.fitAddon = null;
    this.container = null;
    this.shellProcess = null;
  }
}
