import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";

import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import MuxData from "@/database/muxdata.modal";
import { assertCourseOwnership, requireTeacher } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { ChapterUpdateSchema, ObjectIdSchema } from "@/lib/validations";

const getMux = () => {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error("Missing Mux credentials");
  }

  return new Mux({ tokenId, tokenSecret });
};

const errorResponse = (error: unknown, logTag: string) => {
  if (
    error instanceof Error &&
    (error.message === "Unauthorized" || error.message === "Forbidden")
  ) {
    return new NextResponse(error.message, {
      status: error.message === "Unauthorized" ? 401 : 403,
    });
  }
  console.log(logTag, error);
  return new NextResponse("Internal Error", { status: 500 });
};

const deleteMuxAsset = async (chapterId: string) => {
  const existingMuxData = await MuxData.findOne({ chapterId });

  if (!existingMuxData) return;

  if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
    try {
      await getMux().video.assets.delete(existingMuxData.assetId);
    } catch (error) {
      console.log("Mux delete error:", error);
    }
  }

  await MuxData.deleteOne({ _id: existingMuxData._id });
};

export async function DELETE(
  req: Request,
  {
    params,
  }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const user = await requireTeacher();
    const { courseId, chapterId } = await params;

    const courseParsed = ObjectIdSchema.safeParse(courseId);
    const chapterParsed = ObjectIdSchema.safeParse(chapterId);

    if (!courseParsed.success || !chapterParsed.success) {
      return new NextResponse("Invalid identifier", { status: 400 });
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    assertCourseOwnership(user, course.userId);

    const chapter = await Chapter.findOne({ _id: chapterId, courseId });

    if (!chapter) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (chapter.videoUrl) {
      await deleteMuxAsset(chapterId);
    }

    const deletedChapter = await Chapter.deleteOne({ _id: chapterId, courseId });

    await Course.findByIdAndUpdate(courseId, {
      $pull: {
        chapters: chapter._id,
      },
    });

    const publishedChaptersInCourse = await Chapter.countDocuments({
      courseId,
      isPublished: true,
    });

    if (!publishedChaptersInCourse) {
      await Course.findByIdAndUpdate(courseId, {
        isPublished: false,
      });
    }

    return NextResponse.json(deletedChapter);
  } catch (error) {
    return errorResponse(error, "[CHAPTER_ID_DELETE]");
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const user = await requireTeacher();
    const { courseId, chapterId } = await params;

    const courseParsed = ObjectIdSchema.safeParse(courseId);
    const chapterParsed = ObjectIdSchema.safeParse(chapterId);

    if (!courseParsed.success || !chapterParsed.success) {
      return new NextResponse("Invalid identifier", { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ChapterUpdateSchema.safeParse(body);

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

    const existingChapter = await Chapter.findOne({ _id: chapterId, courseId });

    if (!existingChapter) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const isMovingToYoutube = Boolean(parsed.data.youtubeUrl);

    const chapter = await Chapter.findOneAndUpdate(
      { _id: chapterId, courseId },
      {
        $set: {
          ...parsed.data,
          ...(isMovingToYoutube ? { videoUrl: undefined } : {}),
        },
      },
      { new: true, runValidators: true },
    );

    if (parsed.data.videoUrl) {
      await deleteMuxAsset(chapterId);

      const asset = await getMux().video.assets.create({
        inputs: [{ url: parsed.data.videoUrl }],
        playback_policy: ["signed"],
        test: false,
      });

      await MuxData.create({
        chapterId,
        assetId: asset.id,
        playbackId: asset.playback_ids?.[0]?.id,
      });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    return errorResponse(error, "[COURSES_CHAPTER_ID]");
  }
}
