import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeFirstLast(str: string) {
  return str.slice(1, -1);
}

// created by chatgpt
export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
}

export function generateMeetingCode(): string {
  const code = Math.floor(100000000 + Math.random() * 900000000);
  return code.toString().trim();
}
