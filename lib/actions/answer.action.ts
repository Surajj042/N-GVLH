"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import Answer from "@/database/answer.modal";
import Course from "@/database/course.modal";
import Interaction from "@/database/interaction.modal";
import Question from "@/database/question.modal";
import User from "@/database/user.modal";
import { assertCanModify, requireUser } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { clampPagination, safePath } from "@/lib/security";
import {
  AnswerVoteParams,
  CreateAnswerParams,
  DeleteAnswerParams,
  GetAnswersParams,
} from "./shared.types";

export async function createAnswer(params: CreateAnswerParams) {
  const user = await requireUser();

  const { content, question, path } = params;

  if (!mongoose.isValidObjectId(question)) {
    throw new Error("Question not found");
  }

  await connectToDatabase();

  const questionObject = await Question.findById(question).select("tags answers");

  if (!questionObject) {
    throw new Error("Question not found");
  }

  const newAnswer = await Answer.create({
    content,
    author: user._id,
    question,
  });

  await Question.findByIdAndUpdate(question, {
    $push: { answers: newAnswer._id },
  });

  await Interaction.create({
    user: user._id,
    action: "answer",
    question,
    answer: newAnswer._id,
    tags: questionObject.tags,
  });

  await User.findByIdAndUpdate(user._id, { $inc: { reputation: 10 } });

  revalidatePath(safePath(path));
}

export async function getAnswers(params: GetAnswersParams) {
  try {
    await connectToDatabase();

    const { questionId, sortBy } = params;
    const { page, pageSize } = clampPagination(params);

    const skipAmount = (page - 1) * pageSize;

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };

    switch (sortBy) {
      case "highestUpvotes":
        sortOptions = { upvotes: -1 };
        break;

      case "lowestUpvotes":
        sortOptions = { downvotes: -1 };
        break;

      case "recent":
        sortOptions = { createdAt: -1 };
        break;

      case "old":
        sortOptions = { createdAt: 1 };
        break;

      default:
        break;
    }

    const answers = await Answer.find({ question: questionId })
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      })
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions)
      .lean();

    const totalAnswers = await Answer.countDocuments({ question: questionId });

    const hasNext = totalAnswers > answers.length + skipAmount;

    return { answers, hasNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const applyAnswerVote = async (
  answerId: string,
  direction: "up" | "down",
  path: string,
) => {
  const user = await requireUser();

  if (!mongoose.isValidObjectId(answerId)) {
    throw new Error("Answer not found");
  }

  await connectToDatabase();

  const answer = await Answer.findById(answerId);

  if (!answer) {
    throw new Error("Answer not found");
  }

  const hasUpvoted = (answer.upvotes ?? []).some(
    (id: unknown) => String(id) === String(user._id),
  );
  const hasDownvoted = (answer.downvotes ?? []).some(
    (id: unknown) => String(id) === String(user._id),
  );

  const update: Record<string, unknown> = {};

  let newVoterWeight: number;
  let newAuthorWeight: number;

  if (direction === "up") {
    const removed = hasUpvoted;

    if (removed) {
      update.$pull = { upvotes: user._id };
      newVoterWeight = 0;
      newAuthorWeight = 0;
    } else {
      update.$addToSet = { upvotes: user._id };
      if (hasDownvoted) update.$pull = { downvotes: user._id };
      newVoterWeight = 2;
      newAuthorWeight = 10;
    }
  } else {
    const removed = hasDownvoted;

    if (removed) {
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
  const oldAuthorWeight = hasUpvoted ? 10 : hasDownvoted ? -10 : 0;

  await Answer.updateOne({ _id: answerId }, update);

  const voterDelta = newVoterWeight - oldVoterWeight;

  await User.findByIdAndUpdate(user._id, { $inc: { reputation: voterDelta } });

  const isSelf = String(answer.author) === String(user._id);
  const authorDelta = newAuthorWeight - oldAuthorWeight;

  if (!isSelf && authorDelta !== 0) {
    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: authorDelta },
    });
  }

  revalidatePath(safePath(path));

  return { removed: newVoterWeight === 0 };
};

export async function upvoteAnswer(params: AnswerVoteParams) {
  return applyAnswerVote(params.answerId, "up", params.path);
}

export async function downvoteAnswer(params: AnswerVoteParams) {
  return applyAnswerVote(params.answerId, "down", params.path);
}

export async function deleteAnswer(params: DeleteAnswerParams) {
  try {
    const user = await requireUser();

    await connectToDatabase();

    const { answerId, path } = params;

    if (!mongoose.isValidObjectId(answerId)) {
      throw new Error("Answer not found!");
    }

    const answer = await Answer.findById(answerId);

    if (!answer) {
      throw new Error("Answer not found!");
    }

    const questionOwner = await Course.findById(answer.question)
      .select("userId")
      .lean();

    assertCanModify(user, answer.author, questionOwner?.userId);

    await Answer.deleteOne({ _id: answerId });
    await Question.updateMany(
      { _id: answer.question },
      { $pull: { answers: answerId } },
    );
    await Interaction.deleteMany({ answer: answerId });

    revalidatePath(safePath(path));
  } catch (error) {
    console.log(error);
    throw error;
  }
}
