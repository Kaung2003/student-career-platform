import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Set to false for edge-to-edge content such as cover images. */
  padded?: boolean;
}

export function Card({ className = "", padded = true, ...props }: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        padded ? "p-4 sm:p-6" : ""
      } ${className}`}
      {...props}
    />
  );
}
