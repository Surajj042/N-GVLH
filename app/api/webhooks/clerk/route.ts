import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/mongoose";
import User from "@/database/user.modal";

const buildName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string,
  clerkId: string,
) =>
  [firstName, lastName].filter(Boolean).join(" ").trim() ||
  email.split("@")[0] ||
  clerkId;

export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!signingSecret) {
    console.warn(
      "CLERK_WEBHOOK_SIGNING_SECRET is not set - Clerk webhooks will be skipped (set it after deploying, see .env.example)",
    );
    return new NextResponse(
      "Webhook not configured: CLERK_WEBHOOK_SIGNING_SECRET missing",
      { status: 503 },
    );
  }

  const headerPayload = req.headers;
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Error: Missing svix headers", { status: 400 });
  }

  const rawBody = await req.text();

  const wh = new Webhook(signingSecret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new NextResponse("Error: Verification error", { status: 400 });
  }

  const eventType = evt.type;

  if (
    eventType !== "user.created" &&
    eventType !== "user.updated" &&
    eventType !== "user.deleted"
  ) {
    return NextResponse.json({ message: "Webhook received" });
  }

  try {
    await connectToDatabase();

    if (eventType === "user.deleted") {
      const { id } = evt.data;

      if (id) {
        await User.deleteOne({ clerkId: id });
      }

      return NextResponse.json({ message: "User deleted" });
    }

    const { id, email_addresses, image_url, username, first_name, last_name } =
      evt.data;

    if (!id) {
      return new NextResponse("Error: Missing user id", { status: 400 });
    }

    const email = email_addresses[0]?.email_address ?? "";
    const name = buildName(first_name, last_name, email, id);
    const preferredUsername = username || email.split("@")[0] || id;

    if (eventType === "user.created") {
      const existingUser = await User.findOne({ clerkId: id });

      if (existingUser) {
        await User.updateOne(
          { clerkId: id },
          { $set: { name, username: preferredUsername, email, picture: image_url } },
        );
      } else {
        const baseUsername = preferredUsername;
        let finalUsername = baseUsername;
        let suffix = 1;

        while (
          await User.exists({
            username: finalUsername,
            clerkId: { $ne: id },
          })
        ) {
          finalUsername = `${baseUsername}${suffix}`;
          suffix += 1;
        }

        await User.create({
          clerkId: id,
          name,
          username: finalUsername,
          email,
          picture: image_url,
        });
      }

      return NextResponse.json({ message: "User created" });
    }

    await User.findOneAndUpdate(
      { clerkId: id },
      { $set: { name, email, picture: image_url } },
    );

    return NextResponse.json({ message: "User updated" });
  } catch (error) {
    console.error("[CLERK_WEBHOOK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
