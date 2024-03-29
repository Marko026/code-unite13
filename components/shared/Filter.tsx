"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formUrlQuery } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  filters: {
    name: string;
    value: string;
  }[];
  otherClasses?: string;
  containerClasses?: string;
}

const Filters = ({ filters, otherClasses, containerClasses }: Props) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramFIlter = searchParams.get("filter");

  const handleUpdateParams = (value: string) => {
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "filter",
      value,
    });
    router.push(newUrl, { scroll: false });
  };
  return (
    <div className={`${containerClasses}`}>
      <Select
        onValueChange={handleUpdateParams}
        defaultValue={paramFIlter || undefined}
      >
        <SelectTrigger
          className={` background-light800_dark300 text-dark500_light700 ${otherClasses}  dark:border-2 dark:border-slate-800 `}
        >
          <div className="line-clamp-1 flex-1 text-left">
            <SelectValue placeholder="Select a filter" />
          </div>
        </SelectTrigger>
        <SelectContent className="border shadow-lg  dark:border-slate-800">
          <SelectGroup className="text-dark500_light700 background-light800_dark300 bg-white">
            {filters.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                className="text-dark400_light500 focus:bg-slate-200 dark:focus:bg-dark-400"
              >
                {item.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default Filters;
