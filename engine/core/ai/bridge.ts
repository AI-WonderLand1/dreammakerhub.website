// engine/core/ai/bridge.ts
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * THE LAW OF MANIFESTATION
 * This function forces the AI to output non-generic code 
 * directly into your builder directory.
 */
export function manifestVisualBlock(fileName: string, code: string, confession: string) {
  const targetPath = join(process.cwd(), 'apps/web/app/(builder)/blocks', fileName);
  
  try {
    // Ensure the blocks directory exists
    mkdirSync(dirname(targetPath), { recursive: true });
    
    // Inject the "Confession" as a hidden comment for the Auditor
    const finalCode = `/* CONFESSION: ${confession} */\n${code}`;
    
    writeFileSync(targetPath, finalCode);
    
    return { 
      status: "manifested", 
      path: targetPath,
      glimpse: `Created ${fileName} using non-generic primitives.`
    };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}
