import LocalSearchBar from "@/components/shared/search/LocalSearchBar";
import { QuestionFilters } from "@/constants/filters";
import QuestionCard from "@/components/shared/QuestionCard";
import NoResult from "@/components/shared/NoResult";
import Filter from "@/components/shared/Filter";
import { getSavedQuestion } from "@/lib/actions/user.actions";
import { auth } from "@clerk/nextjs";

export default async function Collection() {
  const { userId } = auth();
  if (!userId) return null;
  const result = await getSavedQuestion({
    clerkId: userId,
  });

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>
      <div className="mt-11 flex flex-row justify-between gap-5 max-md:flex-row max-md:flex-wrap sm:items-start  ">
        <LocalSearchBar
          route="/community"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search for amazing minds..."
          otherClasses="flex-1"
        />
        <Filter
          filters={QuestionFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
          containerClasses=" max-md:block max-md:w-full sm:w-[40%] "
        />
      </div>

      {result.questions.length > 0 ? (
        result.questions.map((question) => (
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
          />
        ))
      ) : (
        <NoResult
          title="saved question"
          desc="Be the first to break the silence! Ask a Questions and kickstart the
          discussion.Our query resolution rate is 100% on all the questions asked."
          link="/ask-question"
          linkTitle="Ask Question"
        />
      )}
    </>
  );
}