export type TheatreBridgeBindings = {
  getProject: unknown;
  studio: { initialize: () => void };
  t: unknown;
};

export async function setupTheatreBridge(host: Record<string, unknown> = globalThis as Record<string, unknown>) {
  const [{ getProject, types: t }, studioModule] = await Promise.all([
    import("@theatre/core"),
    import("@theatre/studio"),
  ]);

  const studio = studioModule.default;

  host.getProject = getProject;
  host.studio = studio;
  host.t = t;

  if (typeof studio.initialize === "function") {
    studio.initialize();
  }

  return { getProject, studio, t } satisfies TheatreBridgeBindings;
}
