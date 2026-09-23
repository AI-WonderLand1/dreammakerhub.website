const rows = [
  { feature: "Saved WonderSpace IDEs", free: "5", pro: "100", team: "Unlimited", enterprise: "Unlimited" },
  { feature: "Running IDEs at once", free: "2", pro: "4", team: "8", enterprise: "Custom" },
  { feature: "Monthly compute pool", free: "150 core-hours", pro: "300 core-hours", team: "1,000 pooled", enterprise: "Custom" },
  { feature: "AI tokens / month", free: "500K", pro: "5M", team: "25M pooled", enterprise: "Custom" },
  { feature: "Included storage", free: "5 GB", pro: "100 GB", team: "500 GB pooled", enterprise: "Custom" },
  { feature: "Idle hibernation", free: "1 hour", pro: "1 hour", team: "1 hour", enterprise: "Custom" },
  { feature: "WonderBuild", free: "Basic", pro: "✓", team: "✓", enterprise: "✓", proHighlight: true },
  { feature: "NPC AI SIM Engine", free: "—", pro: "✓", team: "✓", enterprise: "✓", proHighlight: true },
  { feature: "Custom Domain", free: "Subdomain", pro: "1", team: "Multiple", enterprise: "Unlimited" },
  { feature: "Team collaboration", free: "—", pro: "—", team: "✓", enterprise: "✓" },
  { feature: "SSO / SCIM", free: "—", pro: "—", team: "—", enterprise: "✓" },
];

export default function ComparisonTable() {
  return (
    <section className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-10 sm:px-8">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Compare Plans</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Choose the plan that fits your stage</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
              <th className="py-3 px-4 text-center text-white/60 font-semibold">Nomad</th>
              <th className="py-3 px-4 text-center text-purple-400 font-semibold">Architect</th>
              <th className="py-3 px-4 text-center text-blue-400 font-semibold">Guild</th>
              <th className="py-3 px-4 text-center text-cyan-400 font-semibold">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.feature}>
                <td className="py-3 px-4 text-gray-300">{row.feature}</td>
                <td className="py-3 px-4 text-center text-gray-400">{row.free}</td>
                <td className={`py-3 px-4 text-center ${row.proHighlight ? "text-green-400" : "text-white"}`}>{row.pro}</td>
                <td className={`py-3 px-4 text-center ${row.teamHighlight ? "text-green-400" : "text-white"}`}>{row.team}</td>
                <td className={`py-3 px-4 text-center ${row.enterpriseHighlight ? "text-green-400" : "text-white"}`}>{row.enterprise}</td>
              </tr>
            ))}
            <tr className="border-t border-white/10">
              <td className="py-3 px-4 text-gray-300">Support</td>
              <td className="py-3 px-4 text-center text-gray-400">Community</td>
              <td className="py-3 px-4 text-center text-white">Priority</td>
              <td className="py-3 px-4 text-center text-white">Dedicated</td>
              <td className="py-3 px-4 text-center text-white">SLA + Manager</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
