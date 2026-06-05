"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { MenuIcon, PlusIcon, SearchIcon } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="relative hidden flex-1 max-w-md sm:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, SKUs…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/products/add"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-sm font-semibold text-brand-700">
                VK
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800">
                  Vidyadhar
                </p>
                <p className="text-xs leading-tight text-slate-400">Manager</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
