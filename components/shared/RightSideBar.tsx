import Image from "next/image";
import Link from "next/link";
import React from "react";
import RenderTag from "./RenderTag";
import { getHotQuestions } from "@/lib/actions/questions.actions";

const popularTags = [
  {
    _id: 1,
    title: "Next.js",
    totalQuestions: 3,
  },
  {
    _id: 2,
    title: "React.js",
    totalQuestions: 2,
  },
  {
    _id: 3,
    title: "Javascript",
    totalQuestions: 1,
  },
  {
    _id: 4,
    title: "Typescript",
    totalQuestions: 10,
  },
  {
    _id: 5,
    title: "Next.js",
    totalQuestions: 3,
  },
];

const RightSideBar = async () => {
  const hotQuestions = await getHotQuestions();

  return (
    <section className=" background-light900_dark200 custom-scrollbar sticky right-0 top-0 hidden h-screen flex-col  overflow-y-auto  border-l-[1px] px-8 dark:border-transparent lg:w-[350px] xl:flex">
      <div className="relative top-32  flex flex-col space-y-16">
        <div className="text-dark200_light900 flex flex-col space-y-[30px]">
          <h3 className="h3-bold">Top Questions</h3>
          {hotQuestions.map((question) => (
            <Link
              key={question._id}
              href={`/question/${question._id}`}
              className="body-medium flex w-full items-center justify-between gap-5"
            >
              {question.title}
              <Image
                src="/assets/icons/chevron-right.svg"
                alt="right arrow"
                width={20}
                height={20}
                className="invert-colors"
              />
            </Link>
          ))}
        </div>
        <div className="text-dark200_light900 pb-36">
          <h3 className="h3-bold mb-6">Popular Tags</h3>
          <div className="flex flex-col space-y-5">
            {popularTags.map((tag) => (
              <RenderTag
                key={tag._id}
                name={tag.title}
                _id={tag._id}
                totalQuestions={tag.totalQuestions}
                showCount
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RightSideBar;
