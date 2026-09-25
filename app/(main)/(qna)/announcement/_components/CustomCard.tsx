import { Card } from "@/components/ui/card";
import { getTimestamp } from "@/lib/utils";
import Image from "next/image";
import Markdown from "./Markdown";

interface AnnouncementCardProps {
  teacherUsername: string;
  teacherName: string;
  title: string;
  description: string;
  imageLink: string;
  createdAt: Date;
}

export default function Component({
  teacherUsername,
  teacherName,
  description,
  title,
  imageLink,
  createdAt,
}: AnnouncementCardProps) {
  return (
    <Card className="w-full overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-800">
      <div className="md:flex">
        <div className="w-full p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                alt="Profile picture"
                className="rounded-full"
                height="40"
                src={imageLink}
                width="40"
              />
              <div className="ml-4">
                <div className="text-sm font-semibold uppercase tracking-wide text-black dark:text-white">
                  {teacherName}
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-300">
                  @{teacherUsername}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-gray-500 dark:text-gray-300">
            <div className="text-xl">{title}</div>
            <Markdown description={description} />
          </div>
          <div className="mt-6 flex items-center justify-end">
            <div className="text-gray-400 dark:text-gray-300">
              {getTimestamp(createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
