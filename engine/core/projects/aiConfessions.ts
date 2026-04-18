export async function appendAIConfession(projectId: string, confession: string, metadata?: Record<string, any>) {
  console.log(`[aiConfessions] Appending confession for project ${projectId}: ${confession.slice(0, 100)}...`);
  return { success: true, projectId, confession, timestamp: Date.now() };
}

export async function getConfessions(projectId: string) {
  return [];
}