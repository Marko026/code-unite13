import { getUserAnswers } from "@/lib/actions/user.actions";
import { SearchParamsProps } from "@/types";
import React from "react";
import AnswerCard from "./AnswerCard";
import Pagination from "./shared/Pagination/page";

interface Props extends SearchParamsProps {
  clerkId?: string | null;
  userId: string;
}
const AnswerTab = async ({ userId, clerkId, searchParams }: Props) => {
  const result = await getUserAnswers({
    userId,
    page: searchParams.page ? +searchParams.page : 1,
  });

  return (
    <>
      <div className="mb-9">
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
      </div>
      <Pagination
        pageNumber={searchParams.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
};

export default AnswerTab;
