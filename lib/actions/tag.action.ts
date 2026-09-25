"use server";

import User from "@/database/user.modal";
import { connectToDatabase } from "../mongoose";
import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTagByIdParams,
  GetTopInteractedTagsParams,
} from "./shared.types";
import Tag, { ITag } from "@/database/tag.modal";
import Question from "@/database/question.modal";
import Interaction from "@/database/interaction.modal";
import mongoose from "mongoose";

export async function getAllTags(params: GetAllTagsParams) {
  try {
    await connectToDatabase();

    const { searchQuery, filter, page = 1, pageSize = 5 } = params;

    const query: mongoose.QueryFilter<typeof Tag> = {};

    const skipAmount = (page - 1) * pageSize;

    if (searchQuery) {
      query.$or = [{ name: { $regex: new RegExp(searchQuery, "i") } }];
    }

    let sortOptions = {};

    switch (filter) {
      case "popular":
        // questionCount is defined in aggregrate function below
        sortOptions = { questionCount: -1 };
        break;

      case "recent":
        sortOptions = { createdAt: -1 };
        break;

      case "name":
        sortOptions = { name: 1 };
        break;

      case "old":
        sortOptions = { createdAt: 1 };
        break;

      default:
        sortOptions = { questionCount: -1 };
        break;
    }

    const totalTags = await Tag.countDocuments(query);

    const tags = await Tag.aggregate([
      { $match: query },
      {
        $project: {
          name: 1,
          questions: 1,
          questionCount: { $size: "$questions" },
        },
      },
      { $sort: sortOptions },
      { $skip: skipAmount },
      { $limit: pageSize + 1 },
    ]);

    const hasNext = totalTags > skipAmount + tags.length;

    return { tags, hasNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getTagById(params: GetTagByIdParams) {
  try {
    await connectToDatabase();

    const { tagId } = params;

    if (mongoose.isValidObjectId(tagId)) {
      const tag = await Tag.findById(tagId);

      return tag;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getTopInteractedTags(params: GetTopInteractedTagsParams) {
  // Previously a stub returning hardcoded React/Typescript; now implements real aggregation.
  try {
    await connectToDatabase();

    const { userId, limit = 3 } = params;

    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    const topTags = await Interaction.aggregate([
      { $match: { user: user._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "tags",
          localField: "_id",
          foreignField: "_id",
          as: "tagDoc",
        },
      },
      { $unwind: "$tagDoc" },
      { $project: { _id: "$tagDoc._id", name: "$tagDoc.name", count: 1 } },
    ]);

    if (topTags.length === 0) {
      // Fallback to most popular tags when user has no interactions
      const popular = await Tag.aggregate([
        { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
        { $sort: { numberOfQuestions: -1 } },
        { $limit: limit },
      ]);
      return popular;
    }

    return topTags;
  } catch (error) {
    console.log(error);
    // Fallback to popular tags on error
    try {
      const fallback = await Tag.aggregate([
        { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
        { $sort: { numberOfQuestions: -1 } },
        { $limit: 3 },
      ]);
      return fallback;
    } catch {}
    return [];
  }
}

export async function getTopPopularTags() {
  try {
    await connectToDatabase();

    const popularTags = await Tag.aggregate([
      { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
      { $sort: { numberOfQuestions: -1 } },
      { $limit: 5 },
    ]);

    return popularTags;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getQuestionByTagId(params: GetQuestionsByTagIdParams) {
  try {
    await connectToDatabase();

    const { tagId, page = 1, pageSize = 5, searchQuery } = params;
    const skipAmount = (page - 1) * pageSize;

    const tagFilter: mongoose.QueryFilter<ITag> = { _id: tagId };
    let tag;

    if (mongoose.isValidObjectId(tagId)) {
      tag = await Tag.findOne(tagFilter).populate({
        path: "questions",
        model: Question,
        match: searchQuery
          ? { title: { $regex: searchQuery, $options: "i" } }
          : {},
        options: {
          skip: skipAmount,
          limit: pageSize + 1, // pageSize+1 to find if there are other questions and compute hasNext based on that
          sort: { createdAt: -1 },
        },
        populate: [
          { path: "tags", model: Tag, select: "_id name" },
          { path: "author", model: User, select: "_id clerkId name picture" },
        ],
      });
    }

    if (!tag) {
      return;
    }

    const questions = tag.questions;

    const hasNext = questions.length > pageSize;

    return { tagTitle: tag.name, questions, hasNext };
  } catch (error) {
    console.log(error);

    throw error;
  }
}
