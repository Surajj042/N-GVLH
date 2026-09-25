"use server";

import Forum, { IAnnouncement, IForum } from "@/database/forum.modal";
import User, { IUser } from "@/database/user.modal";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDatabase } from "../mongoose";

interface CreateForumParams {
  title?: string;
  teacherId: string;
}

interface FollowForumParams {
  teacherClerkId: string;
  studentId: string;
  path: string;
}

interface AddAnnouncementInForumsParams {
  forumId: string;
  title: string;
  description: string;
}

interface AddAnnouncementParams {
  userId: string;
  title: string;
  description: string;
}

interface GetAnnouncementsParams {
  studentId: string;
}
interface EditAnnouncementsParams {
  teacherId: string;
  announcementId: string;
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
    const teacher = await User?.findOne({ clerkId: teacherId });

    if (!teacher || teacher.role !== "TEACHER") {
      throw new Error("Invalid teacher");
    }

    const title = forumTitle ?? `${teacher.name}'s Forum`;

    const forumData = {
      title,
      teacherId: teacher._id,
      announcements: [],
      followers: [],
    };

    const forum = await Forum.create(forumData);

    return forum;
  } catch (error) {
    throw error;
  }
}

export async function followForum(params: FollowForumParams) {
  try {
    const { teacherClerkId, studentId, path } = params;

    if (!studentId) {
      redirect("/sign-in");
    }

    await connectToDatabase();

    const teacher = await User?.findOne({
      clerkId: teacherClerkId,
      role: "TEACHER",
    });

    const student = await User.findOne({ clerkId: studentId });
    if (!student) {
      throw new Error("Invalid student");
    }

    const forum = await Forum.findOne({ teacherId: teacher._id });
    if (!forum) {
      throw new Error("Forum not found");
    }

    if (!forum.followers.includes(student._id)) {
      forum.followers.push(student._id);
      await forum.save();
      revalidatePath(path);
    } else {
      forum.followers = forum.followers.filter(
        (followerId) => followerId.toString() !== student._id.toString(),
      );
      await forum.save();
      revalidatePath(path);
    }
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
    const teacherId = params.userId;
    if (!teacherId) {
      throw new Error("User not logged in");
    }
    const { title, description } = params;

    await connectToDatabase();

    const teacher = await User.findOne({ clerkId: teacherId, role: "TEACHER" });

    const forum = await Forum.findOne({ teacherId: teacher._id });

    if (!forum) {
      if (!forum && teacher) {
        const newForum = await createForum({ teacherId: teacherId });
        newForum.announcements.push({ title, description });
        await newForum.save();
      }
    } else {
      if (!teacher._id.equals(forum.teacherId)) {
        throw new Error("You are not authorized to make this announcement");
      }
      forum.announcements.push({ title, description });
      await forum.save();
    }
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
    // Find the forum by ID and remove the announcement from the array by title
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
  userId: string,
  announcementId: mongoose.Types.ObjectId,
  updatedFields: Partial<IAnnouncement>,
): Promise<void> {
  try {
    // Step 1: Find the forum containing the announcement
    const forum: IForum | null = await Forum.findOne({
      "announcements._id": announcementId,
    }).exec();

    if (!forum) {
      throw new Error("Forum not found");
    }

    const announcementIndex = forum.announcements.findIndex((announcement) =>
      announcement._id!.equals(announcementId),
    );

    if (announcementIndex === -1) {
      throw new Error("Announcement not found");
    }

    // Step 3: Update the announcement fields
    forum.announcements[announcementIndex] = {
      ...forum.announcements[announcementIndex],
      ...updatedFields,
    };

    // Step 4: Save the changes to the database
    await forum.save();

    console.log("Announcement updated successfully");
  } catch (error) {
    console.error("Error editing announcement: ", error);
    throw error;
  }
}
