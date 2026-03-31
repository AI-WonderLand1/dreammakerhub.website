"use client";
import Link from "next/link";
import { useState } from "react";

export default function PagesDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-gray-800 text-white rounded"
      >
        Pages
      </button>

      {open && (
        <div className="absolute mt-2 w-48 bg-white border rounded shadow-lg">
          <ul className="py-2">
            <li>
              <Link href="/wonder-build" className="block px-4 py-2 hover:bg-gray-100">
                Wonder‑Build
              </Link>
            </li>
            <li>
              <Link href="/wonderspace" className="block px-4 py-2 hover:bg-gray-100">
                WonderSpace
              </Link>
            </li>
            <li>
              <Link href="/marketplace" className="block px-4 py-2 hover:bg-gray-100">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href="/docs" className="block px-4 py-2 hover:bg-gray-100">
                Documentation
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
