import Profile from "@/components/forms/Profile";
import { getMyProfile } from "@/lib/actions/user.action";
import { ParamsProps } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
  title: "Edit Profile | N-GVLH",
  description: "Change Your Profile Info",
};

const EditProfile = async ({ params }: ParamsProps) => {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const mongoUser = await getMyProfile();

  if (!mongoUser) redirect("/get-started");

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Edit Profile</h1>

      <div className="mt-9">
        <Profile clerkId={userId} user={JSON.stringify(mongoUser)} />
      </div>
    </>
  );
};

export default EditProfile;
