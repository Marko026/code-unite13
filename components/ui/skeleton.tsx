import { cn } from "@/lib/utils";

import React from "react";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "!dark:bg-slate-50/10 animate-pulse rounded-md !bg-slate-900/10",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
