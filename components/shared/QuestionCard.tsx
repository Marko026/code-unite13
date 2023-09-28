import React from "react";
import RenderTag from "./RenderTag";
import Image from "next/image";

interface QuestionCardProps {
  title: string;
  votes: number;
  answers: number;
  views: number;
  user: string;
  time: string;
}

const QuestionCard = ({
  title,
  votes,
  answers,
  views,
  user,
  time,
}: QuestionCardProps) => {
  return (
    <section className="background-light800_darkgradient mt-8 flex flex-col space-y-6 rounded-xl p-9 shadow-md">
      <h3 className="h3-bold text-dark200_light900 line-clamp-1">{title}</h3>
      <RenderTag name="nextjs" />
      <div className="  flex flex-wrap items-center justify-between gap-2">
        <div className="text-dark400_light700 flex items-center">
          <Image
            src="assets/images/site-logo.svg"
            alt="logo"
            className="mr-2 rounded-full"
            width={20}
            height={20}
          />
          <p className=" flex items-center text-[14px]">
            {user} <span className="mx-1">|</span>
          </p>
          <p>{time}</p>
        </div>
        <div className="text-dark400_light700 flex  space-x-3 ">
          <div className="flex space-x-1">
            <Image
              src="/assets/icons/like.svg"
              width={16}
              height={16}
              alt="like"
            />
            <p className="text-[12px] capitalize">{votes} Votes</p>
          </div>
          <div className="flex space-x-1">
            <Image
              src="/assets/icons/like.svg"
              width={16}
              height={16}
              alt="like"
            />
            <p className="text-[12px] capitalize">{answers} Answers</p>
          </div>
          <div className="flex space-x-1">
            <Image
              src="/assets/icons/like.svg"
              width={16}
              height={16}
              alt="like"
            />
            <p className="text-[12px] capitalize">{views} Views</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuestionCard;
