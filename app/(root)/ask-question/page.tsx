import Question from "@/components/forms/Question";
import { getUserById } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import React from "react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Questions | DevOverFlow",

  description:
    "a community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
  icons: "assets/images/opengraph-image.png",
  openGraph: {
    title: "Ask questions | DevOverFlow",
    url: "https://code-unite13.vercel.app/",
    siteName: "DevOverFlow",
    description:
      "A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
    images: [
      {
        url: "assets/images/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Og Image",
      },
    ],
  },
};

const AskQUestion = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const mongoUser = await getUserById({ userId });

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">Ask a question</h1>

      <div className="mt-9">
        <Question mongoUserId={JSON.stringify(mongoUser?._id)} />
      </div>
    </div>
  );
};

export default AskQUestion;
