import Link from "next/link";
import { Badge } from "@/components/ui/badge";
interface Props {
  name: string;
  _id: number;
  totalQuestions?: number;
  showCount?: boolean;
}

const RenderTag = ({ name, _id, totalQuestions, showCount }: Props) => {
  return (
    <Link
      key={_id}
      href={`/tags/${_id}`}
      className="flex justify-between text-[10px] uppercase"
    >
      <Badge className="subtle-medium text-light400_light500 background-light800_dark300 block rounded-md border-none !bg-light-800 px-4 py-2 shadow-lg">
        {name}
      </Badge>
      {showCount && <p className="text-[12px]">{totalQuestions}</p>}
    </Link>
  );
};

export default RenderTag;
