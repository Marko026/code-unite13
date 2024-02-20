import React from "react";
import RenderTag from "./RenderTag";
import Link from "next/link";
import Metric from "./Metric";
import { formatNumberWithExtension, getTimestamp } from "@/lib/utils";
import { SignedIn } from "@clerk/nextjs";
import EditDeleteButtons from "../EditDeleteButtons";

interface QuestionCardProps {
  _id: number;
  title: string;
  tags: { _id: number; name: string }[];
  author: {
    _id: number;
    name: string;
    picture: string;
    clerkId: string;
  };
  upvotes: string[];
  views: number;
  answers: Array<object>;
  createdAt: Date;
  clerkId?: string | null;
}
const QuestionCard = ({
  clerkId,
  title,
  tags,
  upvotes,
  answers,
  views,
  author,
  createdAt,
  _id,
}: QuestionCardProps) => {
  const showActionButtons = clerkId === author.clerkId;

  return (
    <section className="background-light800_darkgradient relative mt-8 flex w-full flex-col space-y-6 rounded-xl p-9 shadow-md">
      <span className="subtle-regular text-dark400_light700 hidden max-md:block">
        {getTimestamp(createdAt)}
      </span>
      <Link href={`/question/${_id} `}>
        <h3 className="h3-bold text-dark200_light900 line-clamp-1">{title}</h3>
      </Link>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <RenderTag _id={tag._id} key={tag._id} name={tag.name} />
        ))}
      </div>
      <div className=" flex w-full items-center justify-between gap-2">
        <Metric
          imgUrl={author.picture}
          alt="user"
          value={author.name}
          title={`-asked ${getTimestamp(createdAt)}`}
          href={`/profile/${author._id}`}
          isAuthor
          textStyles="body-meduim text-dark400_light700"
        />
        <div className="flex gap-4">
          <Metric
            imgUrl="/assets/icons/like.svg"
            alt="upvotes"
            value={formatNumberWithExtension(upvotes.length)}
            title="Votes"
            textStyles="small-meduim text-dark400_light800"
          />
          <Metric
            imgUrl="/assets/icons/message.svg"
            alt="answers"
            value={formatNumberWithExtension(answers.length)}
            title="Answers"
            textStyles="small-meduim text-dark400_light800"
          />
          <Metric
            imgUrl="/assets/icons/eye.svg"
            alt="views"
            value={formatNumberWithExtension(views)}
            title="Views"
            textStyles="small-meduim text-dark400_light800"
          />
        </div>
      </div>

      <SignedIn>
        {showActionButtons && (
          <EditDeleteButtons type="Questions" itemId={JSON.stringify(_id)} />
        )}
      </SignedIn>
    </section>
  );
};

export default QuestionCard;
