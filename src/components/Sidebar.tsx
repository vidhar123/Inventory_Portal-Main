"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DashboardIcon,
  BoxIcon,
  LayersIcon,
  PlusIcon,
  CloseIcon,
} from "./icons";

const nav = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/products", label: "Products", icon: BoxIcon },
  { href: "/products/add", label: "Add Product", icon: PlusIcon },
  { href: "/inventory", label: "Inventory", icon: LayersIcon },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-6">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
              <BoxIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Stockpile
            </span>
          </Link>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <p className="text-sm font-semibold">Demo workspace</p>
          <p className="mt-1 text-xs text-brand-100">
            Data lives in local state and resets on refresh.
          </p>
        </div>
      </aside>
    </>
  );
}
