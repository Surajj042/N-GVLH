import Question from "@/components/forms/Question";
import { getQuestionById } from "@/lib/actions/question.action";
import { getUserById } from "@/lib/actions/user.action";
import { ParamsProps } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  authors: [
    {
      name: "CMRegmi | Github",
      url: "https://github.com/LowkeyGud",
    },
    {
      name: "CMRegmi | Wakatime",
      url: "https://wakatime.com/@lowkeygud",
    },
  ],
  title: "Edit Question | N-GVLH",
  description: "Easily Edit Your Question",
};

const Edit = async ({ params }: ParamsProps) => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const mongoUser = await getUserById({ userId });
  const result = await getQuestionById({ questionId: id });

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Edit Question</h1>
      <div className="mt-9">
        <Question
          type="Edit"
          mongoUserId={JSON.stringify(mongoUser._id)}
          questionDetails={JSON.stringify(result)}
        />
      </div>
    </>
  );
};

export default Edit;
