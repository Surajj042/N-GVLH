"use client";

import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import { useTheme } from "./theme-provider";

// NOTE: TinyMCE init config is duplicated in components/forms/Question.tsx.
// Both use the same skin/content_css fix (oxide-dark/dark vs oxide/default) to avoid hydration mismatches.
// Keep them in sync or extract to a shared config (e.g., lib/tinymce-config.ts) if drift occurs.

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const Editor = ({ onChange, value }: EditorProps) => {
  const { mode } = useTheme();

  return (
    <div>
      <TinyMCEEditor
        apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
        value={value}
        onEditorChange={onChange}
        init={{
          height: 350,
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "codesample",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
          ],
          toolbar:
            "undo redo | " +
            "codesample | bold italic forecolor | alignleft aligncenter |" +
            "alignright alignjustify | bullist numlist",
          content_style:
            "body {font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont; font-size:16px}",
          skin: mode === "dark" ? "oxide-dark" : "oxide",
          content_css: mode === "dark" ? "dark" : "default",
        }}
      />
    </div>
  );
};
