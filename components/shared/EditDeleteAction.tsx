"use client";

import React from "react";
import Image from "next/image";
import { deleteQuestion } from "@/lib/actions/question.action";
import { usePathname, useRouter } from "next/navigation";
import { deleteAnswer } from "@/lib/actions/answer.action";
import toast from "react-hot-toast";

interface Props {
  type: string;
  itemId: string;
}

const EditDeleteAction = ({ type, itemId }: Props) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/question/edit/${itemId}`);
  };

  const handleDelete = async () => {
    try {
      if (type === "Question") {
        // Delete Question
        await deleteQuestion({
          questionId: itemId,
          path: pathname,
        });
      } else if (type === "Answer") {
        // Delete Answer
        await deleteAnswer({ answerId: itemId, path: pathname });
      }
      toast.success(
        `${type === "Question" ? "Question" : "Answer"} deleted successfully`,
      );
    } catch (error) {
      toast.error(
        `${type === "Question" ? "Question" : "Answer"} deletion failed`,
      );
    }
  };

  return (
    <div className="flex items-center justify-end gap-3 max-sm:w-full">
      {type === "Question" && (
        <Image
          src="/qna/edit.svg"
          alt="edit"
          width={20}
          height={20}
          className="cursor-pointer object-contain"
          onClick={handleEdit}
        />
      )}

      <Image
        src="/qna/trash.svg"
        alt="delete"
        width={20}
        height={20}
        className="cursor-pointer object-contain"
        onClick={handleDelete}
      />
    </div>
  );
};

export default EditDeleteAction;
