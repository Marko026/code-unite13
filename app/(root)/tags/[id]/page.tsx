import NoResult from "@/components/shared/NoResult";
import QuestionCard from "@/components/shared/QuestionCard";
import LocalSearchBar from "@/components/shared/search/LocalSearchBar";
import { IQuestions } from "@/database/question.model";
import { getQuestionByIdTagId } from "@/lib/actions/tag.actions";
import { URLProps } from "@/types";
import React from "react";

const Page = async ({ params, searchParams }: URLProps) => {
  const result = await getQuestionByIdTagId({
    tagId: params.id,
    page: 1,
    searchQuery: searchParams?.q,
  });

  return (
    <div>
      <>
        <h1 className="h1-bold text-dark100_light900">{result.tagTitle}</h1>
        <div className="mt-11 flex w-full flex-row justify-between gap-5 max-md:flex-row max-md:flex-wrap sm:items-start  ">
          <LocalSearchBar
            route="/community"
            iconPosition="left"
            imgSrc="/assets/icons/search.svg"
            placeholder="Search for amazing minds..."
            otherClasses="flex-1"
          />
        </div>

        {result.questions.length > 0 ? (
          result.questions.map((question: IQuestions) => (
            <QuestionCard
              key={question._id}
              _id={question._id}
              title={question.title}
              tags={question.tags}
              upvotes={question.upvotes.map((upvote) => upvote.toString())}
              answers={question.answers}
              views={question.views}
              author={question.author}
              createdAt={question.createdAt}
            />
          ))
        ) : (
          <NoResult
            title="There is no tag yet"
            desc="Be the first to break the silence! Ask a Questions and kickstart the
          discussion.Our query resolution rate is 100% on all the questions asked."
            link="/ask-question"
            linkTitle="Ask Question"
          />
        )}
      </>
    </div>
  );
};

export default Page;
