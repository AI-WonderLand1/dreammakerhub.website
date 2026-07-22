import { Extension } from './types';

class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();

  public register(extension: Extension): void {
    if (this.extensions.has(extension.id)) {
      console.warn(`Extension ${extension.id} is already registered. Overwriting.`);
    }
    this.extensions.set(extension.id, extension);
  }

  public unregister(id: string): void {
    this.extensions.delete(id);
  }

  public get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  public getAll(): Extension[] {
    return Array.from(this.extensions.values());
  }

  public async loadDynamic(extensionUrl: string): Promise<Extension | null> {
    try {
      const module = await import(/* webpackIgnore: true */ extensionUrl);
      const extension: Extension = module.default || module;
      this.register(extension);
      return extension;
    } catch (err) {
      console.error(`Failed to load dynamic extension from ${extensionUrl}:`, err);
      return null;
    }
  }
}

export const extensionRegistry = new ExtensionRegistry();
