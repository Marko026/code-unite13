import Image from "next/image";
import Link from "next/link";
import React from "react";

type ProfileLinksProps = {
  imgUrl: string;
  title: string;
  href?: string;
};

const ProfileLink = ({ imgUrl, title, href }: ProfileLinksProps) => {
  return (
    <div className="flex-center">
      <Image src={imgUrl} width={20} height={20} alt="icon" />
      {href ? (
        <Link
          href={href}
          target="_blank"
          className=" paragraph-medium text-blue-400 "
        >
          {title}
        </Link>
      ) : (
        <p className="paragraph-medium text-dark400_light700">{title}</p>
      )}
    </div>
  );
};

export default ProfileLink;
