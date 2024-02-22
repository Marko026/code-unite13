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
  other: {
    "twitter-image": "https://ibb.co/vcqjhGh",
    "twitter-card": "summary_large_image",
    "twitter-creator": "DevOverflow",
    "twitter:image:alt": "DevOverflow logo",
    "og:type": "website",
    "og:url": "code-unite13.vercel.app",
    "og:image": "https://ibb.co/vcqjhGh",
    robots: "index,follow",
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
