import { NextResponse } from "next/server";

import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import { canManageCourse, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ObjectIdSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const user = await requireTeacher();
    const { courseId, chapterId } = await params;

    const courseParsed = ObjectIdSchema.safeParse(courseId);
    const chapterParsed = ObjectIdSchema.safeParse(chapterId);

    if (!courseParsed.success || !chapterParsed.success) {
      return new NextResponse("Invalid identifier", { status: 400 });
    }

    await connectToDatabase();

    const courseOwner = await Course.findById(courseId);

    if (!courseOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!canManageCourse(user, courseOwner.userId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const existingChapter = await Chapter.findOne({ _id: chapterId, courseId });

    if (!existingChapter) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedChapter = await Chapter.findByIdAndUpdate(
      { _id: chapterId, courseId },
      {
        isPublished: false,
      },
      { new: true },
    );

    const publishedChapterCount = await Chapter.countDocuments({
      courseId,
      isPublished: true,
    });

    if (!publishedChapterCount) {
      await Course.findByIdAndUpdate(courseId, {
        isPublished: false,
      });
    }

    return NextResponse.json(unpublishedChapter);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("[CHAPTER_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
