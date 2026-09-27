import { NextResponse } from "next/server";

import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import { assertCourseOwnership, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ChapterCreateSchema, ObjectIdSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await requireTeacher();
    const { courseId } = await params;

    if (!ObjectIdSchema.safeParse(courseId).success) {
      return new NextResponse("Invalid course id", { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ChapterCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chapter payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    assertCourseOwnership(user, course.userId);

    const lastChapter = await Chapter.findOne({ courseId }).sort({
      position: -1,
    });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await Chapter.create({
      title: parsed.data.title,
      courseId,
      position: newPosition,
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { chapters: chapter._id },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("[CHAPTERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
