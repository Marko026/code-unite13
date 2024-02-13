import { getUserQuestions } from "@/lib/actions/user.actions";
import { SearchParamsProps } from "@/types";
import React from "react";
import QuestionCard from "./shared/QuestionCard";

interface Props extends SearchParamsProps {
  clerkId?: string | null;
  userId: string;
}

const QuestionTab = async ({ clerkId, searchParams, userId }: Props) => {
  const result = await getUserQuestions({ userId, page: 1 });

  return (
    <>
      {result.questions.map((question) => (
        <QuestionCard
          key={question._id}
          _id={question._id}
          title={question.title}
          tags={question.tags}
          upvotes={question.upvotes}
          answers={question.answers}
          views={question.views}
          author={question.author}
          createdAt={question.createdAt}
          clerkId={clerkId}
        />
      ))}
    </>
  );
};

export default QuestionTab;
