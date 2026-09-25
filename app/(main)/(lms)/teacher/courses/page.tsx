import Course from "@/database/course.modal";
import { connectToDatabase } from "@/lib/mongoose";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

export const metadata: Metadata = {
  authors: [
    {
      name: "CMRegmi | Github",
      url: "https://github.com/LowkeyGud",
    },
    {
      name: "CMRegmi | Wakatime",
      url: "https://wakatime.com/@lowkeygud",
    },
  ],
  title: "N-GVLH | My Courses",
  description: "Next-Gen Virtual Learning Hub",
  icons: {
    icon: "/icons/favicon.svg",
  },
};

const CoursesPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/not-found");
  }

  await connectToDatabase();
  const courses = await Course.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-6">
      <DataTable columns={columns} data={courses} />
    </div>
  );
};

export default CoursesPage;
