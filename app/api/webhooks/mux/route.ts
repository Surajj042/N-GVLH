import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";

import MuxData from "@/database/muxdata.modal";
import { connectToDatabase } from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    if (!req.headers.get("mux-signature")) {
      return new NextResponse("Missing mux-signature", { status: 400 });
    }

    const signingSecret = process.env.MUX_WEBHOOK_SIGNING_SECRET;

    if (!signingSecret) {
      console.warn("MUX_WEBHOOK_SIGNING_SECRET is not set - Mux webhooks rejected");
      return new NextResponse(
        "Webhook not configured: MUX_WEBHOOK_SIGNING_SECRET missing",
        { status: 503 },
      );
    }

    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      return new NextResponse(
        "Webhook not configured: Mux credentials missing",
        { status: 503 },
      );
    }

    const rawBody = await req.text();

    const mux = new Mux({ tokenId, tokenSecret });
    const event = await mux.webhooks.unwrap(rawBody, req.headers, signingSecret);

    if (event?.type === "video.asset.ready") {
      const data = event.data as {
        id?: string;
        playback_ids?: Array<{ id?: string }>;
      };
      const assetId = data?.id;
      const playbackId = data?.playback_ids?.[0]?.id;

      if (assetId && playbackId) {
        await connectToDatabase();

        await MuxData.findOneAndUpdate(
          { assetId },
          { $set: { playbackId } },
          { new: true },
        );
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.log("[MUX_WEBHOOK]", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
