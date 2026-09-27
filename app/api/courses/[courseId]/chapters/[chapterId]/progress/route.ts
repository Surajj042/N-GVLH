import { NextResponse } from "next/server";

import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import Purchase from "@/database/purchase.modal";
import UserProgress from "@/database/userprogress.modal";
import { requireUser } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ObjectIdSchema, ProgressUpdateSchema } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const user = await requireUser();
    const { courseId, chapterId } = await params;

    const courseParsed = ObjectIdSchema.safeParse(courseId);
    const chapterParsed = ObjectIdSchema.safeParse(chapterId);

    if (!courseParsed.success || !chapterParsed.success) {
      return new NextResponse("Invalid identifier", { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ProgressUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid progress payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course || !course.isPublished) {
      return new NextResponse("Not found", { status: 404 });
    }

    const chapter = await Chapter.findOne({
      _id: chapterId,
      courseId,
      isPublished: true,
    });

    if (!chapter) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!chapter.isFree) {
      const purchase = await Purchase.findOne({
        userId: user.clerkId,
        courseId,
      });

      if (!purchase) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const userProgress = await UserProgress.findOneAndUpdate(
      {
        userId: user.clerkId,
        chapterId,
      },
      {
        $set: {
          isCompleted: parsed.data.isCompleted,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json(userProgress);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("[CHAPTER_ID_PROGRESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
