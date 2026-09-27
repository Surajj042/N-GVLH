import { NextResponse } from "next/server";

import Course from "@/database/course.modal";
import Purchase from "@/database/purchase.modal";
import StripeCustomer from "@/database/stripecustomer.modal";
import { requireUser } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongoose";
import { stripe } from "@/lib/stripe";
import { ObjectIdSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await requireUser();
    const { courseId } = await params;

    if (!ObjectIdSchema.safeParse(courseId).success) {
      return new NextResponse("Invalid course id", { status: 400 });
    }

    await connectToDatabase();

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    const existingPurchase = await Purchase.findOne({
      userId: user.clerkId,
      courseId,
    });

    if (existingPurchase) {
      return new NextResponse("Already purchased", { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      console.log("[COURSE_ID_CHECKOUT] NEXT_PUBLIC_APP_URL is not configured");
      return new NextResponse("Checkout is not configured", { status: 503 });
    }

    const price = course.price || 0;

    if (!price) {
      await Purchase.create({
        userId: user.clerkId,
        courseId,
        price: 0,
      });

      return NextResponse.json({
        url: `${appUrl}/courses/${courseId}?success=1`,
      });
    }

    let stripeCustomer = await StripeCustomer.findOne({
      userId: user.clerkId,
    });

    if (!stripeCustomer) {
      const customer = await stripe.customers.create({
        metadata: {
          userId: user.clerkId,
        },
      });

      stripeCustomer = await StripeCustomer.create({
        userId: user.clerkId,
        stripeCustomerId: customer.id,
      });
    }

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: course.description || "",
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      line_items,
      mode: "payment",
      success_url: `${appUrl}/courses/${courseId}?success=1`,
      cancel_url: `${appUrl}/courses/${courseId}?canceled=1`,
      metadata: {
        courseId,
        userId: user.clerkId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("[COURSE_ID_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
