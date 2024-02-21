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
  metadataBase: new URL("https://code-unite13.vercel.app/"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    images: "assets/images/opengraph-image.png",
    title: "Ask questions | DevOverFlow",
    description:
      "A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
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
