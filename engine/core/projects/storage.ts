import { ProjectMetadata } from './types';

/**
 * Rick: Adding a TTL for projects because storage isn't free, Morty! 
 * You get 24 hours of glory then *poof*, your mediocre app is gone.
 */
export async function createProject(metadata: ProjectMetadata, isTemporary: boolean = true) {
  const expiresAt = isTemporary 
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
    : null;
  
  const enrichedMetadata = {
    ...metadata,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  // logic to write to bucket would go here
  console.log(`Project ${metadata.name} created. Expiry: ${expiresAt || 'Never'}`);
  return enrichedMetadata;
}