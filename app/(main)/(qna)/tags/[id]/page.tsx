import QuestionCard from "@/components/cards/QuestionCard";
import NoResult from "@/components/shared/NoResult";
import Pagination from "@/components/shared/Pagination";
import LocalSearchBar from "@/components/shared/navbar/search/LocalSearchBar";
import { getQuestionByTagId, getTagById } from "@/lib/actions/tag.action";
import { URLProps } from "@/types";
import { Suspense } from "react";

const TagDetails = async ({ params, searchParams }: URLProps) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const result = await getQuestionByTagId({
    tagId: id,
    page: resolvedSearchParams.page ? +resolvedSearchParams.page : 1,
    searchQuery: resolvedSearchParams.q,
  });

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">{result?.tagTitle}</h1>

      <div className="mt-11 w-full">
        <Suspense fallback={null}>
          <LocalSearchBar
            route={`/tags/${id}`}
            iconPosition="left"
            imgSrc="/qna/search.svg"
            placeholder="Search for questions"
            otherClasses="flex-1"
          />
        </Suspense>
      </div>

      <div className="mt-10 flex w-full flex-col gap-6">
        {result?.questions.length > 0 ? (
          result?.questions.map((question: any) => (
            <QuestionCard
              key={question._id}
              _id={question._id}
              title={question.title}
              tags={question.tags}
              author={question.author}
              upvotes={question.upvotes}
              views={question.views}
              answers={question.answers}
              createdAt={question.createdAt}
            />
          ))
        ) : (
          <NoResult
            title="Theres no tag question to show"
            description="Create tags using the ask question below"
            link="/ask-question"
            linkTitle="Ask Question"
          />
        )}
      </div>
      <Suspense fallback={null}>
        <Pagination
          pageNumber={resolvedSearchParams?.page ? +resolvedSearchParams.page : 1}
          hasNext={result?.hasNext || false}
        />
      </Suspense>
    </>
  );
};

export async function generateMetadata({ params }: URLProps) {
  const { id } = await params;
  const tag = await getTagById({ tagId: id });

  if (!tag) return;

  return {
    title: `${tag.name} | N-GVLH`,
    description: `${tag.desc}`,
  };
}

export default TagDetails;
