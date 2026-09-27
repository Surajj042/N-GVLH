import { getCourseWithPublishedChapters } from "@/lib/actions/course.action";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const CourseIdPage = async ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = await params;

  const course = await getCourseWithPublishedChapters(courseId);

  if (!course || !course.isPublished) {
    return redirect("/not-found");
  }

  return redirect(`/courses/${course._id}/chapters/${course.chapters[0]._id}`);
};

export default CourseIdPage;
