import mongoose from "mongoose";

import Purchase from "@/database/purchase.modal";
import User from "@/database/user.modal";
import UserProgress from "@/database/userprogress.modal";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error("Missing MONGODB_URL environment variable");
}

const apply = process.argv.includes("--apply");

type DupReport = { groups: number; extraDocs: number; samples: unknown[] };

const findDuplicates = async (
  collection: mongoose.Collection,
  fields: string[],
): Promise<DupReport> => {
  const groups = await collection
    .aggregate([
      { $group: { _id: fields.map((f) => ({ [f]: `$${f}` })), count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])
    .toArray();

  const groupsWithTotals = await collection
    .aggregate([
      { $group: { _id: fields.map((f) => ({ [f]: `$${f}` })), count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $group: { _id: null, groups: { $sum: 1 }, extraDocs: { $sum: { $subtract: ["$count", 1] } } } },
    ])
    .toArray();

  const totals = groupsWithTotals[0];

  return {
    groups: totals?.groups ?? 0,
    extraDocs: totals?.extraDocs ?? 0,
    samples: groups,
  };
};

const ensureUniqueIndex = async (
  label: string,
  collection: mongoose.Collection,
  keys: Record<string, 1>,
  report: DupReport,
) => {
  const name = Object.keys(keys)
    .map((k) => `${k}_1`)
    .join("_");

  if (report.groups > 0) {
    console.error(
      `  SKIPPED ${label}: ${report.groups} duplicate group(s) ` +
        `(${report.extraDocs} redundant doc(s)) block a unique index.`,
    );
    console.error("           Resolve duplicates first, then re-run with --apply.");
    return false;
  }

  if (apply) {
    await collection.createIndex(keys, { unique: true, name });
    console.log(`  created  ${label} unique index (${name})`);
  } else {
    console.log(`  would create ${label} unique index (${name})`);
  }
  return true;
};

const main = async () => {
  await mongoose.connect(MONGODB_URL, {
    dbName: "n-gvlh",
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle");

  const purchases = Purchase.collection;
  const userProgress = UserProgress.collection;
  const users = User.collection;

  console.log(apply ? "APPLYING migrations\n" : "DRY RUN - pass --apply to write\n");

  console.log("Purchase duplicates (userId, courseId):");
  const purchaseDupes = await findDuplicates(purchases, ["userId", "courseId"]);
  console.log(
    `  ${purchaseDupes.groups} duplicate group(s), ${purchaseDupes.extraDocs} redundant doc(s)`,
  );

  console.log("\nUserProgress duplicates (userId, chapterId):");
  const progressDupes = await findDuplicates(userProgress, [
    "userId",
    "chapterId",
  ]);
  console.log(
    `  ${progressDupes.groups} duplicate group(s), ${progressDupes.extraDocs} redundant doc(s)`,
  );

  const passwordCount = await users.countDocuments({
    password: { $exists: true, $ne: null },
  });
  const chapterCount = await userProgress.countDocuments({
    chapter: { $exists: true, $ne: null },
  });
  console.log(`\nLegacy User.password docs: ${passwordCount}`);
  console.log(`Legacy UserProgress.chapter docs: ${chapterCount}`);

  console.log("\nIndexes:");
  await ensureUniqueIndex("Purchase", purchases, { userId: 1, courseId: 1 }, purchaseDupes);
  await ensureUniqueIndex(
    "UserProgress",
    userProgress,
    { userId: 1, chapterId: 1 },
    progressDupes,
  );

  if (apply) {
    if (passwordCount > 0) {
      const res = await users.updateMany(
        { password: { $exists: true, $ne: null } },
        { $unset: { password: "" } },
      );
      console.log(`\n  unset User.password on ${res.modifiedCount} doc(s)`);
    }
    if (chapterCount > 0) {
      const res = await userProgress.updateMany(
        { chapter: { $exists: true, $ne: null } },
        { $unset: { chapter: "" } },
      );
      console.log(`  unset UserProgress.chapter on ${res.modifiedCount} doc(s)`);
    }
  } else if (passwordCount > 0 || chapterCount > 0) {
    console.log(
      `\n  would unset User.password on ${passwordCount} and ` +
        `UserProgress.chapter on ${chapterCount} doc(s)`,
    );
  }

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
