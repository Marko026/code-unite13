import { formatNumberWithExtension } from "@/lib/utils";
import React from "react";
import StarCard from "../StarCard";
import { BadgeCounts } from "@/types";

interface StatsProps {
  totalQuestions: number;
  totalAnswers: number;
  badges: BadgeCounts;
  reputation: number;
}

const Stats = ({
  totalQuestions,
  totalAnswers,
  badges,
  reputation,
}: StatsProps) => {
  return (
    <section className="mt-10">
      <h3 className="h3-semibold text-dark200_light900 my-4">
        Stats and Reputation- {reputation}
      </h3>
      <div className="flex flex-col flex-wrap  gap-5 xs:flex-row md:justify-between ">
        <div className=" light-border background-light900_dark300 flex grow basis-1/3 justify-center gap-5 rounded-md border p-6 xs:flex-col xs:items-start sm:flex-row sm:items-center xl:basis-1/5">
          <div className="flex flex-col items-center justify-center">
            <p className="paragraph-semibold text-dark200_light900">
              {formatNumberWithExtension(totalQuestions)}
            </p>
            <p className="body-medium text-dark400_light700">Questions</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="paragraph-semibold text-dark200_light900">
              {formatNumberWithExtension(totalAnswers)}
            </p>
            <p className="body-medium text-dark400_light700">Answers</p>
          </div>
        </div>
        <StarCard
          imgUrl="/assets/icons/gold-medal.svg"
          value={badges.GOLD}
          title="Gold Badges"
        />
        <StarCard
          imgUrl="/assets/icons/silver-medal.svg"
          value={badges.SILVER}
          title="Silver Badges"
        />
        <StarCard
          imgUrl="/assets/icons/bronze-medal.svg"
          value={badges.BRONZE}
          title="Bronze Badges"
        />
      </div>
    </section>
  );
};

export default Stats;
