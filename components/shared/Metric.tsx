import Image from "next/image";
import Link from "next/link";
import React from "react";

interface MetricProps {
  imgUrl: string;
  alt: string;
  value: number | string;
  title: string;
  textStyles?: string;
  href?: string;
  isAuthor?: boolean;
}

const Metric = ({
  imgUrl,
  alt,
  value,
  title,
  textStyles,
  href,
  isAuthor,
}: MetricProps) => {
  const metricContent = (
    <>
      <div className="flex items-center">
        <Image
          src={imgUrl}
          alt={alt}
          className={`mr-1 object-contain ${href ? "rounded-full" : ""} `}
          width={20}
          height={16}
        />
        <p className={`${textStyles} flex items-center gap-1`}>
          {value}
          <span
            className={`small-regular line-clamp-1 ${
              isAuthor ? "max-sm:hidden" : ""
            }`}
          >
            {title}
          </span>
        </p>
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="flex-center gap-1">
        {metricContent}
      </Link>
    );
  }

  return <div className="flex-center flex-wrap gap-1">{metricContent}</div>;
};

export default Metric;
