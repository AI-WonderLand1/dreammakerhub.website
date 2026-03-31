export interface ExpoExportOptions {
  projectId: string;
  projectName: string;
  version?: string;
}

export async function exportToReactNativeExpo(options: ExpoExportOptions) {
  const { projectId, projectName, version = '1.0.0' } = options;
  return { projectId, projectName, version };
}
