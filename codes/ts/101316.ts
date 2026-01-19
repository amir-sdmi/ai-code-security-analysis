import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

  return `${time} - ${formattedDate}`;
}
export function parseLocalStorageItem(itemName: string) {
  let item;
  if (typeof window !== "undefined") {
    // Perform localStorage action
    const what = localStorage.getItem(itemName);
    item = what;
  }
  // const item = localStorage.getItem(itemName);

  // Check if the item exists
  if (item === null) {
    return null; // Item not found
  }

  try {
    // Parse the item's content
    const parsedItem = JSON.parse(item!);
    return parsedItem;
  } catch (error) {
    console.error("Error parsing local Storage item:", error);
    return null; // Parsing error
  }
}
export function getFormattedDate() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1; // Months are zero-based
  const year = currentDate.getFullYear();

  // Ensure single-digit day and month have a leading zero
  const formattedDay = day < 10 ? `0${day}` : day;
  const formattedMonth = month < 10 ? `0${month}` : month;

  const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
  return formattedDate;
}
export function add500DaysToDate(inputDateStr: any) {
  // Parse the input date string into a Date object
  const dateParts = inputDateStr.split("/");
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Subtract 1 as months are zero-based
  const year = parseInt(dateParts[2], 10);
  const inputDate = new Date(year, month, day);

  // Calculate the result date by adding 500 days to the input date
  const resultDate = new Date(inputDate);
  resultDate.setDate(resultDate.getDate() + 500);

  // Calculate the difference in terms of months, weeks, and days
  const currentDate = new Date();
  const timeDifference = resultDate - currentDate;
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const daysDifference = Math.floor(timeDifference / millisecondsInDay);

  const months = Math.floor(daysDifference / 30);
  const weeks = Math.floor((daysDifference % 30) / 7);
  const remainingDays = daysDifference % 7;

  // Return the result as an object
  return {
    day: remainingDays,
    month: months,
    week: weeks,
  };
}
export function calculateUnits(payload: any) {
  if (!Array.isArray(payload)) {
    throw new Error("Payload is not an array");
  }

  const totalAmount = payload.reduce((total, investment) => {
    if (investment.amount && typeof investment.amount === "number") {
      return total + investment.amount;
    }
    return total;
  }, 0);

  const units = totalAmount / 50000;

  return units;
}
