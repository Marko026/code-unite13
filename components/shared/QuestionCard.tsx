import React from "react";
import RenderTag from "./RenderTag";
import Link from "next/link";
import Metric from "./Metric";
import { formatNumberWithExtension, getTimestamp } from "@/lib/utils";

interface QuestionCardProps {
  _id: number;
  title: string;
  tags: { _id: number; name: string }[];
  author: {
    _id: number;
    name: string;
    picture: string;
  };
  upvotes: number;
  views: number;
  answers: Array<object>;
  createdAt: Date;
}
const QuestionCard = ({
  title,
  tags,
  upvotes,
  answers,
  views,
  author,
  createdAt,
  _id,
}: QuestionCardProps) => {
  return (
    <section className="background-light800_darkgradient mt-8 flex w-full flex-col space-y-6 rounded-xl p-9 shadow-md">
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
      <div className=" flex flex-wrap items-center justify-between gap-2">
        <Metric
          imgUrl="/assets/icons/avatar.svg"
          alt="user"
          value={author.name}
          title={`-asked ${getTimestamp(createdAt)}`}
          href={`/profile/${author._id}`}
          isAuthor
          textStyles="body-meduim text-dark400_light700"
        />
        <Metric
          imgUrl="/assets/icons/like.svg"
          alt="upvotes"
          value={formatNumberWithExtension(upvotes)}
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

      {/* to do if sign in add edit delete actions  */}
    </section>
  );
};

export default QuestionCard;
