"use client";
import { HomePageFilters } from "@/constants/filters";
import React from "react";
import { Button } from "../ui/button";

const HomeFilters = () => {
  const active = "recommended";
  return (
    <div className="hidden flex-wrap gap-3 md:flex">
      {HomePageFilters.map((item) => (
        <Button
          onClick={() => {}}
          key={item.value}
          className={`body-medium rounded-lg px-6 py-3  capitalize  shadow-none ${
            active === item.value
              ? "bg-primary-100 text-primary-500 dark:bg-dark-400"
              : "bg-light-800 text-light-500  dark:bg-dark-300 dark:text-light-700 dark:hover:bg-dark-300 "
          }`}
        >
          {item.name}
        </Button>
      ))}
    </div>
  );
};

export default HomeFilters;
