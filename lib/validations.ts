import * as z from "zod";

export const QuestionsSchema = z.object({
  title: z.string().min(5).max(130),
  explanation: z.string().min(20).max(20000),
  tags: z.array(z.string().min(1).max(15)).min(1).max(3),
});

export const AnswerSchema = z.object({
  answer: z.string().min(50).max(20000),
});

export const ProfileSchema = z.object({
  name: z.string().min(5).max(50),
  username: z
    .string()
    .min(5)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username contains invalid characters"),
  bio: z.string().max(500).optional().or(z.literal("")),
  portfolioWebsite: z.string().url().max(300).optional().or(z.literal("")),
  location: z.string().max(50).optional().or(z.literal("")),
});

export const ObjectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid identifier");

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid http(s) URL" },
  );

export const CourseTitleSchema = z.string().trim().min(3).max(130);

export const CourseUpdateSchema = z
  .object({
    title: CourseTitleSchema.optional(),
    description: z.string().max(20000).optional(),
    imageUrl: optionalUrl.optional(),
    price: z.coerce.number().min(0).max(10000).optional(),
    categoryId: ObjectIdSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updatable fields provided",
  });

export const ChapterCreateSchema = z.object({
  title: CourseTitleSchema,
});

const YouTubeUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const url = new URL(
          value.startsWith("http") ? value : `https://${value}`,
        );
        return (
          ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
            url.hostname,
          ) && url.pathname.length > 1
        );
      } catch {
        return false;
      }
    },
    { message: "Invalid YouTube URL" },
  );

export const ChapterUpdateSchema = z
  .object({
    title: CourseTitleSchema.optional(),
    description: z.string().max(20000).optional(),
    videoUrl: optionalUrl.optional(),
    youtubeUrl: YouTubeUrlSchema.optional(),
    isFree: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updatable fields provided",
  });

export const ChapterReorderSchema = z.object({
  list: z
    .array(
      z.object({
        id: ObjectIdSchema,
        position: z.number().int().min(0).max(10000),
      }),
    )
    .min(1)
    .max(500),
});

export const ProgressUpdateSchema = z
  .object({
    isCompleted: z.boolean(),
  })
  .strict();

export const AttachmentCreateSchema = z.object({
  url: optionalUrl,
  originalFilename: z.string().trim().min(1).max(255),
});

export const QuestionEditSchema = QuestionsSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updatable fields provided",
  });

export const VoteSchema = z
  .object({
    targetType: z.enum(["question", "answer"]),
    targetId: ObjectIdSchema,
    voteDirection: z.enum(["up", "down"]),
  })
  .strict();

export const RoleUpdateSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});
