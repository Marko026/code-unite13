import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const Loading = () => {
  return (
    <section>
      <div className="my-11 flex flex-row justify-between gap-5 max-md:flex-row max-md:flex-wrap sm:items-start  ">
        <Skeleton className="h-14 flex-1" />
        <Skeleton className="h-14 w-28" />
      </div>
      <div className="flex flex-col gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item, index) => (
          <div key={index} className="flex flex-col gap-4">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Loading;
