import { getTopInteractedTags } from "@/lib/actions/tag.actions";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import RenderTag from "./RenderTag";
import { Badge } from "../ui/badge";

interface UserProps {
  user: {
    _id: string;
    name: string;
    username: string;
    picture: string;
    clerkId: string;
  };
}

const UserCard = async ({ user }: UserProps) => {
  const interactedTags = await getTopInteractedTags({ userId: user._id });

  return (
    <Link
      href={`/profile/${user.clerkId}`}
      className="shadow-light100_darknone w-full flex-col max-xs:min-w-full xs:w-[250px]"
    >
      <article className="background-light900_dark200 light-border flex w-full flex-col items-center justify-center rounded-2xl border p-8">
        <Image
          src={user.picture}
          width={100}
          height={100}
          className="rounded-full  "
          alt="user profile picture"
        />
        <div className="mt-4 text-center">
          <h3 className="h3-bold text-dark200_light900 line-clamp-1">
            {user.name}
          </h3>
          <p className="body-regular text-dark500_light500 mt-2">
            @{user.username}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {interactedTags && interactedTags?.length > 0 ? (
            interactedTags?.map((tag) => (
              <RenderTag key={tag._id} _id={tag._id} name={tag.name} />
            ))
          ) : (
            <Badge>
              <span className="text-dark500_light500">No tags yet</span>
            </Badge>
          )}
        </div>
      </article>
    </Link>
  );
};

export default UserCard;
