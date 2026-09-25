"use server";

import Category from "@/database/category.modal";
import Chapter from "@/database/chapter.modal";
import Course from "@/database/course.modal";
import Purchase from "@/database/purchase.modal";
import User from "@/database/user.modal";
import UserProgress from "@/database/userprogress.modal";
import {
  CourseWithProgressWithCategory,
  GetCourses,
  GetTeacherCourses,
} from "@/types";
import { connectToDatabase } from "../mongoose";
import { getProgress } from "./progress.action";

export const getCourseNameById = async ({ courseId }: { courseId: string }) => {
  try {
    await connectToDatabase();
    const courseName = await Course.findById(courseId).lean();
    return courseName;
  } catch (error) {
    console.log("COURSE METADATA FETCHING ERROR ", error);
  }
};

export const getCourses = async ({
  userId,
  title,
  categoryId,
}: GetCourses): Promise<any[]> => {
  try {
    await connectToDatabase();
    // Fetch courses with the given conditions — use lean() to return plain objects for Next.js serialization
    const courses = categoryId
      ? await Course.find({
          isPublished: true,
          title: { $regex: title || "", $options: "i" },
          categoryId,
        })
          .sort({ createdAt: -1 })
          .lean()
          .exec()
      : await Course.find({
          isPublished: true,
          title: { $regex: title || "", $options: "i" },
        })
          .sort({ createdAt: -1 })
          .lean()
          .exec();

    const coursesWithRelatedData = await Promise.all(
      courses.map(async (course: any) => {
        const [category, chapters, purchases] = await Promise.all([
          Category.findById(course.categoryId).lean(),
          Chapter.find({ courseId: course._id, isPublished: true }, { _id: 1 }).lean(),
          Purchase.find({ courseId: course._id, userId }).lean(),
        ]);

        return {
          ...course,
          category,
          chapters,
          purchases,
        };
      }),
    );

    const coursesWithProgress = await Promise.all(
      coursesWithRelatedData.map(async (course) => {
        if (course.purchases.length === 0) {
          return {
            ...course,
            progress: null, // make progress possibly null
          };
        }

        const progressPercentage = await getProgress(userId, course._id);

        return {
          ...course,
          progress: progressPercentage,
        };
      }),
    );

    return coursesWithProgress;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
};
export const getTeacherCourses = async ({
  userId,
  teacherId,
}: GetTeacherCourses): Promise<any[]> => {
  try {
    await connectToDatabase();
    // Fetch courses with the given conditions — lean() for plain objects
    const courses = await Course.find({
      isPublished: true,
      userId: teacherId,
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const coursesWithRelatedData = await Promise.all(
      courses.map(async (course: any) => {
        const [category, chapters, purchases] = await Promise.all([
          Category.findById(course.categoryId).lean(),
          Chapter.find({ courseId: course._id, isPublished: true }, { _id: 1 }).lean(),
          Purchase.find({ courseId: course._id, userId }).lean(),
        ]);

        return {
          ...course,
          category,
          chapters,
          purchases,
        };
      }),
    );

    const coursesWithProgress = await Promise.all(
      coursesWithRelatedData.map(async (course) => {
        if (course.purchases.length === 0) {
          return {
            ...course,
            progress: null, // make progress possibly null
          };
        }

        const progressPercentage = await getProgress(userId, course._id);

        return {
          ...course,
          progress: progressPercentage,
        };
      }),
    );

    return coursesWithProgress;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
};

export async function getCourseWithChaptersAndProgress(
  courseId: string,
  userId: string,
) {
  try {
    await connectToDatabase();
    // Fetch the course by ID — lean() returns plain object, no toObject() needed
    const course: any = await Course.findById(courseId).lean();
    if (!course) {
      throw new Error("Course not found");
    }

    // Fetch the published chapters for the course
    const chapters: any[] = await Chapter.find({
      courseId,
      isPublished: true,
    })
      .sort({ position: "asc" })
      .lean();

    // Fetch user progress for each chapter
    const chaptersWithProgress = await Promise.all(
      chapters.map(async (chapter: any) => {
        const userProgress = await UserProgress.findOne({
          userId,
          chapterId: chapter._id,
        }).lean();

        return {
          ...chapter,
          userProgress: userProgress ? userProgress : null,
        };
      }),
    );

    return {
      ...course,
      chapters: chaptersWithProgress,
    };
  } catch (error) {
    console.error("Error fetching course with chapters and progress:", error);
    throw error;
  }
}

export async function getCourseWithPublishedChapters(courseId: string) {
  try {
    await connectToDatabase();
    // Fetch the course by ID — lean() for plain object
    const course: any = await Course.findById(courseId).lean();

    if (!course) {
      throw new Error("Course not found");
    }

    // Fetch the published chapters for the course — lean() avoids need for toObject()
    const chapters: any[] = await Chapter.find({
      courseId,
      isPublished: true,
    })
      .sort({ position: "asc" })
      .lean();

    return {
      ...course,
      chapters,
    };
  } catch (error) {
    console.error("Error fetching course with chapters:", error);
    throw error;
  }
}

type DashboardCourses = {
  completedCourses: any[];
  coursesInProgress: any[];
  userDetail: any;
};

export const getDashboardCourses = async (
  userId: string,
): Promise<DashboardCourses> => {
  try {
    await connectToDatabase();

    const purchasedCourses: any[] = await Purchase.find({ userId }).lean().exec();

    const coursesWithDetails: CourseWithProgressWithCategory[] = [];
    // Fetch user details — lean() for plain object serialization
    const userDetail: any = await User.findOne({ clerkId: userId }).lean().exec();

    for (const purchase of purchasedCourses) {
      // Fetch course details
      const course: any = await Course.findById(purchase.courseId).lean().exec();
      if (!course) continue;

      // Fetch category details
      const category: any = await Category.findById(course.categoryId).lean().exec();
      if (!category) continue;

      // Fetch published chapters
      const chapters: any[] = await Chapter.find({
        courseId: course._id,
        isPublished: true,
      })
        .sort({ position: "asc" })
        .lean()
        .exec();

      // Calculate progress
      const progress = await getProgress(userId, course._id.toString());

      coursesWithDetails.push({
        ...course,
        category,
        chapters,
        progress,
      });
    }

    // Filter courses into completed and in-progress
    const completedCourses = coursesWithDetails.filter(
      (course) => course.progress === 100,
    );
    const coursesInProgress = coursesWithDetails.filter(
      (course) => course.progress !== 100,
    );

    return {
      completedCourses,
      coursesInProgress,
      userDetail,
    };
  } catch (error) {
    console.log("[GET_DASHBOARD_COURSES]: ", error);
    return {
      completedCourses: [],
      coursesInProgress: [],
      userDetail: "",
    };
  }
};
