"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const signLinks = [
  { id: "playground", label: "AI Playground", top: "37%", left: "23%", path: "/playground" },
  { id: "dashboard", label: "IDE Dashboard", top: "69%", left: "26%", path: "/dashboard" },
  { id: "rabbit-hole", label: "ANYTHING BUILDER", top: "79%", left: "23%", path: "/wonderspace" },
  { id: "somewhere", label: "About Wonderland", top: "89%", left: "25%", path: "/about" },
];

export default function WonderlandLanding() {
  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative h-full aspect-[16/7.5] max-w-none">
        {/* The Base Artwork */}
        <img 
          src="/images/wonderland-theme.png" 
          alt="AI Wonderland Gateway" 
          className="w-full h-full object-contain pointer-events-none" 
        />

        {signLinks.map((sign) => (
          <Link key={sign.id} href={sign.path}>
            <motion.div
              style={{ top: sign.top, left: sign.left, width: "14%", height: "7%" }}
              className="absolute cursor-pointer group z-10"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-full h-full transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] rounded-full flex items-center justify-center border border-transparent group-hover:border-white/20">
                <span className="opacity-0 group-hover:opacity-100 text-white font-bold uppercase tracking-widest text-[10px] text-center px-1">
                  {sign.label}
                </span>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}