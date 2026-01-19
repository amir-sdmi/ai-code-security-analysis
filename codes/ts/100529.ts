import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
}

// created by chatgpt
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


export const excerpt = (str :string, count:number) => {
  if (str.length > count) {
    str = str.substring(0, count) + "....";
  }
  return str;
};

export const mapArrayToSixWithFourMore = (array: any[]): any[] => {
  const firstSixComponents = array.slice(0, 6);
  const remainingComponents = array.slice(6);
  return [...firstSixComponents, `+${remainingComponents.length} more`];
};