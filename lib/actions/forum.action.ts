"use server";

import Forum, { IAnnouncement, IForum } from "@/database/forum.modal";
import User, { IUser } from "@/database/user.modal";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/authz";
import { safePath } from "@/lib/security";
import { connectToDatabase } from "../mongoose";

interface CreateForumParams {
  title?: string;
  teacherId: string;
}

interface FollowForumParams {
  teacherClerkId: string;
  path: string;
}

interface AddAnnouncementParams {
  title: string;
  description: string;
}

interface GetAnnouncementsParams {
  studentId: string;
}

/**
 * Creates a new forum in the database.
 * @param params - Object containing title and teacherId.
 * @returns The created forum object if successful.
 * @throws Error if the teacher is invalid or any other error occurs.
 */
export async function createForum(params: CreateForumParams) {
  try {
    await connectToDatabase();

    const { teacherId, title: forumTitle } = params;
    const teacher = await User.findOne({ clerkId: teacherId });

    if (!teacher || teacher.role !== "TEACHER") {
      throw new Error("Invalid teacher");
    }

    const title = forumTitle ?? `${teacher.name}'s Forum`;

    const existingForum = await Forum.findOne({ teacherId: teacher._id });

    if (existingForum) {
      return existingForum;
    }

    const forum = await Forum.create({
      title,
      teacherId: teacher._id,
      announcements: [],
      followers: [],
    });

    return forum;
  } catch (error) {
    throw error;
  }
}

export async function followForum(params: FollowForumParams) {
  try {
    const student = await requireUser();

    const { teacherClerkId, path } = params;

    await connectToDatabase();

    const teacher = await User.findOne({
      clerkId: teacherClerkId,
      role: "TEACHER",
    });

    if (!teacher) {
      throw new Error("Forum not found");
    }

    if (String(teacher._id) === String(student._id)) {
      throw new Error("You cannot follow your own forum");
    }

    const forum = await Forum.findOne({ teacherId: teacher._id });
    if (!forum) {
      throw new Error("Forum not found");
    }

    const alreadyFollowing = forum.followers.some(
      (followerId) => String(followerId) === String(student._id),
    );

    if (alreadyFollowing) {
      await Forum.updateOne(
        { _id: forum._id },
        { $pull: { followers: student._id } },
      );
    } else {
      await Forum.updateOne(
        { _id: forum._id },
        { $addToSet: { followers: student._id } },
      );
    }

    revalidatePath(safePath(path));
  } catch (error) {
    throw error;
  }
}

export async function isFollowing({
  teacherId,
  studentId,
}: {
  teacherId: string;
  studentId: string | null;
}) {
  if (!studentId) {
    return false;
  }

  await connectToDatabase();

  const [teacher, student] = await Promise.all([
    User.findOne({ clerkId: teacherId }).select("_id").lean(),
    User.findOne({ clerkId: studentId }).select("_id").lean(),
  ]);

  if (!teacher || !student) {
    return false;
  }

  const exists = await Forum.exists({
    teacherId: teacher._id,
    followers: student._id,
  });

  return !!exists;
}

/**
 * Adds a new announcement to a specified forum by its ID.
 * @param params - Object containing forumId, title, and description of the announcement.
 * @returns Updated forum with the new announcement added.
 * @throws Error if the forum is not found or any other error occurs during the process.
 */
