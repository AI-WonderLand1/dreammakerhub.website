"use client";

const BYOC_LAYERS = [
  { layer: "Auth", yourCloud: true, userCloud: false },
  { layer: "Workspace metadata", yourCloud: true, userCloud: false },
  { layer: "Project files (GLB, images, scenes)", yourCloud: false, userCloud: true },
  { layer: "Project JSON", yourCloud: false, userCloud: true },
  { layer: "Exports", yourCloud: false, userCloud: true },
  { layer: "AI generation", yourCloud: true, userCloud: false },
  { layer: "Editor (WebGLStudio)", yourCloud: true, userCloud: false },
  { layer: "Runtime (WonderPlay)", yourCloud: true, userCloud: false },
] as const;

function CloudCheck({ enabled }: { enabled: boolean }) {
  return <span aria-label={enabled ? "Yes" : "No"}>{enabled ? "✔ Yes" : "❌ No"}</span>;
}

export default function BYOCExplanation() {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">The 3 things you must set up for BYOC</h2>
      <p className="mt-2 text-sm text-white/75">
        This split keeps identity and AI orchestration centralized while user-owned project data remains in user-controlled buckets.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/70">
              <th className="px-3 py-2 font-semibold">Layer</th>
              <th className="px-3 py-2 font-semibold">Lives in YOUR cloud</th>
              <th className="px-3 py-2 font-semibold">Lives in USER cloud</th>
            </tr>
          </thead>
          <tbody>
            {BYOC_LAYERS.map((item) => (
              <tr key={item.layer} className="border-b border-white/5 last:border-b-0">
                <td className="px-3 py-2 text-white">{item.layer}</td>
                <td className="px-3 py-2 text-white/85">
                  <CloudCheck enabled={item.yourCloud} />
                </td>
                <td className="px-3 py-2 text-white/85">
                  <CloudCheck enabled={item.userCloud} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

