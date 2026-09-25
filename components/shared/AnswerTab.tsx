import { getUserAnswers } from "@/lib/actions/user.action";
import AnswerCard from "../cards/AnswerCard";
import Pagination from "./Pagination";

interface Props {
  searchParams: { [key: string]: string | undefined };
  userId: string;
  pagination?: "dontshow";
  clerkId?: string | null;
}

const AnswerTab = async ({
  searchParams,
  userId,
  clerkId,
  pagination,
}: Props) => {
  const resolvedSearchParams = searchParams;
  const { answers, hasNext } = await getUserAnswers({
    userId,
    page: resolvedSearchParams.page ? +resolvedSearchParams.page : 1,
    pageSize: resolvedSearchParams.pageSize ? +resolvedSearchParams.pageSize : 10,
  });

  return (
    <div>
      {answers.map((item) => (
        <AnswerCard
          key={item._id}
          answer={item.content}
          _id={item._id}
          clerkId={clerkId}
          question={item.question}
          author={item.author}
          upvotes={item.upvotes.length}
          createdAt={item.createdAt}
        />
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

export default AnswerTab;
