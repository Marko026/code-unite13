"use client";
import React from "react";
import Image from "next/image";
import { deleteQuestion } from "@/lib/actions/questions.actions";
import { usePathname, useRouter } from "next/navigation";
import { deleteAnswer } from "@/lib/actions/answer.actions";
type Props = {
  type: string;
  itemId: string;
};

const EditDeleteButtons = ({ type, itemId }: Props) => {
  const pathname = usePathname() as string;
  const router = useRouter();
  const handelEdit = () => {
    router.push(`/question/edit/${itemId}`);
  };

  const handelDelete = async () => {
    if (type === "Questions") {
      await deleteQuestion({ questionId: JSON.parse(itemId), path: pathname });
    }
    if (type === "Answers") {
      await deleteAnswer({ answerId: JSON.parse(itemId), path: pathname });
    }
  };
  return (
    <div className="flex items-center justify-end gap-5 max-sm:w-full">
      {type === "Questions" && (
        <Image
          className="absolute right-10 top-4 cursor-pointer"
          src="/assets/icons/edit.svg"
          alt="edit"
          width={14}
          height={14}
          onClick={handelEdit}
        />
      )}
      <Image
        className="absolute right-4 top-4 cursor-pointer"
        src="/assets/icons/trash.svg"
        alt="delete"
        width={14}
        height={14}
        onClick={handelDelete}
      />
    </div>
  );
};

export default EditDeleteButtons;
