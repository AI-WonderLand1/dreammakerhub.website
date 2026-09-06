"use client";

export default function HeroBanner() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#030409]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.10),transparent_34%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <div className="absolute left-1/2 top-[22%] h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[90px] sm:h-[30rem] sm:w-[30rem]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
