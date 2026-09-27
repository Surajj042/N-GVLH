import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import mongoose from "mongoose";

import Course from "@/database/course.modal";
import User from "@/database/user.modal";
import { canManageCourse } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";

const f = createUploadthing();

const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new UploadThingError("Unauthorized");
  return { userId };
};

const handleTeacherAuth = async () => {
  const { userId } = await handleAuth();

  await connectToDatabase();

  const user = await User.findOne({ clerkId: userId }).select("role").lean();

  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    throw new UploadThingError("Forbidden");
  }

  return { userId, role: user.role };
};

const assertCourseAccess = async (
  clerkId: string,
  role: string | undefined,
  courseId: unknown,
) => {
  if (!courseId || !mongoose.isValidObjectId(String(courseId))) {
    throw new UploadThingError("Invalid course id");
  }

  await connectToDatabase();

  const course = await Course.findById(String(courseId))
    .select("userId")
    .lean();

  if (!course) {
    throw new UploadThingError("Course not found");
  }

  if (!canManageCourse({ role, clerkId }, course.userId)) {
    throw new UploadThingError("Forbidden");
  }
};

export const ourFileRouter = {
  courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleTeacherAuth())
    .onUploadComplete(async ({ metadata }) => {
      await assertCourseAccess(
        metadata.userId,
        metadata.role,
        (metadata as { courseId?: string }).courseId,
      );
    }),
  courseAttachment: f(["text", "image", "video", "audio", "pdf"])
    .middleware(() => handleTeacherAuth())
    .onUploadComplete(async ({ metadata }) => {
      await assertCourseAccess(
        metadata.userId,
        metadata.role,
        (metadata as { courseId?: string }).courseId,
      );
    }),
  chapterVideo: f({ video: { maxFileCount: 1, maxFileSize: "512MB" } })
    .middleware(() => handleTeacherAuth())
    .onUploadComplete(async ({ metadata }) => {
      await assertCourseAccess(
        metadata.userId,
        metadata.role,
        (metadata as { courseId?: string }).courseId,
      );
    }),
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
