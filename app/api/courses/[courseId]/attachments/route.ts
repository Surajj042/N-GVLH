import { NextResponse } from "next/server";

import Attachment from "@/database/attachment.modal";
import Course from "@/database/course.modal";
import { assertCourseOwnership, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { AttachmentCreateSchema, ObjectIdSchema } from "@/lib/validations";

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
    const parsed = AttachmentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid attachment payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    assertCourseOwnership(user, course.userId);

    const { url, originalFilename } = parsed.data;

    const attachment = await Attachment.create({
      url,
      name: originalFilename || url.split("/").pop(),
      courseId,
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { attachments: attachment._id },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("COURSE_ID_ATTACHMENTS", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
