import Question from "@/components/forms/Question";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const AskQuestion = async () => {
  const { userId } = await auth();

  if (!userId) redirect("/get-started");

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">Ask a question</h1>

      <div className="mt-9">
        <Question />
      </div>
    </div>
  );
};

export async function generateMetadata() {
  return {
    title: "Ask a Question | N-GVLH",
    description: "Get Answers of Your Problems",
  };
}

export default AskQuestion;
