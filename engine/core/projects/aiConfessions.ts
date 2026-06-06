export async function appendAIConfession(projectId: string, confession: string) {
  return { success: true, projectId, confession, timestamp: Date.now() };
}

export async function getConfessions() {
  return [];
}