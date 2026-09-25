import { getUserQuestions } from "@/lib/actions/user.action";
import QuestionCard from "../cards/QuestionCard";
import Pagination from "./Pagination";

interface Props {
  searchParams: { [key: string]: string | undefined };
  userId: string;
  clerkId?: string;
  pagination?: "dontshow";
}

const QuestionTab = async ({
  searchParams,
  userId,
  clerkId,
  pagination,
}: Props) => {
  const resolvedSearchParams = searchParams;
  const { questions, hasNext } = await getUserQuestions({
    userId,
    page: resolvedSearchParams.page ? +resolvedSearchParams.page : 1,
    pageSize: resolvedSearchParams.pageSize ? +resolvedSearchParams.pageSize : 10,
  });
  return (
    <div>
      {questions.map((question) => (
        <div className="mb-5 w-full" key={question._id}>
          <QuestionCard
            _id={question._id}
            clerkId={clerkId}
            title={question.title}
            tags={question.tags}
            author={question.author}
            upvotes={question.upvotes}
            views={question.views}
            answers={question.answers}
            createdAt={question.createdAt}
          />
        </div>
      ))}
      {typeof pagination === "undefined" && (
        <Pagination
          pageNumber={resolvedSearchParams?.page ? +resolvedSearchParams.page : 1}
          hasNext={hasNext}
        />
      )}
    </div>
  );
};

export default QuestionTab;
