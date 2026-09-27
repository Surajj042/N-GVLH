"use server";

import { currentUser } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import Answer from "@/database/answer.modal";
import Forum from "@/database/forum.modal";
import Interaction from "@/database/interaction.modal";
import Question from "@/database/question.modal";
import Tag from "@/database/tag.modal";
import User from "@/database/user.modal";
import { BadgeCriteriaType } from "@/types";
import { canManageUser, requireAdmin, requireUser } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { clampPagination, escapeRegExp, safePath } from "@/lib/security";
import { assignBadges } from "@/lib/utils";
import {
  PUBLIC_PROFILE_SELECT,
  PUBLIC_USER_SELECT,
} from "@/lib/projection";
import { ProfileSchema } from "@/lib/validations";
import { createForum } from "./forum.action";
import {
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserStatsParams,
  ToggleSaveQuestionParams,
  UpdateUserParams,
} from "./shared.types";

const PROFILE_EDITABLE_FIELDS = [
  "name",
  "username",
  "bio",
  "location",
  "portfolioWebsite",
] as const;

export async function getAllUsers(params: GetAllUsersParams) {
  try {
    await connectToDatabase();

    const { filter, searchQuery } = params;
    const { page, pageSize } = clampPagination(params);

    const query: mongoose.QueryFilter<typeof User> = {};

    const skipAmount = (page - 1) * pageSize;

    if (searchQuery?.trim()) {
      const safeSearch = new RegExp(
        escapeRegExp(searchQuery.trim().slice(0, 100)),
        "i",
      );
      query.$or = [
        { name: { $regex: safeSearch } },
        { username: { $regex: safeSearch } },
      ];
    }

    let sortOptions: Record<string, 1 | -1> = { joinedAt: -1 };

    switch (filter) {
      case "new_users":
        sortOptions = { joinedAt: -1 };
        break;
      case "old_users":
        sortOptions = { joinedAt: 1 };
        break;
      case "top_contributors":
        sortOptions = { reputation: -1 };
        break;
      case "teachers":
        query.role = "TEACHER";
        break;
      default:
        break;
    }

    const users = await User.find(query)
      .select(PUBLIC_USER_SELECT)
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions)
      .lean();

    const totalUsers = await User.countDocuments(query);

    const hasNext = totalUsers > skipAmount + users.length;

    return { users, hasNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserById(params: { userId: string }) {
  try {
    await connectToDatabase();

    const { userId } = params;

    if (!userId) return null;

    return await User.findOne({ clerkId: userId })
      .select(PUBLIC_USER_SELECT)
      .lean();
  } catch (error) {
    console.log("Database connnection failed: ", error);
  }
}

export async function getMySavedQuestionIds(questionId: string) {
  const actor = await requireUser();

  if (!mongoose.isValidObjectId(questionId)) {
    return false;
  }

  await connectToDatabase();

  return User.exists({
    _id: actor._id,
    saved: questionId,
  }).then(Boolean);
}

export async function getMyProfile() {
  const actor = await requireUser();

  await connectToDatabase();

  return User.findById(actor._id)
    .select(
      "_id clerkId name username picture bio location portfolioWebsite role",
    )
    .lean();
}

export async function syncClerkUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    await connectToDatabase();

    const { id, firstName, lastName, imageUrl, username, emailAddresses } =
      clerkUser;
    const email = emailAddresses[0]?.emailAddress ?? "";
    const name =
      [firstName, lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "New User";

    const existingUser = await User.findOne({ clerkId: id }).lean();
    if (existingUser) {
      return existingUser;
    }

    const fallbackUsername = username || email.split("@")[0] || id;

    try {
      return await User.create({
        clerkId: id,
        name,
        username: fallbackUsername,
        email,
        picture: imageUrl,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        return await User.create({
          clerkId: id,
          name,
          username: `${fallbackUsername}-${id.slice(-6)}`,
          email: email || `${id}@users.noreply.clerk.dev`,
          picture: imageUrl,
        });
      }
      throw error;
    }
  } catch (error) {
    console.log("[SYNC_CLERK_USER]: ", error);
    return null;
  }
}

export async function updateUser(params: UpdateUserParams) {
  try {
    const actor = await requireUser();

    await connectToDatabase();

    const { clerkId, updateData, path } = params;

    if (!canManageUser(actor, clerkId)) {
      throw new Error("Forbidden");
    }

    const update: Record<string, unknown> = {};

    for (const field of PROFILE_EDITABLE_FIELDS) {
      const value = (updateData as Record<string, unknown>)?.[field];
      if (value !== undefined) {
        update[field] = value;
      }
    }

    if (Object.keys(update).length === 0) {
      throw new Error("No updatable fields provided");
    }

    const validated = ProfileSchema.partial().parse(update);

    await User.findOneAndUpdate({ clerkId }, { $set: validated }, { new: true });

    revalidatePath(safePath(path));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteUser({ clerkId }: { clerkId: string }) {
  try {
    const actor = await requireAdmin();

    await connectToDatabase();

    if (actor.clerkId === clerkId) {
      throw new Error("You cannot delete your own account");
    }

    const user = await User.findOneAndDelete({ clerkId });

    if (!user) {
      throw new Error("User not found!");
    }

    const userQuestionIds = await Question.distinct("_id", { author: user._id });
    const userAnswerIds = await Answer.distinct("_id", { author: user._id });

    await Question.deleteMany({ author: user._id });
    await Answer.deleteMany({ author: user._id });
    await Interaction.deleteMany({ user: user._id });
    await Forum.deleteMany({ teacherId: user._id });

    if (userQuestionIds.length > 0) {
      await Tag.updateMany(
        { questions: { $in: userQuestionIds } },
        { $pull: { questions: { $in: userQuestionIds } } },
      );
    }

    if (userAnswerIds.length > 0) {
      await Question.updateMany(
        { answers: { $in: userAnswerIds } },
        { $pull: { answers: { $in: userAnswerIds } } },
      );
      await Tag.updateMany(
        { answers: { $in: userAnswerIds } },
        { $pull: { answers: { $in: userAnswerIds } } },
      );
    }

    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
  try {
    const user = await requireUser();

    await connectToDatabase();

    const { questionId, path } = params;

    if (!mongoose.isValidObjectId(questionId)) {
      throw new Error("Question not found!");
    }

    const questionExists = await Question.exists({ _id: questionId });

    if (!questionExists) {
      throw new Error("Question not found!");
    }

    const isQuestionSaved = (user.saved ?? []).some(
      (id) => String(id) === questionId,
    );

    if (isQuestionSaved) {
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { saved: questionId } },
        { new: true },
      );
    } else {
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { saved: questionId } },
        { new: true },
      );
    }

    revalidatePath(safePath(path));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getSavedQuestions(params: GetSavedQuestionsParams) {
  try {
    const actor = await requireUser();

    await connectToDatabase();

    const { searchQuery, filter } = params;
    const { page, pageSize } = clampPagination(params);

    const skipAmount = (page - 1) * pageSize;

    const query: mongoose.QueryFilter<typeof Question> = searchQuery?.trim()
      ? {
          title: {
            $regex: new RegExp(escapeRegExp(searchQuery.trim().slice(0, 100)), "i"),
          },
        }
      : {};

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };

    switch (filter) {
      case "most_recent":
        sortOptions = { createdAt: -1 };
        break;

      case "oldest":
        sortOptions = { createdAt: 1 };
        break;

      case "most_voted":
        sortOptions = { upvotes: -1 };
        break;
      case "most_viewed":
        sortOptions = { views: -1 };
        break;
      case "most_answered":
        sortOptions = { answers: -1 };
        break;

      default:
        break;
    }

    const user = await User.findOne({ clerkId: actor.clerkId }).populate({
      path: "saved",
      match: query,
      options: {
        skip: skipAmount,
        limit: pageSize + 1,
        sort: sortOptions,
      },
      populate: [
        { path: "author", model: User, select: "_id clerkId name picture" },
        { path: "tags", model: Tag, select: "_id name" },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const hasNext = user.saved.length > pageSize;

    const savedQuestions = user.saved.slice(0, pageSize);

    return { questions: savedQuestions, hasNext };
  } catch (error) {
    console.log(error);

    throw error;
  }
}

export async function getUserInfo(params: { userId: string }) {
  try {
    await connectToDatabase();

    const { userId } = params;

    const user = await User.findOne({ clerkId: userId })
      .select(PUBLIC_PROFILE_SELECT)
      .lean();

    if (!user) {
      return;
    }

    const totalQuestions = await Question.countDocuments({ author: user._id });
    const totalAnswers = await Answer.countDocuments({ author: user._id });
    const [questionUpvotes] = await Question.aggregate([
      { $match: { author: user._id } },
      { $project: { _id: 0, upvotes: { $size: "$upvotes" } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotes" } } },
    ]);
    const [answerUpvotes] = await Answer.aggregate([
      { $match: { author: user._id } },
      { $project: { _id: 0, upvotes: { $size: "$upvotes" } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotes" } } },
    ]);
    const [questionViews] = await Question.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    const criteria = [
      { type: "QUESTION_COUNT" as BadgeCriteriaType, count: totalQuestions },
      { type: "ANSWER_COUNT" as BadgeCriteriaType, count: totalAnswers },
      {
        type: "QUESTION_UPVOTES" as BadgeCriteriaType,
        count: questionUpvotes?.totalUpvotes || 0,
      },
      {
        type: "ANSWER_UPVOTES" as BadgeCriteriaType,
        count: answerUpvotes?.totalUpvotes || 0,
      },
      {
        type: "TOTAL_VIEWS" as BadgeCriteriaType,
        count: questionViews?.totalViews || 0,
      },
    ];

    const badgeCounts = assignBadges({ criteria });

    return {
      user,
      totalQuestions,
      totalAnswers,
      badgeCounts,
      reputation: user.reputation,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  try {
    await connectToDatabase();

    const { userId } = params;
    const { page, pageSize } = clampPagination(params);

    const skipAmount = (page - 1) * pageSize;

    const totalQuestions = await Question.countDocuments({ author: userId });
    const userQuestions = await Question.find({ author: userId })
      .populate("tags", "_id name")
      .populate("author", "_id clerkId name picture")
      .skip(skipAmount)
      .limit(pageSize)
      .sort({ createdAt: -1, views: -1, upvotes: -1 })
      .lean();

    const hasNext = totalQuestions > skipAmount + userQuestions.length;

    return { questions: userQuestions, hasNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    await connectToDatabase();

    const { userId } = params;
    const { page, pageSize } = clampPagination(params);

    const skipAmount = (page - 1) * pageSize;

    const totalAnswers = await Answer.countDocuments({ author: userId });
    const userAnswers = await Answer.find({ author: userId })
      .populate("question", "_id title")
      .populate("author", "_id clerkId name picture")
      .skip(skipAmount)
      .limit(pageSize)
      .sort({ upvotes: -1 })
      .lean();

    const hasNext = totalAnswers > skipAmount + userAnswers.length;

    return { answers: userAnswers, hasNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function changeRole({
  clerkId,
  newRole,
}: {
  clerkId: string;
  newRole: "STUDENT" | "TEACHER" | "ADMIN";
}) {
  try {
    await requireAdmin();

    if (!["STUDENT", "TEACHER", "ADMIN"].includes(newRole)) {
      throw new Error("Invalid role specified.");
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { clerkId },
      { role: newRole, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new Error("User not found.");
    }

    if (newRole === "TEACHER") {
      await createForum({ teacherId: user.clerkId });
    }
  } catch (error) {
    console.error(`Error updating user role: ${error}`);
    throw error;
  }
}

export async function changePicture({
  clerkId,
  picture,
}: {
  clerkId: string;
  picture: string;
}) {
  try {
    const actor = await requireUser();

    if (!canManageUser(actor, clerkId)) {
      throw new Error("Forbidden");
    }

    if (typeof picture !== "string" || !/^https?:\/\//i.test(picture)) {
      throw new Error("Invalid picture URL.");
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { clerkId },
      { picture, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new Error("User not found.");
    }
  } catch (error) {
    console.error(`Error updating user picture: ${error}`);
    throw error;
  }
}

export async function isProfileTeacher({
  userId,
}: {
  userId: string;
}): Promise<boolean> {
  await connectToDatabase();
  const teacher = await User.findOne({
    clerkId: userId,
    role: "TEACHER",
  }).lean();

  return Boolean(teacher);
}

export async function isTeacher({
  userId,
}: {
  userId: string | null | undefined;
}): Promise<boolean> {
  if (userId === null || userId === undefined) return false;
  await connectToDatabase();
  const teacher = await User.findOne({
    clerkId: userId,
    role: "TEACHER",
  }).lean();

  return Boolean(teacher);
}
