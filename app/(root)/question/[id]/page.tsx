import Answers from "@/components/forms/Answers";
import AllAnswers from "@/components/shared/AllAnswers";
import Metric from "@/components/shared/Metric";
import ParseHTML from "@/components/shared/ParseHTML";
import RenderTag from "@/components/shared/RenderTag";
import Votes from "@/components/shared/Votes";
import { getQuestionById } from "@/lib/actions/questions.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { formatNumberWithExtension, getTimestamp } from "@/lib/utils";
import { auth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const Page = async ({ params, searchParams }: any) => {
  const { userId: clerkId } = auth();
  let mongoUser;

  if (clerkId) {
    mongoUser = await getUserById({
      userId: clerkId,
    });
  }
  const result = await getQuestionById({ questionId: params.id });

  return (
    <>
      <div className="flex-start w-full flex-col">
        <div className="flex w-full flex-col-reverse justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
          <Link
            href={`/profile/${result.author.clerkId}`}
            className="flex items-center justify-start gap-1"
          >
            <Image
              src={result.author.picture}
              alt=""
              className="rounded-full"
              width={22}
              height={22}
            />
            <p className="paragraph-semibold text-dark300_light700">
              {result.author.name}
            </p>
          </Link>
          <div className="flex justify-end">
            <Votes
              type="Question"
              itemId={JSON.stringify(result._id)}
              userId={JSON.stringify(mongoUser._id)}
              upvotes={result.upvotes.length}
              downvotes={result.downvotes.length}
              hasupVoted={result.upvotes.includes(mongoUser._id)}
              hasdownVoted={result.downvotes.includes(mongoUser._id)}
              hasSaved={mongoUser?.saved.includes(result._id)}
            />
          </div>
        </div>
      </div>
      <h2 className="h2-semibold text-dark200_light900 mt-3.5">
        {result.title}
      </h2>
      <div className="mb-8 mt-5 flex  flex-wrap gap-4">
        <Metric
          imgUrl="/assets/icons/clock.svg"
          alt="clock icon"
          value={`asked ${getTimestamp(result.createdAt)}`}
          title=""
          textStyles="small-meduim text-dark400_light800"
        />
        <Metric
          imgUrl="/assets/icons/message.svg"
          alt="answers"
          value={formatNumberWithExtension(result.answers.length)}
          title="Answers"
          textStyles="small-meduim text-dark400_light800"
        />
        <Metric
          imgUrl="/assets/icons/eye.svg"
          alt="views"
          value={formatNumberWithExtension(result.views)}
          title="Views"
          textStyles="small-meduim text-dark400_light800"
        />
      </div>
      <div className="bg-white dark:bg-black dark:text-white">
        <ParseHTML data={result.content} />
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {result.tags.map((tag: any) => (
          <RenderTag
            key={tag._id}
            _id={tag._id}
            name={tag.name}
            showCount={false}
          />
        ))}
      </div>

      <AllAnswers
        page={searchParams?.page}
        filter={searchParams?.filter}
        questionId={result._id}
        userId={mongoUser._id}
        totalAnswers={result.answers.length}
      />

      <Answers
        question={result.content}
        questionId={JSON.stringify(result._id)}
        authorId={JSON.stringify(mongoUser._id)}
      />
    </>
  );
};

export default Page;
