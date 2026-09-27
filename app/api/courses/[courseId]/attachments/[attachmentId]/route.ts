import { NextResponse } from "next/server";

import Attachment from "@/database/attachment.modal";
import Course from "@/database/course.modal";
import { assertCourseOwnership, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ObjectIdSchema } from "@/lib/validations";

export async function DELETE(
  req: Request,
  {
    params,
  }: { params: Promise<{ courseId: string; attachmentId: string }> },
) {
  try {
    const user = await requireTeacher();
    const { courseId, attachmentId } = await params;

    const courseParsed = ObjectIdSchema.safeParse(courseId);
    const attachmentParsed = ObjectIdSchema.safeParse(attachmentId);

    if (!courseParsed.success || !attachmentParsed.success) {
      return new NextResponse("Invalid identifier", { status: 400 });
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    assertCourseOwnership(user, course.userId);

    const attachment = await Attachment.findOne({ _id: attachmentId, courseId });

    if (!attachment) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleted = await Attachment.deleteOne({ _id: attachmentId, courseId });

    await Course.findByIdAndUpdate(courseId, {
      $pull: { attachments: attachmentId },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("ATTACHMENT_ID", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
