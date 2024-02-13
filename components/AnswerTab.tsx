import { getUserAnswers } from "@/lib/actions/user.actions";
import { SearchParamsProps } from "@/types";
import React from "react";
import AnswerCard from "./AnswerCard";

interface Props extends SearchParamsProps {
  clerkId?: string | null;
  userId: string;
}
const AnswerTab = async ({ userId, clerkId, searchParams }: Props) => {
  const result = await getUserAnswers({ userId, page: 1 });

  return (
    <>
      {result.answers.map((item) => (
        <AnswerCard
          key={item._id}
          _id={item._id}
          author={item.author}
          clerkId={clerkId}
          question={item.question}
          upvotes={item.upvotes.length}
          createdAt={item.createdAt}
        />
      ))}
    </>
  );
};

export default AnswerTab;
