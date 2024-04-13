import React from "react";
import Navbar from "@/components/shared/navbar/Navbar";
import LeftSideBar from "@/components/shared/LeftSideBar";
import RightSideBar from "@/components/shared/RightSideBar";
import { Toaster } from "@/components/ui/toaster";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://code-unite13.vercel.app"),
  title: "DevOverFlow",
  description:
    "a community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
  openGraph: {
    images: "https://i.ibb.co/HKsJLxw/opengraph-image.png",
  },
  twitter: {
    images: "https://i.ibb.co/HKsJLxw/opengraph-image.png",
  },
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="background-light850_dark100 relative">
      <Navbar />
      <div className="flex">
        <LeftSideBar />
        <section className=" flex min-h-screen flex-1 flex-col px-6 pb-6 pt-36 max-md:pb-14 sm:px-14">
          <div className="mx-auto w-full max-w-3xl ">{children}</div>
        </section>
        <RightSideBar />
      </div>
      <Toaster />
    </main>
  );
};

export default Layout;
