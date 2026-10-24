// engine/core/ai/bridge.ts
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { SecurityCore } from '../security/Sanitizer';

/**
 * THE LAW OF MANIFESTATION
 * This function forces the AI to output non-generic code 
 * directly into your builder directory.
 */
export function manifestVisualBlock(fileName: string, code: string, confession: string) {
  // SECURITY: Validate code safety before writing to filesystem
  const safetyCheck = SecurityCore.validateCodeSafety(code);
  if (!safetyCheck.safe) {
    return { status: "blocked", message: `Code blocked: ${safetyCheck.reason}` };
  }

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
  } catch (error: unknown) {
    return { status: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
