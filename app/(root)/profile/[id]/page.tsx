import AnswerTab from "@/components/AnswerTab";
import QuestionTab from "@/components/QuestionTab";
import ProfileLink from "@/components/shared/ProfileLink";
import Stats from "@/components/shared/Stats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserInfo } from "@/lib/actions/user.actions";
import { getJoinDate } from "@/lib/utils";
import { URLProps } from "@/types";
import { SignedIn, auth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | DevOverFlow",
  description:
    "a community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
  icons: {
    icon: "/assets/images/opengraph-image.png",
  },
  openGraph: {
    title: "Home | DevOverFlow",
    description:
      "A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
  },
};

const Page = async ({ params, searchParams }: URLProps) => {
  const { userId: clerkId } = auth();
  const userInfo = await getUserInfo({ userId: params.id });

  return (
    <>
      <div className="flex  flex-col-reverse items-start justify-between sm:flex-row">
        <div className="flex w-full flex-col items-start gap-4 lg:flex-row">
          <Image
            src={userInfo.user.picture}
            alt="profile-picture"
            width={140}
            height={140}
            className="rounded-full object-cover"
          />

          <div className="mt-3 ">
            <h2 className="h2-bold text-dark100_light900">
              {userInfo.user.name}
            </h2>
            <p className="paragraph-regular text-dark200_light800">
              @{userInfo.user.username}
            </p>

            <div className="mt-5  flex flex-wrap items-center justify-start gap-5">
              {userInfo.user.portfolioWebsite && (
                <ProfileLink
                  imgUrl="/assets/icons/link.svg"
                  href={userInfo.user.portfolioWebsite}
                  title={userInfo.user.portfolioWebsite}
                />
              )}
              {userInfo.user.location && (
                <ProfileLink
                  imgUrl="/assets/icons/location.svg"
                  title={userInfo.user.location}
                />
              )}
              <ProfileLink
                imgUrl="/assets/icons/calendar.svg"
                title={getJoinDate(userInfo.user.joinAt)}
              />

              {userInfo.user.bio && (
                <p className="paragraph-regular text-dark400_light800">
                  {userInfo.user.bio}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end max-sm:mb-5 max-sm:w-full sm:mt-3">
          <SignedIn>
            {clerkId === userInfo.user.clerkId && (
              <Link href="/profile/edit">
                <Button className="paragraph-medium btn-secondary text-dark300_light900 min-h-[46px] min-w-[175px] px-4 py-3">
                  Edit Profile
                </Button>
              </Link>
            )}
          </SignedIn>
        </div>
      </div>

      <Stats
        reputation={userInfo.user.reputation}
        totalQuestions={userInfo.totalQuestions}
        totalAnswers={userInfo.totalAnswers}
        badges={userInfo?.badgeCounts}
      />

      <div className="mt-10 flex gap-10">
        <Tabs className="flex-1">
          <TabsList className="background-light800_dark400 min-h-[42px] p-1">
            <TabsTrigger className="tab" value="top-posts">
              Top Posts
            </TabsTrigger>
            <TabsTrigger className="tab" value="answers">
              Answers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="top-posts">
            <QuestionTab
              userId={userInfo.user._id}
              clerkId={clerkId}
              searchParams={searchParams}
            />
          </TabsContent>
          <TabsContent value="answers">
            <AnswerTab
              userId={userInfo.user._id}
              clerkId={clerkId}
              searchParams={searchParams}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Page;
