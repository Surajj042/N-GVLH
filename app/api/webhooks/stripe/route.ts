import Course from "@/database/course.modal";
import Purchase from "@/database/purchase.modal";
import { connectToDatabase } from "@/lib/mongoose";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const HANDLED_EVENTS = new Set(["checkout.session.completed"]);

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn(
      "STRIPE_WEBHOOK_SECRET is not set - Stripe webhooks will be skipped (set it after deploying, see .env.example)",
    );
    return new NextResponse(
      "Webhook not configured: STRIPE_WEBHOOK_SECRET missing",
      { status: 503 },
    );
  }

  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Webhook Error: Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid signature";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return new NextResponse(null, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;

  if (!userId || !courseId) {
    return new NextResponse("Webhook Error: Missing metadata", { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return new NextResponse("Webhook Error: Session is not paid", {
      status: 400,
    });
  }

  try {
    await connectToDatabase();

    const course = await Course.findById(courseId).select("_id price").lean();

    if (!course) {
      return new NextResponse("Webhook Error: Course not found", { status: 404 });
    }

    const purchase = await Purchase.findOneAndUpdate(
      { userId, courseId },
      {
        $setOnInsert: {
          userId,
          courseId,
          price: (session.amount_total || 0) / 100,
        },
      },
      { upsert: true, new: true },
    );

    if (purchase) {
      await Course.updateOne(
        { _id: courseId },
        { $addToSet: { purchases: purchase._id } },
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.log("[STRIPE_WEBHOOK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
