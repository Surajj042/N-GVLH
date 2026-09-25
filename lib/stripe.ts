import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_API_KEY is not set. Add it to your .env.local file.",
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(apiKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
