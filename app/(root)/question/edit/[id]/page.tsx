import React from "react";
import Question from "@/components/forms/Question";
import { auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import { getQuestionById } from "@/lib/actions/questions.actions";

type ParamProps = {
  params: {
    id: string;
  };
};
const Edit = async ({ params }: ParamProps) => {
  const { userId } = auth();
  if (!userId) return null;

  const mongoUser = await getUserById({ userId });

  const result = await getQuestionById({ questionId: params.id });

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Edit Question</h1>

      <div className="mt-9">
        <Question
          type="Edit"
          mongoUserId={JSON.stringify(mongoUser.id)}
          questionDetails={JSON.stringify(result)}
        />
      </div>
    </>
  );
};

export default Edit;
