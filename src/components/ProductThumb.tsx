/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { Product } from "@/lib/types";
import { ImageIcon } from "./icons";

export function ProductThumb({
  product,
  size = "md",
  className,
}: {
  product: Pick<Product, "name" | "images">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    sm: "h-10 w-10 rounded-lg",
    md: "h-12 w-12 rounded-xl",
    lg: "h-16 w-16 rounded-xl",
  }[size];

  const src = product.images[0];

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden bg-slate-100 ring-1 ring-slate-200",
        dims,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-slate-300">
          <ImageIcon className="h-1/2 w-1/2" />
        </span>
      )}
    </div>
  );
}
