import { BADGE_CRITERIA } from "@/constants";
import { BadgeCounts } from "@/types";
import { type ClassValue, clsx } from "clsx";
import qs from "query-string";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCreatedTimeStamp = (createdAt: Date): string => {
  const now = new Date();
  const diff = Math.abs(now.getTime() - createdAt.getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return years === 1 ? "1 year ago" : `${years} years ago`;
  } else if (months > 0) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else if (weeks > 0) {
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else if (days > 0) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else {
    return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  }
};

export const formatNumber = (number: number): string => {
  if (Math.abs(number) >= 1.0e9) {
    return (number / 1.0e9).toFixed(1) + "B";
  }
  if (Math.abs(number) >= 1.0e6) {
    return (number / 1.0e6).toFixed(1) + "M";
  }
  if (Math.abs(number) >= 1.0e3) {
    return (number / 1.0e3).toFixed(1) + "K";
  }
  return number.toString();
};

//using Chatgpt:  get the javascript date object as a parameter and return a joined date(just a month and year)

export const getJoinedDate = (date: Date): string => {
  // Extract month and year from the date object
  const month = date.toLocaleString("default", { month: "long" }); // Get full month name
  const year = date.getFullYear(); // Get the year

  // Concatenate month and year
  const joinedDate = `${month} ${year}`;

  return joinedDate;
};

interface UrlQueryParams {
  params: string;
  key: string;
  value: string | null;
}

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
    }
  );
};

interface RemoveUrlQueryParams {
  params: string;
  keysToRemove: string[];
}

export const removeKeysFromQuery = ({
  params,
  keysToRemove,
}: RemoveUrlQueryParams) => {
  const currentUrl = qs.parse(params);

  keysToRemove.forEach((key) => {
    delete currentUrl[key];
  });

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    {
      skipNull: true,
    }
  );
};

/**
 * Processes a job title to ensure it is valid and meaningful.
 * If the input title is undefined or null, it returns 'No Job Title'.
 * It splits the title into words, filters out unwanted words
 * (undefined, null, 'undefined', 'null'),
 * and joins the valid words to create the processed title.
 *
 * @param title - The job title to be processed.
 * @returns A processed job title or 'No Job Title' if the input is undefined, null, or contains no valid words.
 */

interface BadgeParam {
  criteria: {
    type: keyof typeof BADGE_CRITERIA;
    count: number;
  }[];
}

export const assignBadges = (params: BadgeParam) => {
  const badgeCounts: BadgeCounts = {
    GOLD: 0,
    SILVER: 0,
    BRONZE: 0,
  };

  const { criteria } = params;

  criteria.forEach((item) => {
    const { type, count } = item;
    const badgeLevels: any = BADGE_CRITERIA[type];

    Object.keys(badgeLevels).forEach((level: any) => {
      if (count >= badgeLevels[level]) {
        badgeCounts[level as keyof BadgeCounts] += 1;
      }
    });
  });
  return badgeCounts;
};
