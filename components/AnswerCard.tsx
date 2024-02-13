import React from "react";
import Metric from "./shared/Metric";
import { formatNumberWithExtension, getTimestamp } from "@/lib/utils";
import Link from "next/link";
import { SignedIn } from "@clerk/nextjs";
import EditDeleteButtons from "./EditDeleteButtons";

interface Props {
  _id: string;
  upvotes: number;
  createdAt: Date;
  question: {
    title: string;
    _id: string;
  };
  author: {
    _id: string;
    clerkId: string;
    name: string;
    picture: string;
  };
  clerkId?: string | null;
}

const AnswerCard = ({
  _id,
  upvotes,
  createdAt,
  question,
  author,
  clerkId,
}: Props) => {
  const showActionButtons = clerkId && clerkId === author.clerkId;

  return (
    <Link
      href={`/question/${question?._id}`}
      className="background-light800_darkgradient relative mt-8 flex w-full flex-col space-y-6 rounded-xl p-9 shadow-md"
    >
      <div>
        <h3 className="h3-bold text-dark200_light900 line-clamp-1">
          {question.title}
        </h3>

        <SignedIn>
          {showActionButtons && (
            <EditDeleteButtons type="Answer" itemId={JSON.stringify(_id)} />
          )}
        </SignedIn>
      </div>

      <div className=" flex flex-wrap items-center justify-between gap-2">
        <Metric
          imgUrl={author.picture}
          alt="user"
          value={author.name}
          title={`-asked ${getTimestamp(createdAt)}`}
          href={`/profile/${_id}`}
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
      </div>
    </Link>
  );
};

export default AnswerCard;
