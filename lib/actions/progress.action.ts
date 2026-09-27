"use server";
import mongoose from "mongoose";
import Chapter from "@/database/chapter.modal";
import UserProgress from "@/database/userprogress.modal";
import { getCurrentUser } from "@/lib/authz";
import { connectToDatabase } from "../mongoose";

export const getProgress = async (
  userId: string,
  courseId: string,
): Promise<number | null> => {
  try {
    if (!mongoose.isValidObjectId(courseId)) return 0;

    await connectToDatabase();

    const publishedChapters = await Chapter.find(
      { courseId, isPublished: true },
      { _id: 1 },
    ).lean();

    const publishedChapterIds = publishedChapters.map((chapter) => chapter._id);

    if (!publishedChapterIds.length) return 0;

    const validCompletedChapters = await UserProgress.countDocuments({
      userId,
      chapterId: { $in: publishedChapterIds },
      isCompleted: true,
    });

    const progressPercentage =
      (validCompletedChapters / publishedChapterIds.length) * 100;

    return progressPercentage;
  } catch (error) {
    console.log("[GET_PROGRESS]", error);
    return 0;
  }
};

export const getMyProgress = async (
  courseId: string,
): Promise<number | null> => {
  const user = await getCurrentUser();

  if (!user) return null;

  return getProgress(user.clerkId, courseId);
};
