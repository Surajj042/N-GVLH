import { CoursesList } from "@/components/courses-list";
import AnswerTab from "@/components/shared/AnswerTab";
import NoResult from "@/components/shared/NoResult";
import ProfileLink from "@/components/shared/ProfileLink";
import QuestionTab from "@/components/shared/QuestionTab";
import Stats from "@/components/shared/Stats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeacherCourses } from "@/lib/actions/course.action";
import {
  getTeacherAnnouncements,
  isFollowing,
} from "@/lib/actions/forum.action";
import { getUserInfo, isProfileTeacher } from "@/lib/actions/user.action";
import { getJoinedDate } from "@/lib/utils";
import { URLProps } from "@/types";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import Component from "../../announcement/_components/CustomCard";
import FollowButton from "./_components/FollowButton";

const Profile = async ({ params, searchParams }: URLProps) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const userInfo = await getUserInfo({ userId: id });
  if (!userInfo) {
    return (
      <NoResult
        title="User Not Found"
        description="This user doesn't exist or has deleted the account"
        linkTitle="Search Other Users"
        link="/community"
      />
    );
  }
  const { userId: clerkId } = await auth();
  const teacher = await isProfileTeacher({ userId: id });

  let following, teacherAllCourses, teacherAnnouncements;

  if (teacher) {
    following = clerkId
      ? await isFollowing({
          teacherId: id,
          studentId: clerkId,
        })
      : false;

    teacherAllCourses = clerkId
      ? await getTeacherCourses({
          teacherId: id,
          userId: clerkId,
        })
      : [];
    teacherAnnouncements = await getTeacherAnnouncements({
      teacherClerkId: id,
    });
  }

  return (
    <>
      <div className="flex flex-col-reverse items-start justify-between sm:flex-row">
        <div className="flex flex-col items-start gap-4 lg:flex-row">
          <Image
            src={userInfo?.user.picture}
            alt="profile-picture"
            width={140}
            height={140}
            className="rounded-full object-cover"
          />

          <div className="mt-3">
            <h2 className="h2-bold text-dark100_light900">
              {userInfo.user.name}
            </h2>
            <p className="paragraph-regular text-dark200_light800">
              @{userInfo.user.username}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-start gap-5">
              {userInfo.user.location && (
                <ProfileLink
                  imgUrl="/qna/location.svg"
                  title={userInfo.user.location}
                />
              )}

              {userInfo.user.portfolioWebsite && (
                <ProfileLink
                  imgUrl="/qna/link.svg"
                  href={userInfo.user.portfolioWebsite}
                  title="Portfolio"
                />
              )}

              <ProfileLink
                imgUrl="/qna/calendar.svg"
                title={`Joined ${getJoinedDate(userInfo.user.joinedAt)}`}
              />
            </div>

            {userInfo.user.bio && (
              <p className="paragraph-regular text-dark400_light800 mt-8">
                {userInfo.user.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 max-sm:mb-5 max-sm:w-full sm:mt-3">
          {clerkId && clerkId === userInfo.user.clerkId && (
            <Link href="/profile/edit">
              <Button className="paragraph-medium btn-secondary text-dark300_light900 min-h-[46px] min-w-[175px] px-4 py-3">
                Edit Profile
              </Button>
            </Link>
          )}
          {teacher && (
            <FollowButton
              studentId={clerkId ?? ""}
              teacherClerkId={userInfo.user.clerkId}
              following={following!}
            />
          )}
        </div>
      </div>

      {/* Badges  */}

      <Stats
        totalQuestions={userInfo.totalQuestions}
        totalAnswers={userInfo.totalAnswers}
        badges={userInfo.badgeCounts}
        reputation={userInfo.reputation}
      />
      <Tabs defaultValue="top-posts" className="mt-10">
        <div className="w-full bg-transparent text-center">
          <TabsList className="sm:background-light800_dark400 min-h-[42px] max-w-min bg-transparent p-1 max-sm:flex-col max-sm:gap-3">
            <TabsTrigger value="top-posts" className="tab">
              Top Posts
            </TabsTrigger>
            <TabsTrigger value="answers" className="tab">
              Answers
            </TabsTrigger>
            {teacher && (
              <TabsTrigger value="courses" className="tab">
                Courses
              </TabsTrigger>
            )}
            {teacher && (
              <TabsTrigger value="announcements" className="tab">
                Announcements
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        <TabsContent
          value="top-posts"
          className="tab-content mt-5 flex w-full flex-col gap-6 max-sm:pt-16"
        >
          <QuestionTab
            searchParams={resolvedSearchParams}
            userId={userInfo.user._id}
            clerkId={clerkId!}
          />
        </TabsContent>
        <TabsContent
          value="answers"
          className="tab-content mt-1 flex w-full flex-col gap-6"
        >
          <AnswerTab
            searchParams={resolvedSearchParams}
            userId={userInfo.user._id}
            clerkId={clerkId!}
          />
        </TabsContent>
        {teacher && (
          <TabsContent
            value="courses"
            className="tab-content flex w-full flex-col gap-6"
          >
            <CoursesList items={(teacherAllCourses as any) ?? []} small />
          </TabsContent>
        )}
        {teacher && (
          <TabsContent
            value="announcements"
            className="tab-content flex w-full flex-col gap-2"
          >
            {teacherAnnouncements!.length === 0 ? (
              <></>
            ) : (
              teacherAnnouncements!.map((announcement, index) => (
                <Component
                  key={index}
                  teacherName={announcement.teacherName!}
                  teacherUsername={announcement.teacherUsername!}
                  description={announcement.description}
                  title={announcement.title}
                  imageLink={announcement.teacherPicture!}
                  createdAt={announcement.createdAt!}
                />
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </>
  );
};

export async function generateMetadata({ params }: URLProps) {
  const { id } = await params;
  const userInfo = await getUserInfo({ userId: id });

  if (!userInfo) return;

  return {
    title: `${userInfo.user.name} | N-GVLH`,
    description: "Profile of " + userInfo.user.name,
  };
}

export default Profile;
