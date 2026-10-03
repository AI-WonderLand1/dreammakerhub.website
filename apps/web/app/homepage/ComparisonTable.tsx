const rows = [
  { feature: "AI credits / month", free: "500K", creator: "2M", pro: "5M", studio: "12M", team: "25M pooled", enterprise: "Custom" },
  { feature: "3D credits / month", free: "10", creator: "50", pro: "150", studio: "400", team: "1,000 pooled", enterprise: "Custom" },
  { feature: "Projects", free: "5", creator: "25", pro: "100", studio: "250", team: "Large pooled", enterprise: "Custom" },
  { feature: "Included storage", free: "5 GB", creator: "25 GB", pro: "100 GB", studio: "250 GB", team: "500 GB pooled", enterprise: "Custom" },
  { feature: "AI / 3D top-ups", free: "Available", creator: "Available", pro: "Available", studio: "Available", team: "Available", enterprise: "Contract" },
  { feature: "WonderSpace cloud IDE", free: "Controlled beta", creator: "Controlled beta", pro: "Controlled beta", studio: "Controlled beta", team: "Controlled beta", enterprise: "By agreement" },
];

export default function ComparisonTable() {
  const columns = [
    ["Nomad", "free"],
    ["Creator", "creator"],
    ["Architect", "pro"],
    ["Studio", "studio"],
    ["Guild", "team"],
    ["Enterprise", "enterprise"],
  ] as const;

  return (
    <section className="relative mx-auto mt-12 w-full max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-10 sm:px-8">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400">Compare Plans</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Choose the plan that fits your stage</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left font-semibold text-gray-400">Allowance</th>
              {columns.map(([label]) => <th key={label} className="px-4 py-3 text-center font-semibold text-white">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.feature}>
                <td className="px-4 py-3 text-gray-300">{row.feature}</td>
                {columns.map(([, key]) => <td key={key} className="px-4 py-3 text-center text-gray-300">{row[key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-xs leading-5 text-white/50">
        AI Playground may expose the exact enabled model/provider. Fast, Balanced and Advanced builder modes are planned, not live selectors. WonderSpace remains a controlled beta until customer isolation and provisioning gates are verified.
      </p>
    </section>
  );
}
