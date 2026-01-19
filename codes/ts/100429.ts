import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// created by chatgpt
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

  return format(new Date(dateString), "hh:mm a - MMM dd, yyyy")
}

// created by chatgpt
export function formatThreadCount(count: number): string {
  if (count === 0) {
    return "No Nodes";
  } else {
    const threadCount = count.toString().padStart(2, "0");
    const threadWord = count === 1 ? "Node" : "Nodes";
    return `${threadCount} ${threadWord}`;
  }
}