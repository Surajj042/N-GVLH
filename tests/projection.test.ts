import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AUTHOR_FIELDS,
  AUTHOR_SELECT,
  PRIVATE_USER_FIELDS,
  PUBLIC_PROFILE_FIELDS,
  PUBLIC_PROFILE_SELECT,
  PUBLIC_USER_FIELDS,
  PUBLIC_USER_SELECT,
} from "../lib/projection";
import { getJoinedDate } from "../lib/utils";

const asSet = (fields: readonly string[]) => new Set(fields);

const assertIncludes = (
  fields: readonly string[],
  required: string[],
  label: string,
) => {
  const set = asSet(fields);
  for (const field of required) {
    assert.ok(set.has(field), `${label} must include "${field}"`);
  }
};

const assertExcludes = (
  fields: readonly string[],
  forbidden: string[],
  label: string,
) => {
  const set = asSet(fields);
  for (const field of forbidden) {
    assert.ok(!set.has(field), `${label} must not include "${field}"`);
  }
};

test("author projection carries clerkId so profile links resolve", () => {
  assertIncludes(
    AUTHOR_FIELDS,
    ["_id", "clerkId", "name", "picture"],
    "AUTHOR_FIELDS",
  );
});

test("public profile projection carries every field the profile page renders", () => {
  assertIncludes(
    PUBLIC_PROFILE_FIELDS,
    [
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
    ],
    "PUBLIC_PROFILE_FIELDS",
  );
});

test("public user projection carries every field list and card consumers read", () => {
  assertIncludes(
    PUBLIC_USER_FIELDS,
    ["_id", "clerkId", "name", "username", "picture", "reputation"],
    "PUBLIC_USER_FIELDS",
  );
});

test("no public projection leaks private user fields", () => {
  for (const [label, fields] of [
    ["AUTHOR_FIELDS", AUTHOR_FIELDS],
    ["PUBLIC_USER_FIELDS", PUBLIC_USER_FIELDS],
    ["PUBLIC_PROFILE_FIELDS", PUBLIC_PROFILE_FIELDS],
  ] as const) {
    assertExcludes(fields, [...PRIVATE_USER_FIELDS], label);
  }
});

test("select strings match their field lists", () => {
  assert.equal(AUTHOR_SELECT, AUTHOR_FIELDS.join(" "));
  assert.equal(PUBLIC_USER_SELECT, PUBLIC_USER_FIELDS.join(" "));
  assert.equal(PUBLIC_PROFILE_SELECT, PUBLIC_PROFILE_FIELDS.join(" "));
});

test("select strings contain no empty or duplicate fields", () => {
  for (const select of [
    AUTHOR_SELECT,
    PUBLIC_USER_SELECT,
    PUBLIC_PROFILE_SELECT,
  ]) {
    const parts = select.split(" ");
    assert.ok(parts.every((p) => p.length > 0), "no empty fields");
    assert.equal(new Set(parts).size, parts.length, "no duplicate fields");
  }
});

test("getJoinedDate formats a valid Date", () => {
  const out = getJoinedDate(new Date("2023-09-15T00:00:00.000Z"));
  assert.match(out, /^\S+ \d{4}$/);
  assert.ok(out.includes("2023"));
});

test("getJoinedDate accepts an ISO string", () => {
  const out = getJoinedDate("2023-09-15T00:00:00.000Z");
  assert.ok(out.includes("2023"));
});

test("getJoinedDate returns empty string instead of throwing on bad input", () => {
  assert.equal(getJoinedDate(undefined), "");
  assert.equal(getJoinedDate(null), "");
  assert.equal(getJoinedDate(""), "");
  assert.equal(getJoinedDate("not-a-date"), "");
});
