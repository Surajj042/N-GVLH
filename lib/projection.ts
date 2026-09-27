export const AUTHOR_FIELDS = [
  "_id",
  "clerkId",
  "name",
  "username",
  "picture",
  "reputation",
] as const;

export const PUBLIC_USER_FIELDS = [
  "_id",
  "clerkId",
  "name",
  "username",
  "picture",
  "reputation",
  "role",
] as const;

export const PUBLIC_PROFILE_FIELDS = [
  "_id",
  "clerkId",
  "name",
  "username",
  "picture",
  "bio",
  "location",
  "portfolioWebsite",
  "joinedAt",
  "reputation",
  "role",
] as const;

export const AUTHOR_SELECT = AUTHOR_FIELDS.join(" ");
export const PUBLIC_USER_SELECT = PUBLIC_USER_FIELDS.join(" ");
export const PUBLIC_PROFILE_SELECT = PUBLIC_PROFILE_FIELDS.join(" ");

export const PRIVATE_USER_FIELDS = [
  "email",
  "password",
  "saved",
  "createdAt",
  "updatedAt",
] as const;
