import { Badge } from "../ui/badge";

const TagCard = async ({ tag }) => {
  return (
    <article className="background-light900_dark200 light-border flex flex-col  items-start justify-center rounded-2xl border p-8 sm:w-[240px]">
      <div className="mt-4 text-center">
        <Badge className="h3-bold text-dark300_light900 background-light800_dark300 block rounded-md border-none !bg-light-800 px-4 py-1 text-lg shadow-lg">
          {tag.name}
        </Badge>
      </div>
      <p className="text-dark500_light700 small-regular mt-4">
        JavaScript, often abbreviated as JS, is a programming language that is
        one of the core technologies of the World Wide Web, alongside HTML and
        CSS
      </p>
      <div className="mt-4 flex items-center gap-2 ">
        <p className="text-[14px] text-primary-500">
          {tag.questions.length}
          <span className="ml-1">+</span>
        </p>
        <p className="text-dark500_light500 text-[12px]">Questions</p>
      </div>
    </article>
  );
};

export default TagCard;
