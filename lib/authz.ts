import { auth } from "@clerk/nextjs/server";

import User, { IUser } from "@/database/user.modal";
import { connectToDatabase } from "@/lib/mongoose";

export const ADMIN_ENV_IDS = () =>
  [process.env.ADMIN_ID_1, process.env.ADMIN_ID_2].filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

export const isAdminClerkId = (clerkId?: string | null) =>
  Boolean(clerkId) && ADMIN_ENV_IDS().includes(clerkId as string);

export const isTeacherRole = (role?: string) => role === "TEACHER";

export const isAdminRole = (role?: string) => role === "ADMIN";

export const getCurrentClerkId = async () => {
  const { userId } = await auth();
  return userId ?? null;
};

export const getCurrentUser = async (): Promise<IUser | null> => {
  const clerkId = await getCurrentClerkId();
  if (!clerkId) return null;

  await connectToDatabase();
  return User.findOne({ clerkId });
};

export const requireUser = async (): Promise<IUser> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};

export const requireAdmin = async (): Promise<IUser> => {
  const user = await requireUser();
  if (!isAdminRole(user.role) && !isAdminClerkId(user.clerkId)) {
    throw new Error("Forbidden");
  }
  return user;
};

export const requireTeacher = async (): Promise<IUser> => {
  const user = await requireUser();
  if (!isTeacherRole(user.role) && !isAdminRole(user.role) && !isAdminClerkId(user.clerkId)) {
    throw new Error("Forbidden");
  }
  return user;
};

type ActorLike = {
  role?: string;
  clerkId?: string;
};

type AuthorLike = ActorLike & { _id?: unknown };

export const canManageCourse = (user: ActorLike, courseUserId: unknown) => {
  if (isAdminRole(user.role) || isAdminClerkId(user.clerkId)) return true;
  if (!courseUserId) return false;
  return String(courseUserId) === String(user.clerkId);
};

export const canManageUser = (actor: ActorLike, targetClerkId: unknown) => {
  if (isAdminRole(actor.role) || isAdminClerkId(actor.clerkId)) return true;
  if (!targetClerkId) return false;
  return String(targetClerkId) === String(actor.clerkId);
};

export const canModifyContent = (
  user: AuthorLike,
  authorId: unknown,
  courseOwnerId?: unknown,
) => {
  if (isAdminRole(user.role) || isAdminClerkId(user.clerkId)) return true;
  if (authorId && user._id && String(authorId) === String(user._id)) return true;
  if (courseOwnerId) return canManageCourse(user, courseOwnerId);
  return false;
};

export const assertCourseOwnership = (
  user: ActorLike,
  courseUserId: unknown,
) => {
  if (!canManageCourse(user, courseUserId)) {
    throw new Error("Forbidden");
  }
};

export const assertCanModify = (
  user: AuthorLike,
  authorId: unknown,
  courseOwnerId?: unknown,
) => {
  if (!canModifyContent(user, authorId, courseOwnerId)) {
    throw new Error("Forbidden");
  }
};

export const toPublicUser = (user: {
  _id?: unknown;
  name?: string;
  username?: string;
  picture?: string;
}) => ({
  _id: user._id ? String(user._id) : undefined,
  name: user.name ?? "",
  username: user.username ?? "",
  picture: user.picture ?? "",
});
