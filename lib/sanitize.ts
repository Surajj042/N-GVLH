import { fromParse5 } from "hast-util-from-parse5";
import { sanitize } from "hast-util-sanitize";
import { toHtml } from "hast-util-to-html";
import { parseFragment } from "parse5";

const SCHEMA = {
  tagNames: [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "del",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
  ],
  attributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["className"],
    span: ["className"],
    pre: ["className"],
    td: ["align", "colSpan", "rowSpan"],
    th: ["align", "colSpan", "rowSpan"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

const SAFE_URL_PROTOCOLS = ["http:", "https:", "mailto:"];

const enforceLinkRel = (html: string) =>
  html.replace(
    /<a\b([^>]*?)target="_blank"([^>]*)>/gi,
    '<a$1target="_blank"$2 rel="noopener noreferrer nofollow">',
  );

export const sanitizeHtml = (value?: string | null): string => {
  if (!value) return "";

  try {
    const fragment = parseFragment(value);
    const tree = fromParse5(fragment);
    const clean = sanitize(tree as never, SCHEMA);
    const html = toHtml(clean as never);

    return enforceLinkRel(html);
  } catch {
    return "";
  }
};

export const isSafeExternalUrl = (value?: string | null): boolean => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return SAFE_URL_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
};
