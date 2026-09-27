import { Banner } from "@/components/banner";
import { Preview } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getChapter, getChapterNameById } from "@/lib/actions/chapter.action";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AttachmentBox } from "./_components/attachment-box";
import { CourseEnrollButton } from "./_components/course-enroll-button";
import { CourseProgressButton } from "./_components/course-progress-button";
import { VideoPlayer } from "./_components/video-player";

export const dynamic = "force-dynamic";

const ChapterIdPage = async ({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const { courseId, chapterId } = await params;

  const {
    chapter,
    course,
    muxData,
    attachments,
    nextChapter,
    userProgress,
    purchase,
    isLocked,
    isDeleted,
  } = await getChapter({ chapterId, courseId });

  if (!course) {
    return redirect("/get-started");
  }

  if (isLocked || !chapter) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 pb-20">
        <Banner
          variant="warning"
          label="This chapter is part of a paid course. Purchase the course to unlock its content."
        />
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border p-6">
          <h2 className="mb-2 text-2xl font-semibold">Locked chapter</h2>
          <p className="text-sm text-muted-foreground">
            Chapter titles, descriptions, media, and attachments stay hidden until
            the course is purchased.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <CourseEnrollButton courseId={courseId} price={course.price!} />
            <Button variant="ghost" asChild>
              <Link href={`/courses/${courseId}`}>Back to course</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completeOnEnd = !!purchase && !userProgress?.isCompleted;

  return (
    <div>
      {userProgress?.isCompleted && (
        <Banner
          variant="success"
          label="You have already completed this chapter."
        />
      )}
      <div className="mx-auto flex max-w-4xl flex-col pb-20">
        <div className="p-4">
          <VideoPlayer
            isDeleted={isDeleted!}
            chapterId={chapterId}
            title={chapter.title}
            courseId={courseId}
            nextChapterId={nextChapter?._id}
            playbackId={muxData?.playbackId!}
            youtubeUrl={chapter.youtubeUrl}
            isLocked={false}
            completeOnEnd={completeOnEnd}
          />
        </div>
        <div>
          <div className="flex flex-col items-center justify-between p-4 md:flex-row">
            <h2 className="mb-2 text-2xl font-semibold">{chapter.title}</h2>
            {purchase ? (
              <CourseProgressButton
                chapterId={chapterId}
                courseId={courseId}
                nextChapterId={nextChapter?._id}
                isCompleted={!!userProgress?.isCompleted}
              />
            ) : (
              <CourseEnrollButton
                courseId={courseId}
                price={course.price!}
              />
            )}
          </div>
          <Separator />
          <div>
            <Preview value={chapter.description!} />
          </div>
          {!!attachments?.length && (
            <>
              <div className="p-4">
                {attachments.map((attachment) => (
                  <AttachmentBox
                    key={attachment._id}
                    url={attachment.url}
                    name={attachment.name}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = await getChapterNameById({ chapterId });

  if (!chapter) return;

  return {
    title: `${chapter.title}`,
  };
}

export default ChapterIdPage;
