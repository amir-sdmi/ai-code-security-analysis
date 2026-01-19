import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import locale from "date-fns/locale/en-US";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
}

// Customize the locale to remove "about"
const formatDistanceLocale = {
  lessThanXSeconds: "just now",
  xSeconds: "just now",
  halfAMinute: "just now",
  lessThanXMinutes: "{{count}}m",
  xMinutes: "{{count}}m",
  aboutXHours: "{{count}}h",
  xHours: "{{count}}h",
  xDays: "{{count}}d",
  aboutXWeeks: "{{count}}w",
  xWeeks: "{{count}}w",
  aboutXMonths: "{{count}}m",
  xMonths: "{{count}}m",
  aboutXYears: "{{count}}y",
  xYears: "{{count}}y",
  overXYears: "{{count}}y",
  almostXYears: "{{count}}y",
};

function formatDistance(token: string, count: number, options?: any): string {
  options = options || {};

  const result = formatDistanceLocale[
    token as keyof typeof formatDistanceLocale
  ].replace("{{count}}", count.toString());

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return "in " + result;
    } else {
      if (result === "just now") return result;
      return result + " ago";
    }
  }

  return result;
}

export function formatTimeToNow(date: Date): string {
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: {
      ...locale,
      formatDistance,
    },
  });
}

export function formatDateString(dateString: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(undefined, options);

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${time} - ${formattedDate}`;
}

// created by chatgpt
export function formatThreadCount(count: number): string {
  if (count === 0) {
    return "No Threads";
  } else {
    const threadCount = count.toString().padStart(2, "0");
    const threadWord = count === 1 ? "Thread" : "Threads";
    return `${threadCount} ${threadWord}`;
  }
}

export const nFormatter = (num: number, digits: number) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
};

export const metaTagsGenerator = ({
  title,
  description,
  img,
  url,
}: {
  title?: string;
  description?: string;
  img?: string;
  url?: string;
}) => {
  const metaObject = {
    metadataBase: process.env.NEXT_PUBLIC_PRODUCTION_URL,
    title: title || "Threads | Meta's new app clone",
    description:
      description ||
      "Threads | Meta's new app clone created using Next.js 13 Server , TypeScript, Tailwind CSS, and Prisma.",

    openGraph: {
      type: "website",
      locale: "en_US",
      url:
        `${process.env.NEXT_PUBLIC_PRODUCTION_URL}${url}` ||
        process.env.NEXT_PUBLIC_PRODUCTION_URL,
      title: title || "",
      description:
        description ||
        "Threads | Meta's new app clone created using Next.js 13 Server , TypeScript, Tailwind CSS, and Prisma. ",
      images: [
        {
          url: img || "https://i.imgur.com/iwZOWHI.png",
          width: 800,
          height: 450,
        },
        {
          url: img || "https://i.imgur.com/iwZOWHI.png",
          width: 800,
          height: 450,
        },
      ],
      siteName: "Threads | Meta's new app clone",
    },
  };

  return metaObject;
};
