'use client';

import Link from "next/link";

export default function NpcCtaSection() {
  return (
    <section className="relative bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center">
          <h2 className="mb-6 text-3xl font-bold text-white">
            Bring Your NPCs to Life in 3D Worlds
          </h2>
          <p className="mb-8 text-xl text-white/80 max-w-2xl mx-auto">
            Create interactive AI-powered characters and seamlessly import them into your PlayCanvas and WebGL Studio projects for immersive games, movies, and interactive experiences.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link
              href="/wonder-build/playcanvas"
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-lg text-center hover:scale-105 transition-transform duration-300"
            >
              Import NPCs to PlayCanvas
            </Link>
            <Link
              href="/wonder-build/webgl"
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-semibold px-8 py-4 rounded-lg text-center hover:scale-105 transition-transform duration-300"
            >
              Import NPCs to WebGL Studio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}