"use client";
import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { sidebarLinks } from "@/constants";
import { Button } from "@/components/ui/button";
import { SignedOut, useAuth } from "@clerk/nextjs";
import { useClerk } from "@clerk/clerk-react";
const LeftSideBar = () => {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isSignedIn, userId } = useAuth();
  return (
    <section className=" background-light900_dark200 custom-scrollbar sticky left-0 top-0 hidden h-screen overflow-y-auto border-r-[1px] px-8  dark:border-transparent  md:flex md:flex-col lg:w-[266px]">
      <div className=" relative top-32 mb-36 flex flex-col space-y-5 ">
        {sidebarLinks.map((item) => {
          const isActive =
            (pathname.includes(item.route) && item.route.length > 1) ||
            pathname === item.route;

          if (item.route === "/profile") {
            if (userId) {
              item.route = `/profile/${userId}`;
            } else {
              return null;
            }
          }

          return (
            <Link
              key={item.route}
              href={item.route}
              className={` ${
                isActive
                  ? "primary-gradient rounded-lg text-light-900"
                  : "text-dark300_light900"
              } mx-auto  flex gap-3 rounded-lg px-4 py-3 lg:m-0 `}
            >
              <Image
                src={item.imgURL}
                alt={item.label}
                width={24}
                height={24}
                className={`${!isActive && "invert-colors"}`}
              />
              <p
                className={`hidden lg:block ${
                  isActive ? "base-bold" : "base-medium"
                }`}
              >
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>
      <SignedOut>
        <div className=" relative  mb-5  mt-auto flex flex-col items-center gap-3 lg:items-start ">
          <Link href="sign-in" className="lg:w-full">
            <Button className="small-medium btn-secondary min-h-[41px]  w-full rounded-lg px-4 py-3 text-primary-500">
              <Image
                src="/assets/icons/account.svg"
                width={20}
                height={20}
                alt="account icon"
                className="invert-colors lg:hidden"
              />
              <span className="hidden lg:block">Log In</span>
            </Button>
          </Link>

          <Link href="sign-up" className="lg:w-full">
            <Button className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-[41px] w-full rounded-lg px-4 py-3">
              <Image
                src="/assets/icons/sign-up.svg"
                width={20}
                height={20}
                alt="sign in"
                className="invert-colors lg:hidden"
              />
              <span className="hidden lg:block">Sign Up</span>
            </Button>
          </Link>
        </div>
      </SignedOut>

      {isSignedIn && (
        <Link href="/" className=" mr-auto mt-9 ">
          <Button
            onClick={() => signOut()}
            className="small-medium light-border-2 min-h-[41px] w-full rounded-lg px-4 py-3 invert"
          >
            <Image
              src="/assets/icons/logout.svg"
              width={24}
              height={24}
              alt="sign in"
              className="invert-colors invert"
            />
            <p className="base-bold ml-5 hidden invert dark:invert-0 lg:block">
              Logout
            </p>
          </Button>
        </Link>
      )}
    </section>
  );
};

export default LeftSideBar;
