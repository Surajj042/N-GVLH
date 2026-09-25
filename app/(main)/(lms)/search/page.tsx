import { CoursesList } from "@/components/courses-list";
import { SearchInput } from "@/components/search-input";
import Category from "@/database/category.modal";
import { getCourses } from "@/lib/actions/course.action";
import { connectToDatabase } from "@/lib/mongoose";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Categories } from "./_components/categories";

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
  title: "N-GVLH | All Courses",
  description: "Next-Gen Virtual Learning Hub",
  icons: {
    icon: "/icons/favicon.svg",
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    title: string;
    categoryId: string;
  }>;
}

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/get-started");
  }

  const { title, categoryId } = await searchParams;

  await connectToDatabase();
  // Use lean() to return plain objects for serialization (consistent with course.action lean() pattern)
  const categories = await Category.find().sort({ name: 1 }).lean();

  const courses = await getCourses({
    userId,
    title,
    categoryId,
  });

  return (
    <>
      <div className="block px-6 pt-6 md:mb-0 md:hidden">
        <Suspense fallback={null}>
          <SearchInput />
        </Suspense>
      </div>
      <div className="space-y-4 p-6">
        <Suspense fallback={null}>
          <Categories items={categories} />
        </Suspense>
        <CoursesList items={courses} />
      </div>
    </>
  );
};

export default SearchPage;
