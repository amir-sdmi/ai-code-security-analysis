import { type ClassValue, clsx } from "clsx"
import { differenceInDays } from "date-fns";
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// created by chatgpt
export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
}

// created by chatgpt
export function formatDateString(dateString: Date) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString(undefined, options);

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${time} - ${formattedDate}`;
}

export const getNumberOfDays = (startDate:Date, endDate:Date) => {
  const days = differenceInDays(new Date(endDate), new Date(startDate));
  return days + 1;
};

// Validate email format
export const isValidEmail = (email:string) => {
  // Use a regular expression or any library of your choice for email validation
  // Example regex for basic email validation:
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateFiveDigitOTP = () => {
  const otp = Math.floor(10000 + Math.random() * 90000);
  return otp.toString();
};

export const getInitials = (name: string | undefined): string => {
  if (!name || name.trim() === '') {
    // If name is not provided or empty, return a default value
    return 'NA';
  }

  // Split the name into words
  const words = name.split(' ');

  // Map each word to its first character (initial) and capitalize it
  const initials = words.map((word) => word.charAt(0).toUpperCase());

  // Return the concatenated initials
  return initials.join('');
};

