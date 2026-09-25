import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error("Missing MONGODB_URL environment variable");
}

declare global {
  var mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

let cached =
  globalThis.mongooseCache ??
  (globalThis.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async (): Promise<typeof mongoose> => {
  mongoose.set("strictQuery", true);

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URL, {
        dbName: "n-gvlh",
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("[MONGODB_CONNECT_ERROR]", error);
    throw error;
  }

  return cached.conn;
};
