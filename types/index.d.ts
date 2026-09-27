export type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

export type SafeProfile = Omit<Profile, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type GetCourses = {
  userId: string;
  title?: string | "";
  categoryId?: string;
};

export type GetTeacherCourses = {
  userId: string;
  teacherId: string;
};

export interface GetChapterProps {
  courseId: string;
  chapterId: string;
}

export interface SubLink{
  route: string;
  label: string;
}

export interface SidebarLink {
  imgURL: string;
  route: string;
  label: string;
  subLinks?: SubLink[]
}

export interface Job {
  id?: string;
  employer_name?: string;
  employer_logo?: string | undefined;
  employer_website?: string;
  job_employment_type?: string;
  job_title?: string;
  job_description?: string;
  job_apply_link?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
}

export interface Country {
  name: {
    common: string;
  };
}

export interface ParamsProps {
  params: Promise<{ id: string }>;
}

export interface SearchParamsProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export interface URLProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export interface BadgeCounts {
  GOLD: number;
  SILVER: number;
  BRONZE: number;
}

import { BADGE_CRITERIA } from "@/constants";
export type BadgeCriteriaType = keyof typeof BADGE_CRITERIA;