export async function addAnnouncement(params: AddAnnouncementParams) {
  try {
    const teacher = await requireUser();

    if (teacher.role !== "TEACHER") {
      throw new Error("You are not authorized to make this announcement");
    }

    const { title, description } = params;

    if (typeof title !== "string" || !title.trim() || title.length > 255) {
      throw new Error("Invalid announcement title");
    }

    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.length > 65535
    ) {
      throw new Error("Invalid announcement description");
    }

    await connectToDatabase();

    const forum = await Forum.findOneAndUpdate(
      { teacherId: teacher._id },
      { $push: { announcements: { title, description } } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return forum;
  } catch (error) {
    throw error;
  }
}

export async function getStudentAnnouncements(
  params: GetAnnouncementsParams,
): Promise<IAnnouncement[]> {
  try {
    await connectToDatabase();
    const { studentId } = params;

    const student = await User.findOne({ clerkId: studentId })
      .select("_id")
      .lean();
    if (!student) return [];

    const forums = await Forum.find({ followers: student._id })
      .populate({
        path: "teacherId",
        model: User,
        select: "name username picture",
      })
      .lean()
      .exec();

    const allAnnouncements: IAnnouncement[] = (forums as any[]).flatMap(
      (forum) => {
        const teacher = forum.teacherId as IUser | null;
        return forum.announcements.map((announcement: IAnnouncement) => {
          const plain =
            typeof (announcement as any).toObject === "function"
              ? (announcement as any).toObject()
              : { ...announcement };
          if (teacher) {
            return {
              ...plain,
              teacherName: teacher.name,
              teacherPicture: teacher.picture,
              teacherUsername: teacher.username,
            };
          }
          return plain;
        });
      }
    );

    allAnnouncements.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return allAnnouncements;
  } catch (error) {
    console.error("Error fetching announcements: ", error);
    throw error;
  }
}

export async function getTeacherAnnouncements({
  teacherClerkId,
}: {
  teacherClerkId: string;
}) {
  const teacher = await User.findOne({ clerkId: teacherClerkId })
    .select("_id")
    .lean();
  if (!teacher) return [];

  const forums = await Forum.find({ teacherId: teacher._id })
    .populate({
      path: "teacherId",
      model: User,
      select: "name username picture",
    })
    .lean()
    .exec();

  const allAnnouncements: IAnnouncement[] = (forums as any[]).flatMap(
    (forum) => {
      const teacherInfo = forum.teacherId as IUser | null;
      return forum.announcements.map((announcement: IAnnouncement) => {
        const plain =
          typeof (announcement as any).toObject === "function"
            ? (announcement as any).toObject()
            : { ...announcement };
        if (teacherInfo) {
          return {
            ...plain,
            teacherName: teacherInfo.name,
            teacherPicture: teacherInfo.picture,
            teacherUsername: teacherInfo.username,
          };
        }
        return plain;
      });
    }
  );

  allAnnouncements.sort((a, b) => {
    const dateA = new Date(a.updatedAt || 0);
    const dateB = new Date(b.updatedAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return allAnnouncements;
}

async function deleteAnnouncementByTitle({
  forumId,
  announcementTitle,
}: {
  forumId: string;
  announcementTitle: string;
}) {
  try {
    const updatedForum = await Forum.findOneAndUpdate(
      { _id: forumId },
      { $pull: { announcements: { title: announcementTitle } } },
      { new: true },
    );

    if (!updatedForum) {
      console.log("Forum not found");
      return null;
    }

    return updatedForum;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
}

export async function editAnnouncement(
  announcementId: mongoose.Types.ObjectId,
  updatedFields: Partial<Pick<IAnnouncement, "title" | "description">>,
): Promise<void> {
  try {
    const actor = await requireUser();

    await connectToDatabase();

    const forum: IForum | null = await Forum.findOne({
      "announcements._id": announcementId,
    }).exec();

    if (!forum) {
      throw new Error("Forum not found");
    }

    if (String(forum.teacherId) !== String(actor._id)) {
      throw new Error("You are not authorized to edit this announcement");
    }

    const announcementIndex = forum.announcements.findIndex(
      (announcement) => announcement._id!.equals(announcementId),
    );

    if (announcementIndex === -1) {
      throw new Error("Announcement not found");
    }

    if (updatedFields.title !== undefined) {
      if (
        typeof updatedFields.title !== "string" ||
        !updatedFields.title.trim() ||
        updatedFields.title.length > 255
      ) {
        throw new Error("Invalid announcement title");
      }
    }

    if (updatedFields.description !== undefined) {
      if (
        typeof updatedFields.description !== "string" ||
        !updatedFields.description.trim() ||
        updatedFields.description.length > 65535
      ) {
        throw new Error("Invalid announcement description");
      }
    }

    forum.announcements[announcementIndex] = {
      ...forum.announcements[announcementIndex],
      ...updatedFields,
    };

    await forum.save();

    console.log("Announcement updated successfully");
  } catch (error) {
    console.error("Error editing announcement: ", error);
    throw error;
  }
}
