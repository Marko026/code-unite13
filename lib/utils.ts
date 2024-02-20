import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from "query-string";
import { BadgeCounts } from "@/types";
import { BADGE_CRITERIA } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const getTimestamp = (createdAt: Date): string => {
  const now = new Date();
  const timeDifference = now.getTime() - createdAt.getTime();

  // Define time units in milliseconds

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30.44 * day; // Approximate average number of days in a month
  const year = 365.25 * day; // Approximate average number of days in a year

  if (timeDifference < second) {
    return `just now`;
  } else if (timeDifference < minute) {
    const seconds = Math.floor(timeDifference / second);
    return `${seconds} sec${seconds > 1 ? "" : ""} ago`;
  } else if (timeDifference < hour) {
    const minutes = Math.floor(timeDifference / minute);
    return `${minutes} min${minutes > 1 ? "" : ""} ago`;
  } else if (timeDifference < day) {
    const hours = Math.floor(timeDifference / hour);
    return `${hours} hour${hours > 1 ? "" : ""} ago`;
  } else if (timeDifference < week) {
    const days = Math.floor(timeDifference / day);
    return `${days} day${days > 1 ? "" : ""} ago`;
  } else if (timeDifference < month) {
    const weeks = Math.floor(timeDifference / week);
    return `${weeks} week${weeks > 1 ? "" : ""} ago`;
  } else if (timeDifference < year) {
    const months = Math.floor(timeDifference / month);
    return `${months} month${months > 1 ? "" : ""} ago`;
  } else {
    const years = Math.floor(timeDifference / year);
    return `${years} year${years > 1 ? "" : ""} ago`;
  }
};

export const formatNumberWithExtension = (number: number) => {
  if (number === null || number === undefined) return "";

  if (number >= 1e6) return `${(number / 1e6).toFixed(0)}M`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(0)}K`;
  return number.toString();
};

export const getJoinDate = (date: Date): string => {
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

export const formUrlQuery = ({ params, key, value }: UrlQueryParams) => {
  const currentUrl = qs.parse(params);
  currentUrl[key] = value;
  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    {
      skipNull: true,
    },
  );
};
type RemoveKeysFromQuery = {
  params: string;
  keysTorRemove: string[];
};
export const removeKeysFromQuery = ({
  params,
  keysTorRemove,
}: RemoveKeysFromQuery) => {
  const currentUrl = qs.parse(params);
  keysTorRemove.forEach((key) => {
    delete currentUrl[key];
  });
  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },

    {
      skipNull: true,
      skipEmptyString: true,
    },
  );
};

interface BadgeParam {
  criteria: {
    type: keyof typeof BADGE_CRITERIA;
    count: number;
  }[];
}

export const assignBadges = (params: BadgeParam) => {
  const badges: BadgeCounts = {
    GOLD: 0,
    SILVER: 0,
    BRONZE: 0,
  };

  params.criteria.forEach((criterion) => {
    const { type, count } = criterion;
    const badge = BADGE_CRITERIA[type];
    if (count >= badge.GOLD) {
      badges.GOLD += 1;
    } else if (count >= badge.SILVER) {
      badges.SILVER += 1;
    } else if (count >= badge.BRONZE) {
      badges.BRONZE += 1;
    }
  });
  return badges;
};
