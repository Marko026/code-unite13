"use client";
import React from "react";
import { Input } from "../../ui/input";
import Image from "next/image";

interface CustomInputProps {
  route: string;
  iconPosition: string;
  imgSrc: string;
  placeholder: string;
  otherClasses?: string;
}

const LocalSearchBar = ({
  route,
  iconPosition,
  imgSrc,
  placeholder,
  otherClasses,
}: CustomInputProps) => {
  return (
    <div
      className={`${otherClasses} background-light800_darkgradient flex  min-h-[56px] w-full items-center rounded-xl px-4 sm:w-[55%] md:w-full `}
    >
      {iconPosition === "left" && (
        <Image
          src={imgSrc}
          alt="search icon"
          width={24}
          height={24}
          className="cursor-pointer"
        />
      )}
      <Input
        className="paragraph-regular no-focus w-full flex-1 border-none bg-transparent  shadow-none outline-none"
        placeholder={placeholder}
        value=""
        onChange={() => {}}
        type="text"
      />
      {iconPosition === "right" && (
        <Image
          src={imgSrc}
          alt="search icon"
          width={24}
          height={24}
          className="cursor-pointer"
        />
      )}
    </div>
  );
};

export default LocalSearchBar;
