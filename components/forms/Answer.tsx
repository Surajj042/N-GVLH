"use client";

import { useTheme } from "@/components/theme-provider";
import { AnswerSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@tinymce/tinymce-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";

import { createAnswer } from "@/lib/actions/answer.action";
import { marked } from "marked";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

interface Props {
  question: string;
  questionId: string;
}

const Answer = ({ question, questionId }: Props) => {
  // Answer Component
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAI, setIsSubmittingAI] = useState(false);
  const { mode } = useTheme();
  const editorRef = useRef(null);
  const form = useForm<z.infer<typeof AnswerSchema>>({
    resolver: zodResolver(AnswerSchema),
    defaultValues: {
      answer: "",
    },
  });

  const handleCreateAnswer = async (values: z.infer<typeof AnswerSchema>) => {
    setIsSubmitting(true);

    try {
      await createAnswer({
        content: values.answer,
        question: questionId,
        path: pathname,
      });

      form.reset();

      if (editorRef.current) {
        const editor = editorRef.current as any;

        editor.setContent("");

        return toast({
          title: "Your answer has been submitted",
        });
      }
    } catch (error) {
      return toast({
        title: "Error Submitting.",
        description: "Refresh the page and try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIAnswer = async () => {
    setIsSubmittingAI(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const aiAnswer = await response.json();

      const formattedAnswer = aiAnswer.text;

      if (editorRef.current) {
        const editor = editorRef.current as any;

        editor.setContent(marked.parse(formattedAnswer ?? ""));
      }
      return toast({
        title: "Answer Generated Successfully",
      });
    } catch (error) {
      return toast({
        title: "Generation Failed",
        description: "Refresh the page and try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAI(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
        <h4 className="paragraph-semibold text-dark400_light800">
          Write your answer here
        </h4>
        <div className="rounded-md shadow-lg transition-transform duration-300 ease-in-out hover:rotate-1 hover:scale-105 dark:bg-dark-400">
          <Button
            className="btn light-border-2 transform gap-1.5 bg-purple2blue bg-clip-text px-4 py-2.5 text-transparent dark:bg-purple2red"
            onClick={generateAIAnswer}
          >
            {isSubmittingAI ? (
              <>Generating...</>
            ) : (
              <>
                <Image
                  src="/qna/stars.svg"
                  alt="star"
                  width={12}
                  height={12}
                  className="object-contain"
                />
                Generate an AI Answer
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form
          className="mt-6 flex w-full flex-col gap-10"
          onSubmit={form.handleSubmit(handleCreateAnswer)}
        >
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-3">
                <FormControl className="mt-3.5">
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                    onInit={(evt, editor) => {
                      // @ts-ignore
                      editorRef.current = editor;
                    }}
                    onBlur={field.onBlur}
                    onEditorChange={(content) => field.onChange(content)}
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
                      content_css: mode,
                    }}
                  />
                </FormControl>
                <FormMessage className="text-slate-500" />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              className="primary-gradient w-fit text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Answer;
