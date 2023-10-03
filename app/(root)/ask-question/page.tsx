import Question from "@/components/forms/Question";
import { getUserById } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs";
import console from "console";
import { redirect } from "next/navigation";
import React from "react";

const AskQUestion = async () => {
  // const { userId } = auth();
  const userId = "user2";
  if (!userId) redirect("/sign-in");

  const mongoUser = await getUserById({ userId });
  console.log(mongoUser);

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">Ask a question</h1>

      <div className="mt-9">
        <Question mongoUser={JSON.stringify(mongoUser._id)} />
      </div>
    </div>
  );
};

export default AskQUestion;
