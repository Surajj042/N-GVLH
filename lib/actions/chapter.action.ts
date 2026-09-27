"use server";

import Mux from "@mux/mux-node";
import mongoose from "mongoose";

import Attachment from "@/database/attachment.modal";
import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import MuxData from "@/database/muxdata.modal";
import Purchase from "@/database/purchase.modal";
import UserProgress from "@/database/userprogress.modal";
import { getCurrentUser } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { GetChapterProps } from "@/types";

const getMux = () => {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) return null;

  return new Mux({ tokenId, tokenSecret });
};

export const getChapterNameById = async ({
  chapterId,
}: {
  chapterId: string;
}) => {
  try {
    if (!mongoose.isValidObjectId(chapterId)) return null;

    const user = await getCurrentUser();

    await connectToDatabase();

    const chapter = await Chapter.findById(chapterId)
      .select("title isFree courseId isPublished")
      .lean();

    if (!chapter || !chapter.isPublished) return null;

    if (chapter.isFree) return { title: chapter.title };

    if (!user) return null;

    const [course, purchase] = await Promise.all([
      Course.findById(chapter.courseId).select("userId").lean(),
      Purchase.findOne({ userId: user.clerkId, courseId: chapter.courseId }).lean(),
    ]);

    if (!course) return null;

    if (purchase || course.userId === user.clerkId) {
      return { title: chapter.title };
    }

    return null;
  } catch (error) {
    console.log("CHAPTER METADATA FETCHING ERROR ", error);
    return null;
  }
};

export const getChapter = async ({
  courseId,
  chapterId,
}: GetChapterProps) => {
  try {
    if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(chapterId)) {
      throw new Error("Chapter or course not found");
    }

    const user = await getCurrentUser();

    await connectToDatabase();

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    }).select("price title description imageUrl userId");

    if (!course) {
      throw new Error("Chapter or course not found");
    }

    const chapter = await Chapter.findOne({
      _id: chapterId,
      courseId,
      isPublished: true,
    });

    if (!chapter) {
      throw new Error("Chapter or course not found");
    }

    const purchase = user
      ? await Purchase.findOne({ userId: user.clerkId, courseId })
      : null;

    const isOwner = Boolean(user && course.userId === user.clerkId);
    const hasAccess = Boolean(chapter.isFree || purchase || isOwner);

    if (!hasAccess) {
      return {
        chapter: null,
        course: course.toObject(),
        muxData: null,
        attachments: [],
        nextChapter: null,
        userProgress: null,
        purchase: null,
        isLocked: true,
        isDeleted: true,
      };
    }

    const muxData = await MuxData.findOne({ chapterId });

    let isDeleted = false;

    if (muxData?.assetId) {
      const mux = getMux();

      if (mux) {
        try {
          await mux.video.assets.retrieve(muxData.assetId);
          isDeleted = false;
        } catch {
          isDeleted = true;
        }
      } else {
        isDeleted = true;
      }
    }

    const [attachments, nextChapter] = await Promise.all([
      Attachment.find({ courseId }),
      Chapter.findOne({
        courseId,
        isPublished: true,
        position: { $gt: chapter.position },
      })
        .sort({ position: "asc" })
        .select("title position"),
    ]);

    const userProgress = user
      ? await UserProgress.findOne({
          userId: user.clerkId,
          chapterId,
        })
      : null;

    return {
      chapter: chapter.toObject(),
      course: course.toObject(),
      muxData: muxData ? muxData.toObject() : null,
      attachments: attachments.map((attachment) => attachment.toObject()),
      nextChapter: nextChapter ? nextChapter.toObject() : null,
      userProgress: userProgress ? userProgress.toObject() : null,
      purchase: purchase ? purchase.toObject() : null,
      isLocked: false,
      isDeleted,
    };
  } catch (error) {
    console.log(error);
    return {
      chapter: null,
      course: null,
      muxData: null,
      attachments: null,
      nextChapter: null,
      userProgress: null,
      purchase: null,
      isLocked: false,
      isDeleted: true,
    };
  }
};
