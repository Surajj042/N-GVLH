import mongoose from "mongoose";

// Optional helper — currently not imported anywhere (dead code kept intentionally).
// Can be used to resolve the Next.js warning:
// Warning: Only plain objects can be passed to Client Components from Server Components. Objects with toJSON methods are not supported. Convert it manually to a simple value before passing it to props.
// Alternative in this codebase is using `.toObject()` / `.lean()` as done in `lib/actions/course.action.ts`.
// Keep this file as a reusable utility for manual ObjectId → string conversion if needed; safe to delete if never used.

type PlainObject = { [key: string]: any };

function transformObjectIds(obj: any): PlainObject {
  if (Array.isArray(obj)) {
    return obj.map(transformObjectIds);
  } else if (obj && typeof obj === "object") {
    const result: PlainObject = {};
    const doc = obj._doc || obj; // Extract _doc if available
    for (const key of Object.keys(doc)) {
      const value = doc[key];

      if (key.startsWith("$")) {
        continue; // Skip internal Mongoose properties
      }

      if (key === "_id") {
        result[key] = value ? value.toString() : null; // Convert _id to string
      } else if (mongoose.Types.ObjectId.isValid(value)) {
        result[key] = value.toString();
      } else if (value && typeof value === "object") {
        result[key] = transformObjectIds(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return obj;
}

export default transformObjectIds;
