import fs from 'fs';
import path from 'path';

// Define where the components live
const COMPONENTS_DIR = path.resolve(process.cwd(), 'ui/components');
// Where the builder reads its "truth"
const REGISTRY_OUTPUT = path.resolve(process.cwd(), 'engine/core/assets/component-registry.json');

export function buildComponentRegistry() {
  const registry: Record<string, any> = {};

  const scanDir = (dir: string) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.tsx')) {
        const componentName = file.replace('.tsx', '');
        // Simple regex to find exported props interface or type
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        registry[componentName.toLowerCase()] = {
          name: componentName,
          path: fullPath.split('ui/components')[1],
          // Middleware magic: extract props metadata for the agents
          props: extractPropsMetadata(content),
          category: dir.split('/').pop()
        };
      }
    }
  };

  scanDir(COMPONENTS_DIR);
  fs.writeFileSync(REGISTRY_OUTPUT, JSON.stringify(registry, null, 2));
  console.log(`✅ Registry built: ${Object.keys(registry).length} components found.`);
}

function extractPropsMetadata(content: string) {
  // This is a basic version; in a full IDE setup, 
  // you'd use your codeScanner.ts logic here.
  const props: Record<string, string> = {};
  const propMatches = content.matchAll(/(\w+)\??:\s*(string|number|boolean)/g);
  for (const match of propMatches) {
    props[match[1]] = match[2];
  }
  return props;
}
