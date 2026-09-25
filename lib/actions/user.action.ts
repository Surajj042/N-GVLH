"use server";

import Answer from "@/database/answer.modal";
import Question from "@/database/question.modal";
import Tag from "@/database/tag.modal";
import User from "@/database/user.modal";
import Interaction from "@/database/interaction.modal";
import Forum from "@/database/forum.modal";
import { BadgeCriteriaType } from "@/types";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../mongoose";
import { assignBadges } from "../utils";
import { currentUser } from "@clerk/nextjs/server";
import {
  CreateUserParams,
  DeleteUserParams,
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserByIdParams,
  GetUserStatsParams,
  ToggleSaveQuestionParams,
  UpdateUserParams,
} from "./shared.types";
import { createForum } from "./forum.action";

export async function getAllUsers(params: GetAllUsersParams) {
  try {
    await connectToDatabase();

    const { page = 1, pageSize = 10, filter, searchQuery } = params;

    const query: mongoose.QueryFilter<typeof User> = {};

    const skipAmount = (page - 1) * pageSize;

    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(searchQuery, "i") } },
        { username: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }

    let sortOptions = {};

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
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    const totalUsers = await User.countDocuments(query);

    const hasNext = totalUsers > skipAmount + pageSize;

    return { users, hasNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserById(params: any) {
  try {
    await connectToDatabase();

    const { userId } = params;

    const user = await User?.findOne({ clerkId: userId }).lean();

    return user;
  } catch (error) {
    console.log("Database connnection failed: ", error);
  }
}

export async function createUser(userData: CreateUserParams) {
  try {
    await connectToDatabase();

    const newUser = await User.create(userData);

    return newUser;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Self-healing sync between Clerk and MongoDB. Creates the MongoDB user
 * record if it does not exist yet (e.g. the Clerk `user.created` webhook
 * was not delivered in local development). Safe to call on every request.
 */
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
      // Duplicate key (username/email already taken) — retry with a unique suffix
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
    await connectToDatabase();

    const { clerkId, updateData, path } = params;

    await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });

    revalidatePath(path);
  } catch (error) {
    console.log(error);
  }
}

export async function deleteUser(params: DeleteUserParams) {
  try {
    await connectToDatabase();

    const { clerkId } = params;

    const user = await User.findOneAndDelete({ clerkId });

    if (!user) {
      throw new Error("User not found!");
    }

    // Collect user's question IDs to clean Tag references
    const userQuestionIds = await Question.distinct("_id", { author: user._id });

    // Delete all user-related data
    await Question.deleteMany({ author: user._id });
    await Answer.deleteMany({ author: user._id });
    await Interaction.deleteMany({ user: user._id });
    await Forum.deleteMany({ teacherId: user._id });

    // Clean up Tag references to deleted questions
    if (userQuestionIds.length > 0) {
      await Tag.updateMany(
        { questions: { $in: userQuestionIds } },
        { $pull: { questions: { $in: userQuestionIds } } },
      );
    }

    return user;
  } catch (error) {
    console.log(error);
  }
}

export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
  try {
    await connectToDatabase();

    const { userId, questionId, path } = params;

    const user = await User.findById(userId);

    if (!user) {
      throw Error("User not found!");
    }

    const isQuestionSaved = user.saved.includes(questionId);

    if (isQuestionSaved) {
      // remove question from saved
      await User.findByIdAndUpdate(
        userId,
        { $pull: { saved: questionId } },
        { new: true },
      );
    } else {
      // add question to saved
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { saved: questionId } },
        { new: true },
      );
    }

    revalidatePath(path);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getSavedQuestions(params: GetSavedQuestionsParams) {
  try {
    await connectToDatabase();

    const { clerkId, searchQuery, filter, page = 1, pageSize = 10 } = params;

    const skipAmount = (page - 1) * pageSize;

    const query: mongoose.QueryFilter<typeof Question> = searchQuery
      ? { title: { $regex: new RegExp(searchQuery, "i") } }
      : {};

    let sortOptions = {};

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

    const user = await User.findOne({ clerkId }).populate({
      path: "saved",
      match: query,
      options: {
        skip: skipAmount,
        // pageSize+1 to find if there are other questions and compute hasNext based on that
        limit: pageSize + 1,
        sort: sortOptions,
      },
      populate: [
        { path: "author", model: User, select: "_id clerkId name picture" },
        { path: "tags", model: Tag, select: "_id name" },
      ],
    });

    const hasNext = user.saved.length > pageSize;

    if (!user) {
      throw new Error("User not found");
    }

    const savedQuestions = user.saved;

    return { questions: savedQuestions, hasNext };
    //
  } catch (error) {
    //
    console.log(error);

    throw error;
  }
}

export async function getUserInfo(params: GetUserByIdParams) {
  try {
    await connectToDatabase();

    const { userId } = params;

    const user = await User.findOne({ clerkId: userId }).lean();

    if (!user) {
      return;
      // throw new Error("User not found!");
    }

    const totalQuestions = await Question.countDocuments({ author: user._id });
    const totalAnswers = await Answer.countDocuments({ author: user._id });
    const [questionUpvotes] = await Question.aggregate([
      { $match: { author: user._id } },
      {
        $project: {
          _id: 0,
          upvotes: { $size: "$upvotes" },
        },
      },
      {
        $group: {
          _id: null,
          totalUpvotes: { $sum: "$upvotes" },
        },
      },
    ]);
    const [answerUpvotes] = await Answer.aggregate([
      { $match: { author: user._id } },
      {
        $project: {
          _id: 0,
          upvotes: { $size: "$upvotes" },
        },
      },
      {
        $group: {
          _id: null,
          totalUpvotes: { $sum: "$upvotes" },
        },
      },
    ]);
    const [questionViews] = await Question.aggregate([
      { $match: { author: user._id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
        },
      },
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

    const { userId, page = 1, pageSize = 10 } = params;

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

    const { userId, page = 1, pageSize = 10 } = params;

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
  newRole: "STUDENT" | "TEACHER";
}) {
  try {
    // Validate the new role
    const validRoles = ["STUDENT", "TEACHER"];
    if (!validRoles.includes(newRole)) {
      throw new Error("Invalid role specified.");
    }

    await connectToDatabase();

    // Find the user by ID and update the role
    const user = await User.findOneAndUpdate(
      { clerkId },
      { role: newRole, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if(user.role === "TEACHER"){
      await createForum({teacherId: user.clerkId});
    }

    if (!user) {
      throw new Error("User not found.");
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
    // Find the user by ID and update the role
    const user = await User.findOneAndUpdate(
      { clerkId },
      { picture, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new Error("User not found.");
    }
  } catch (error) {
    console.error(`Error updating user role: ${error}`);
    throw error;
  }
}

export async function isProfileTeacher({
  userId,
}: {
  userId: string;
}): Promise<boolean> {
  await connectToDatabase();
  const teacher = await User?.findOne({
    clerkId: userId,
    role: "TEACHER",
  });
  if (teacher) {
    return true;
  }
  return false;
}
export async function isTeacher({
  userId,
}: {
  userId: string | null | undefined;
}): Promise<boolean> {
  if (userId === null || userId === undefined) return false;
  await connectToDatabase();
  const teacher = await User?.findOne({
    clerkId: userId,
    role: "TEACHER",
  });

  if (teacher) {
    return true;
  }
  return false;
}
