import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentClerkId } from "@/lib/authz";

const GeminiRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

const requestLog = new Map<string, number[]>();

const isRateLimited = (key: string) => {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(key, recent);
  return false;
};

export async function POST(req: Request) {
  try {
    const clerkId = await getCurrentClerkId();

    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (isRateLimited(clerkId)) {
      return new NextResponse("Too many requests", { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new NextResponse("AI features are not configured", { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const parsed = GeminiRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `You are a helpful AI assistant. Answer the following question concisely and accurately:\n\n${parsed.data.question}`,
    );
    const response = await result.response;

    return NextResponse.json({ text: response.text() });
  } catch (error) {
    console.log("[GEMINI_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
