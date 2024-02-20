"use client";
import { formatNumberWithExtension } from "@/lib/utils";
import Image from "next/image";
import {
  upVoteQuestion,
  downVoteQuestion,
} from "@/lib/actions/questions.actions";
import { usePathname, useRouter } from "next/navigation";
import { downVoteAnswer, upVoteAnswer } from "@/lib/actions/answer.actions";
import { toggleSaveQuestion } from "@/lib/actions/user.actions";
import { useEffect, useRef } from "react";
import { viewQuestion } from "@/lib/actions/interaction.action";
import { undefined } from "zod";
import { toast } from "../ui/use-toast";
interface Props {
  type: string;
  itemId: string;
  userId: string;
  upvotes: number;
  downvotes: number;
  hasupVoted: boolean;
  hasdownVoted: boolean;
  hasSaved?: boolean;
}
const Votes = ({
  type,
  itemId,
  userId,
  upvotes,
  downvotes,
  hasupVoted,
  hasdownVoted,
  hasSaved,
}: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const hasViewed = useRef(false);

  const handleVote = async (action: string) => {
    if (!userId) {
      return toast({
        title: "Please login to vote",
        description: "You need to be logged in to vote",
      });
    }
    if (action === "upvote") {
      if (type === "Question")
        await upVoteQuestion({
          questionId: JSON.parse(itemId),
          userId: JSON.parse(userId),
          hasupVoted,
          hasdownVoted,
          path: pathname,
        });
      return toast({
        title: `Upvote ${!hasupVoted ? "Successfull" : "Removed"}`,
        variant: !hasupVoted ? "default" : "destructive",
      });
    } else if (type === "Answer") {
      await upVoteAnswer({
        answerId: JSON.parse(itemId),
        userId: JSON.parse(userId),
        hasupVoted,
        hasdownVoted,
        path: pathname,
      });
    }
    if (action === "downvote") {
      if (type === "Question") {
        await downVoteQuestion({
          questionId: JSON.parse(itemId),
          userId: JSON.parse(userId),
          hasupVoted,
          hasdownVoted,
          path: pathname,
        });
      }
      return toast({
        title: `Downvote ${!hasdownVoted ? "Successfull" : "Removed"}`,
        variant: !hasdownVoted ? "default" : "destructive",
      });
    } else if (type === "Answer") {
      await downVoteAnswer({
        answerId: JSON.parse(itemId),
        userId: JSON.parse(userId),
        hasupVoted,
        hasdownVoted,
        path: pathname,
      });
    }
  };
  const handleSave = async () => {
    await toggleSaveQuestion({
      userId: JSON.parse(userId),
      questionId: JSON.parse(itemId),
      path: pathname,
    });
    return toast({
      title: `Question ${!hasSaved ? "saved in collections" : "Removed"}`,
      variant: !hasSaved ? "default" : "destructive",
    });
  };

  useEffect(() => {
    if (!hasViewed.current) {
      viewQuestion({
        questionId: JSON.parse(itemId),
        userId: userId ? JSON.parse(userId) : undefined,
      });
      hasViewed.current = true;
    }
  }, [itemId, userId, pathname, router, hasViewed]);

  return (
    <>
      <div className="flex gap-2 ">
        <Image
          src={`${
            hasupVoted
              ? "/assets/icons/upvoted.svg"
              : "/assets/icons/upvote.svg"
          }`}
          width={18}
          height={18}
          alt="arrow-up"
          onClick={() => handleVote("upvote")}
          className="cursor-pointer"
        />
        <p className="background-light700_dark400 subtle-medium text-dark400_light900 flex-center min-w-[18px] rounded-sm p-1">
          {formatNumberWithExtension(upvotes)}
        </p>
        <Image
          src={`${
            hasdownVoted
              ? "/assets/icons/downvoted.svg"
              : "/assets/icons/downvote.svg"
          }`}
          width={18}
          height={18}
          alt="arrow-up"
          onClick={() => handleVote("downvote")}
          className="cursor-pointer"
        />
        <p className="background-light700_dark400 subtle-medium text-dark400_light900 flex-center min-w-[18px] rounded-sm p-1">
          {formatNumberWithExtension(downvotes)}
        </p>
        {type === "Question" && (
          <Image
            src={`${
              hasSaved
                ? "/assets/icons/star-filled.svg"
                : "/assets/icons/star-red.svg"
            }`}
            width={18}
            height={18}
            alt="star"
            onClick={() => handleSave()}
            className="cursor-pointer"
          />
        )}
      </div>
    </>
  );
};

export default Votes;
