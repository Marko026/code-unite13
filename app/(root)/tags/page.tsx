import Filters from "@/components/shared/Filter";
import NoResult from "@/components/shared/NoResult";
import Pagination from "@/components/shared/Pagination/page";
import TagCard from "@/components/shared/TagCard";
import LocalSearchBar from "@/components/shared/search/LocalSearchBar";
import { TagFilters } from "@/constants/filters";
import { getAllTags } from "@/lib/actions/tag.actions";
import { SearchParamsProps } from "@/types";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tags | DevOverFlow",
  description:
    "a community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
  icons: {
    icon: "/assets/images/site-logo.svg",
  },
  openGraph: {
    title: "Home | DevOverFlow",
    description:
      "A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world ",
  },
};

const page = async ({ searchParams }: SearchParamsProps) => {
  const allTags = await getAllTags({
    searchQuery: searchParams.q,
    filter: searchParams.filter,
    page: searchParams.page ? +searchParams.page : 1,
  });

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">All Tags</h1>
      <div className="mt-11 flex flex-row justify-between gap-5 max-md:flex-row max-md:flex-wrap sm:items-start  ">
        <LocalSearchBar
          route="/tags"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search for amazing minds..."
          otherClasses=""
        />
        <Filters
          filters={TagFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
          containerClasses=" max-md:block max-md:w-full sm:w-[40%] "
        />
      </div>
      <section className="my-12 flex w-full flex-wrap justify-start gap-5">
        {allTags && allTags.tags?.length > 0 ? (
          allTags.tags.map((tag) => (
            <Link href={`/tags/${tag._id}`} key={tag._id}>
              <TagCard tag={tag} />
            </Link>
          ))
        ) : (
          <NoResult
            link="/ask-Questions"
            title="Tags"
            desc="It looks like there are no tags yet."
            linkTitle="Ask a Question"
          />
        )}
      </section>
      <Pagination
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={allTags.isNext}
      />
    </div>
  );
};

export default page;
