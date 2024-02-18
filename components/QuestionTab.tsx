import { getUserQuestions } from "@/lib/actions/user.actions";
import { SearchParamsProps } from "@/types";
import React from "react";
import QuestionCard from "./shared/QuestionCard";
import Pagination from "./shared/Pagination/page";

interface Props extends SearchParamsProps {
  clerkId?: string | null;
  userId: string;
}

const QuestionTab = async ({ clerkId, searchParams, userId }: Props) => {
  const result = await getUserQuestions({
    userId,
    page: searchParams.page ? +searchParams.page : 1,
  });

  return (
    <>
      <div className="mb-9">
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
      </div>
      <Pagination
        pageNumber={searchParams.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
};

export default QuestionTab;
