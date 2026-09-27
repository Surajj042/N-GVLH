import { sanitizeHtml } from "@/lib/sanitize";

interface PreviewProps {
  value: string;
}

export const Preview = ({ value }: PreviewProps) => {
  return (
    <div
      className="bg-white dark:bg-slate-800 prose prose-sm max-w-none dark:prose-invert p-4"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  );
};
