const rows = [
  { feature: "Active Projects", free: "1", pro: "5", team: "Unlimited", enterprise: "Unlimited" },
  { feature: "AI Chats", free: "5/day", pro: "Unlimited", team: "Unlimited", enterprise: "Unlimited" },
  { feature: "WonderBuild", free: "Basic", pro: "✓", team: "✓", enterprise: "✓", proHighlight: true },
  { feature: "NPC AI SIM Engine", free: "—", pro: "✓", team: "✓", enterprise: "✓", proHighlight: true },
  { feature: "WonderSpace IDE", free: "—", pro: "✓", team: "✓", enterprise: "✓", proHighlight: true },
  { feature: "Custom Domain", free: "—", pro: "1", team: "Multiple", enterprise: "Unlimited" },
  { feature: "Team Seats", free: "1", pro: "1", team: "5", enterprise: "Unlimited" },
  { feature: "Priority GPU", free: "—", pro: "—", team: "✓", enterprise: "✓", teamHighlight: true },
  { feature: "White-Labeling", free: "—", pro: "—", team: "✓", enterprise: "✓", teamHighlight: true },
  { feature: "SSO / SCIM", free: "—", pro: "—", team: "—", enterprise: "✓", enterpriseHighlight: true },
  { feature: "Compute Credits", free: "—", pro: "—", team: "300K/mo", enterprise: "Custom" },
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
