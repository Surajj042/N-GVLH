"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import Answer from "@/database/answer.modal";
import Interaction from "@/database/interaction.modal";
import Question from "@/database/question.modal";
import Tag from "@/database/tag.modal";
import User from "@/database/user.modal";
import { assertCanModify, requireUser } from "@/lib/authz";
import { AUTHOR_SELECT as PUBLIC_USER_SELECT } from "@/lib/projection";
import { connectToDatabase } from "@/lib/mongoose";
import {
  clampPagination,
  escapeRegExp,
  safePath,
} from "@/lib/security";
import {
  CreateQuestionParams,
  DeleteQuestionParams,
  EditQuestionParams,
  GetQuestionByIdParams,
  GetQuestionsParams,
  QuestionVoteParams,
  RecommendedParams,
} from "./shared.types";

export async function getQuestions(params: GetQuestionsParams) {
  try {
    await connectToDatabase();

    const { searchQuery, filter } = params;
    const { page, pageSize } = clampPagination(params);

    const query: mongoose.QueryFilter<typeof Question> = {};

    const skipAmount = (page - 1) * pageSize;

    if (searchQuery?.trim()) {
      const safeSearch = new RegExp(escapeRegExp(searchQuery.trim().slice(0, 100)), "i");
      query.$or = [
        { title: { $regex: safeSearch } },
        { content: { $regex: safeSearch } },
      ];
    }

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };

    switch (filter) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;

      case "frequent":
        sortOptions = { views: -1 };
        break;

      case "unanswered":
        query.answers = { $size: 0 };
        break;

      default:
        break;
    }

    const questions = await Question.find(query)
      .populate({
        path: "author",
        model: User,
        select: PUBLIC_USER_SELECT,
      })
      .populate({ path: "tags", model: Tag, select: "_id name" })
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions)
      .lean();

    const totalQuestions = await Question.countDocuments(query);

    const hasNext = totalQuestions > skipAmount + questions.length;

    return { questions, hasNext };
  } catch (error) {
    console.log(error);

    throw error;
  }
}

export async function getQuestionById(params: GetQuestionByIdParams) {
  try {
    await connectToDatabase();

    const { questionId } = params;

    if (mongoose.isValidObjectId(questionId)) {
      const question = await Question.findById(questionId)
        .populate({
          path: "author",
          model: User,
          select: "_id clerkId name picture",
        })
        .populate({
          path: "tags",
          model: Tag,
          select: "_id name",
        })
        .lean();

      return question;
    }
  } catch (error) {
    console.log(error);

    throw error;
  }
}

export async function getQuestionByIdAndIncreaseViews(
  params: GetQuestionByIdParams,
) {
  try {
    await connectToDatabase();

    const { questionId } = params;

    if (!mongoose.isValidObjectId(questionId)) {
      return null;
    }

    const question = await Question.findByIdAndUpdate(
      questionId,
      { $inc: { views: 1 } },
      { new: true },
    )
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      })
      .populate({
        path: "tags",
        model: Tag,
        select: "_id name",
      })
      .lean();

    if (!question) {
      return null;
    }

    return question;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getHotQuestions() {
  try {
    await connectToDatabase();

    const hotQuestions = await Question.find({})
      .sort({ views: -1, upvotes: -1 })
      .limit(5)
      .lean();

    return hotQuestions;
  } catch (error) {
    console.log(error);
  }
}

export async function createQuestion(params: CreateQuestionParams) {
  try {
    const user = await requireUser();

    await connectToDatabase();

    const { title, content, tags, path } = params;

    const question = await Question.create({
      title,
      content,
      author: user._id,
    });

    const tagDocuments: mongoose.Types.ObjectId[] = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        { name: new RegExp(`^${escapeRegExp(tag)}$`, "i") },
        { $setOnInsert: { name: tag }, $push: { questions: question._id } },
        { upsert: true, new: true },
      );

      tagDocuments.push(existingTag._id);
    }

    await Question.findByIdAndUpdate(question._id, {
      $push: { tags: { $each: tagDocuments } },
    });

    await Interaction.create({
      user: user._id,
      action: "ask_question",
      question: question._id,
      tags: tagDocuments,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { reputation: 5 } });

    revalidatePath(safePath(path));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const applyVote = async (
  target: "question" | "answer",
  id: string,
  direction: "up" | "down",
  path: string,
) => {
  const user = await requireUser();

  await connectToDatabase();

  const Model = target === "question" ? Question : Answer;
  const document = await Model.findById(id);

  if (!document) {
    throw new Error(target === "question" ? "Question not found" : "Answer not found");
  }

  const upvotes = (document.upvotes ?? []) as unknown[];
  const downvotes = (document.downvotes ?? []) as unknown[];

  const hasUpvoted = upvotes.some((id: unknown) => String(id) === String(user._id));
  const hasDownvoted = downvotes.some((id: unknown) => String(id) === String(user._id));

  const update: Record<string, unknown> = {};

  let newVoterWeight: number;
  let newAuthorWeight: number;

  if (direction === "up") {
    if (hasUpvoted) {
      update.$pull = { upvotes: user._id };
      newVoterWeight = 0;
      newAuthorWeight = 0;
    } else {
      update.$addToSet = { upvotes: user._id };
      if (hasDownvoted) update.$pull = { downvotes: user._id };
      newVoterWeight = 2;
      newAuthorWeight = 5;
    }
  } else {
    if (hasDownvoted) {
      update.$pull = { downvotes: user._id };
      newVoterWeight = 0;
      newAuthorWeight = 0;
    } else {
      update.$addToSet = { downvotes: user._id };
      if (hasUpvoted) update.$pull = { upvotes: user._id };
      newVoterWeight = -2;
      newAuthorWeight = -10;
    }
  }

  const oldVoterWeight = hasUpvoted ? 2 : hasDownvoted ? -2 : 0;
  const oldAuthorWeight = hasUpvoted ? 5 : hasDownvoted ? -10 : 0;

  await Model.updateOne({ _id: id }, update);

  const voterDelta = newVoterWeight - oldVoterWeight;
  const authorDelta = newAuthorWeight - oldAuthorWeight;

  if (String(document.author) !== String(user._id) && authorDelta !== 0) {
    await User.findByIdAndUpdate(document.author, {
      $inc: { reputation: authorDelta },
    });
  }

  if (voterDelta !== 0) {
    await User.findByIdAndUpdate(user._id, {
      $inc: { reputation: voterDelta },
    });
  }

  revalidatePath(safePath(path));

  return { removed: newVoterWeight === 0 };
};

