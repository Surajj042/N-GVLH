import { NextResponse } from "next/server";
import { z } from "zod";

import Course from "@/database/course.modal";
import { requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";

const CourseCreateSchema = z
  .object({
    title: z.string().trim().min(3).max(130),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const user = await requireTeacher();

    const body = await req.json().catch(() => null);
    const parsed = CourseCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid course payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const course = await Course.create({
      userId: user.clerkId,
      title: parsed.data.title,
    });

    return NextResponse.json(course);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return new NextResponse(error.message, {
        status: error.message === "Unauthorized" ? 401 : 403,
      });
    }
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
