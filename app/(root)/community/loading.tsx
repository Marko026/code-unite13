import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const Loading = () => {
  return (
    <section>
      <h1 className="h1-bold text-dark100_light900">All Users</h1>
      <div className="mt-11 flex flex-row justify-between gap-5 max-md:flex-row max-md:flex-wrap sm:items-start  ">
        <Skeleton className="h-14 flex-1" />
        <Skeleton className="h-14 w-28" />
      </div>
      <section className="mt-11 flex flex-wrap gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-60 w-full rounded-xl sm:w-[260px]" />
        ))}
      </section>
    </section>
  );
};

export default Loading;
