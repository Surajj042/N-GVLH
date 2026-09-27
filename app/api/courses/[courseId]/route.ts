import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";

import Attachment from "@/database/attachment.modal";
import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import MuxData from "@/database/muxdata.modal";
import Purchase from "@/database/purchase.modal";
import { canManageCourse, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { CourseUpdateSchema, ObjectIdSchema } from "@/lib/validations";

const getMux = () => {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error("Missing Mux credentials");
  }

  return new Mux({ tokenId, tokenSecret });
};

const errorResponse = (error: unknown) => {
  if (
    error instanceof Error &&
    (error.message === "Unauthorized" || error.message === "Forbidden")
  ) {
    return new NextResponse(error.message, {
      status: error.message === "Unauthorized" ? 401 : 403,
    });
  }
  console.log("[COURSE_ID]", error);
  return new NextResponse("Internal Error", { status: 500 });
};

export async function DELETE(
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

    const chapters = await Chapter.find({ courseId });

    if (chapters.length > 0 && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
      const mux = getMux();

      for (const chapter of chapters) {
        const muxData = await MuxData.findOne({ chapterId: chapter._id });

        if (muxData) {
          try {
            await mux.video.assets.delete(muxData.assetId);
          } catch (error) {
            console.log("Mux asset delete error:", error);
          }
          await MuxData.deleteOne({ _id: muxData._id });
        }
      }
    }

    await Chapter.deleteMany({ courseId });
    await Attachment.deleteMany({ courseId });
    await Purchase.deleteMany({ courseId });

    const deletedCourse = await Course.deleteOne({ _id: courseId });

    return NextResponse.json(deletedCourse);
  } catch (error) {
    return errorResponse(error);
  }
}

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

    const body = await req.json().catch(() => null);
    const parsed = CourseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid course payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (!canManageCourse(user, course.userId)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { $set: parsed.data },
      { new: true, runValidators: true },
    );

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
