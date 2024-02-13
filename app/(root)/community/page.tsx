import Filters from "@/components/shared/Filter";
import NoResult from "@/components/shared/NoResult";
import UserCard from "@/components/shared/UserCard";
import LocalSearchBar from "@/components/shared/search/LocalSearchBar";
import { UserFilters } from "@/constants/filters";
import { getAllUsers } from "@/lib/actions/user.actions";

const page = async () => {
  const allUsers = await getAllUsers({});

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">All Users</h1>
      <div className="mt-11 flex flex-row justify-between gap-5 max-md:flex-row max-md:flex-wrap sm:items-start  ">
        <LocalSearchBar
          route="/community"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeholder="Search for amazing minds..."
          otherClasses=""
        />
        <Filters
          filters={UserFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
          containerClasses=" max-md:block max-md:w-full sm:w-[40%] "
        />
      </div>
      <section className="mt-11 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
        {allUsers.users.length > 0 ? (
          allUsers.users.map((user) => <UserCard key={user._id} user={user} />)
        ) : (
          <NoResult
            link="/sing-up"
            title="users"
            desc=""
            linkTitle="Join to be the first!"
          />
        )}
      </section>
    </>
  );
};

export default page;