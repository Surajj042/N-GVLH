"use client";

import dynamic from "next/dynamic";

const AnnouncementForm = dynamic(
  () => import("@/app/(main)/(qna)/announcement/_components/AnnouncementForm"),
  {
    ssr: false,
  },
);

const NewAnnouncement = () => {
  return <AnnouncementForm />;
};

export default NewAnnouncement;
