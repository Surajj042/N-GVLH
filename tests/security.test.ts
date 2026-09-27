import assert from "node:assert/strict";
import { test } from "node:test";

import { isSafeExternalUrl, sanitizeHtml } from "../lib/sanitize";
import { clampPagination, escapeRegExp, safePath } from "../lib/security";

test("sanitizeHtml strips script tags and their contents", () => {
  assert.equal(sanitizeHtml("<script>alert(1)</script><p>ok</p>"), "<p>ok</p>");
});

test("sanitizeHtml strips event handler attributes", () => {
  assert.equal(sanitizeHtml('<p onclick="evil()">x</p>'), "<p>x</p>");
  assert.equal(sanitizeHtml('<img src="x" onerror="alert(1)">'), '<img src="x">');
});

test("sanitizeHtml strips javascript: and data: URLs", () => {
  assert.equal(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), "<a>x</a>");
  assert.equal(
    sanitizeHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">'),
    "<img>",
  );
});

test("sanitizeHtml removes dangerous containers", () => {
  assert.equal(sanitizeHtml('<iframe src="https://evil.test"></iframe>'), "");
  assert.equal(sanitizeHtml("<svg/onload=alert(1)>"), "");
});

test("sanitizeHtml keeps escaped script text inert", () => {
  const out = sanitizeHtml("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  assert.ok(!out.includes("<script"));
});

test("sanitizeHtml preserves safe markup", () => {
  assert.equal(
    sanitizeHtml("<p>hello <strong>world</strong></p>"),
    "<p>hello <strong>world</strong></p>",
  );
});

test("sanitizeHtml forces rel on target=_blank links", () => {
  const out = sanitizeHtml('<a href="https://ok.test" target="_blank">ok</a>');
  assert.ok(out.includes('rel="noopener noreferrer nofollow"'));
});

test("sanitizeHtml handles empty and malformed input", () => {
  assert.equal(sanitizeHtml(""), "");
  assert.equal(sanitizeHtml(null), "");
  assert.equal(sanitizeHtml(undefined), "");
  assert.equal(sanitizeHtml("<p>unclosed <b>bold"), "<p>unclosed <b>bold</b></p>");
});

test("isSafeExternalUrl only allows http, https and mailto", () => {
  assert.equal(isSafeExternalUrl("https://example.com"), true);
  assert.equal(isSafeExternalUrl("http://example.com"), true);
  assert.equal(isSafeExternalUrl("mailto:a@b.com"), true);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
  assert.equal(isSafeExternalUrl("data:text/html,x"), false);
  assert.equal(isSafeExternalUrl("not a url"), false);
  assert.equal(isSafeExternalUrl(""), false);
});

test("escapeRegExp neutralizes regex metacharacters", () => {
  const escaped = escapeRegExp(".*+?^${}()|[]\\");
  assert.doesNotThrow(() => new RegExp(escaped, "i"));
  assert.equal(new RegExp(escaped, "i").test(".*+?^${}()|[]\\"), true);
  assert.equal(new RegExp(escaped, "i").test("anything"), false);
});

test("escapeRegExp handles empty input", () => {
  assert.equal(escapeRegExp(""), "");
});

test("clampPagination defaults and bounds", () => {
  assert.deepEqual(clampPagination({}), { page: 1, pageSize: 10 });
  assert.deepEqual(clampPagination({ page: 5, pageSize: 10 }), {
    page: 5,
    pageSize: 10,
  });
  assert.deepEqual(clampPagination({ page: 1, pageSize: 500 }), {
    page: 1,
    pageSize: 50,
  });
});

test("clampPagination rejects out-of-range and hostile values", () => {
  assert.deepEqual(clampPagination({ page: -3 }), { page: 1, pageSize: 10 });
  assert.deepEqual(clampPagination({ page: 0 }), { page: 1, pageSize: 10 });
  assert.deepEqual(clampPagination({ pageSize: 0 }), { page: 1, pageSize: 10 });
  assert.deepEqual(clampPagination({ pageSize: Number.NaN }), {
    page: 1,
    pageSize: 10,
  });
  assert.deepEqual(clampPagination({ page: 1.5 }), { page: 1, pageSize: 10 });
  assert.deepEqual(clampPagination({ page: Number.NaN }), {
    page: 1,
    pageSize: 10,
  });
  assert.deepEqual(clampPagination({ page: Infinity }), { page: 1, pageSize: 10 });
  assert.deepEqual(clampPagination({ pageSize: Infinity }), {
    page: 1,
    pageSize: 10,
  });
});

test("clampPagination truncates oversized page numbers", () => {
  assert.deepEqual(clampPagination({ page: 10_000_000 }), {
    page: 10_000,
    pageSize: 10,
  });
});

test("safePath keeps internal paths and rejects external targets", () => {
  assert.equal(safePath("/question/abc"), "/question/abc");
  assert.equal(safePath("https://evil.test/steal"), "/");
  assert.equal(safePath("//evil.test/steal"), "/");
  assert.equal(safePath(""), "/");
});
