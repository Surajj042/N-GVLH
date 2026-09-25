"use client";

interface PreviewProps {
  value: string;
}

function sanitizeHtml(html: string): string {
  if (!html) return "";
  // Basic XSS protection: strip script/iframe, event handlers and javascript: URLs
  // For full coverage consider DOMPurify or rehype-sanitize; this is a minimal safeguard
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");
}

export const Preview = ({ value }: PreviewProps) => {
  const sanitized = sanitizeHtml(value);
  return (
    <div
      className="bg-white dark:bg-slate-800 prose prose-sm max-w-none dark:prose-invert p-4"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
