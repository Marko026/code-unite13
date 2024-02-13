import Image from "next/image";
import React from "react";
type StarCardProps = {
  imgUrl: string;
  value: number;
  title: string;
};

const StarCard = ({ imgUrl, value, title }: StarCardProps) => {
  return (
    <div className=" border grow basis-1/3 xl:basis-1/5 p-6 light-border background-light900_dark300 rounded-md shadow-light-300 dark:shadow-dark-200">
      <div className="flex items-center xs:items-start xs:flex-col sm:flex-row sm:justify-center sm:items-center gap-2">
        <Image src={imgUrl} height={40} width={54} alt="medal" />
        <div className="flex flex-col  ">
          <p className="paragraph-semibold text-dark200_light900">{value}</p>
          <p className="body-medium text-dark400_light700">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StarCard;
