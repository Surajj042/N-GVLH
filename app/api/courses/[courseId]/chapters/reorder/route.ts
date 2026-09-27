import { NextResponse } from "next/server";

import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import { assertCourseOwnership, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ChapterReorderSchema, ObjectIdSchema } from "@/lib/validations";

export async function PUT(
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
    const parsed = ChapterReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reorder payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    assertCourseOwnership(user, course.userId);

    const chapterIds = parsed.data.list.map((item) => item.id);
    const ownedChapterCount = await Chapter.countDocuments({
      _id: { $in: chapterIds },
      courseId,
    });

    if (ownedChapterCount !== chapterIds.length) {
      return new NextResponse("One or more chapters are not part of this course", {
        status: 400,
      });
    }

    await Chapter.bulkWrite(
      parsed.data.list.map((item) => ({
        updateOne: {
          filter: { _id: item.id, courseId },
          update: { $set: { position: item.position } },
        },
      })),
    );

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("[REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