export async function upvoteQuestion(params: QuestionVoteParams) {
  return applyVote("question", params.questionId, "up", params.path);
}

export async function downvoteQuestion(params: QuestionVoteParams) {
  return applyVote("question", params.questionId, "down", params.path);
}

export async function deleteQuestion(params: DeleteQuestionParams) {
  try {
    const user = await requireUser();

    await connectToDatabase();

    const { questionId, path } = params;

    if (!mongoose.isValidObjectId(questionId)) {
      throw new Error("Question not found");
    }

    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    assertCanModify(user, question.author);

    await Question.deleteOne({ _id: questionId });
    await Answer.deleteMany({ question: questionId });
    await Interaction.deleteMany({ question: questionId });
    await Tag.updateMany(
      { questions: questionId },
      { $pull: { questions: questionId } },
    );

    revalidatePath(safePath(path));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function editQuestion(params: EditQuestionParams) {
  try {
    const user = await requireUser();

    await connectToDatabase();

    const { questionId, title, content, path } = params;

    if (!mongoose.isValidObjectId(questionId)) {
      throw new Error("Question not found");
    }

    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    assertCanModify(user, question.author);

    const update: Record<string, string> = {};

    if (typeof title === "string") update.title = title;
    if (typeof content === "string") update.content = content;

    if (Object.keys(update).length > 0) {
      await Question.findByIdAndUpdate(questionId, { $set: update });
    }

    revalidatePath(safePath(path));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getRecommendedQuestions(params: RecommendedParams) {
  try {
    await connectToDatabase();

    const { userId, searchQuery } = params;
    const { page, pageSize } = clampPagination(params);

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      throw new Error("user not found");
    }

    const skipAmount = (page - 1) * pageSize;

    const safeSearch = searchQuery?.trim()
      ? new RegExp(escapeRegExp(searchQuery.trim().slice(0, 100)), "i")
      : null;

    const userInteractions = await Interaction.find({ user: user._id })
      .populate("tags")
      .exec();

    const userTags = userInteractions.reduce((tags, interaction) => {
      if (interaction.tags) {
        tags = tags.concat(interaction.tags);
      }
      return tags;
    }, []);

    const distinctUserTagIds = [
      ...new Set(userTags.map((tag: unknown) => String((tag as { _id: unknown })._id))),
    ];

    const baseQuery: Record<string, unknown> = {
      author: { $ne: user._id },
    };

    if (distinctUserTagIds.length) {
      baseQuery.tags = { $in: distinctUserTagIds };
    }

    if (safeSearch) {
      baseQuery.$or = [
        { title: { $regex: safeSearch } },
        { content: { $regex: safeSearch } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> =
      distinctUserTagIds.length > 0
        ? { createdAt: -1 }
        : { views: -1, upvotes: -1 };

    const totalQuestions = await Question.countDocuments(
      baseQuery as mongoose.QueryFilter<typeof Question>,
    );

    const recommendedQuestions = await Question.find(
      baseQuery as mongoose.QueryFilter<typeof Question>,
    )
      .populate({
        path: "tags",
        model: Tag,
        select: "_id name",
      })
      .populate({
        path: "author",
        model: User,
        select: PUBLIC_USER_SELECT,
      })
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions)
      .lean();

    const hasNext = totalQuestions > skipAmount + recommendedQuestions.length;

    return { questions: recommendedQuestions, hasNext };
  } catch (error) {
    console.error("Error getting recommended questions:", error);
    throw error;
  }
}
