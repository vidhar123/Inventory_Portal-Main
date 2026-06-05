import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type Accent = "blue" | "green" | "amber" | "rose";

const accents: Record<Accent, string> = {
  blue: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

export function StatCard({
  label,
  value,
  hint,
  accent = "blue",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: Accent;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", accents[accent])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {hint && <p className="mt-3 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
