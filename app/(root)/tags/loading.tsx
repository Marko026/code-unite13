import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import React from "react";

const Loading = () => {
  return (
    <section>
      <h1 className="h1-bold text-dark100_light900">All Tags</h1>
      <Link href="/ask-question" className="flex justify-end max-sm:w-full">
        <Button className="primary-gradient min-h-[46px] p-3 !text-light-900">
          Ask a question
        </Button>
      </Link>
      <div className="my-11 flex flex-col gap-5 md:flex-row ">
        <Skeleton className="h-14 w-full md:w-full" />
        <div className="mb-9 ">
          <Skeleton className="h-14 w-full md:w-48" />
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item, index) => (
          <div key={index}>
            <Skeleton className="h-64 w-64 rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Loading;
