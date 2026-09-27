import { NextResponse } from "next/server";

import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import { canManageCourse, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ObjectIdSchema } from "@/lib/validations";

const errorResponse = (error: unknown, logTag: string) => {
  if (
    error instanceof Error &&
    (error.message === "Unauthorized" || error.message === "Forbidden")
  ) {
    return new NextResponse(error.message, {
      status: error.message === "Unauthorized" ? 401 : 403,
    });
  }
  console.log(logTag, error);
  return new NextResponse("Internal Error", { status: 500 });
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await requireTeacher();
    const { courseId } = await params;

    if (!ObjectIdSchema.safeParse(courseId).success) {
      return new NextResponse("Invalid course id", { status: 400 });
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!canManageCourse(user, course.userId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const publishedChapterCount = await Chapter.countDocuments({
      courseId,
      isPublished: true,
    });

    if (!publishedChapterCount) {
      return new NextResponse("No published chapters", { status: 400 });
    }

    const publishedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        isPublished: true,
      },
      { new: true },
    );

    return NextResponse.json(publishedCourse);
  } catch (error) {
    return errorResponse(error, "[COURSE_ID_PUBLISH]");
  }
}
