
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isBase64Image(imageData: string) {
  const base64Regex = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  return base64Regex.test(imageData);
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

export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    // This is a native JavaScript error (e.g., TypeError, RangeError)
    console.error(error.message);
    throw new Error(`Error: ${error.message}`);
  } else if (typeof error === "string") {
    // This is a string error message
    console.error(error);
    throw new Error(`Error: ${error}`);
  } else {
    // This is an unknown type of error
    console.error(error);
    throw new Error(`Unknown error: ${JSON.stringify(error)}`);
  }
};




type KnownFileType = 'image' | 'video' | 'audio' | 'document' | 'unknown';

export function getFileTypeFromUrl(url: string): KnownFileType {
  // Step 1: Extract the file name from the URL
  const urlWithoutQuery = url.split('?')[0];
  const fileExtension = urlWithoutQuery.split('.').pop()?.toLowerCase();

  // Step 2: Define known file types and their extensions
  const knownFileTypes: Record<KnownFileType, string[]> = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg'],
    'video': ['mp4', 'mov', 'wmv', 'flv', 'avi', 'mkv'],
    'audio': ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
    'document': ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    'unknown': []
  };

  // Step 3: Match the file extension against known types
  if (fileExtension) {
    for (const [type, extensions] of Object.entries(knownFileTypes)) {
      if (extensions.includes(fileExtension)) {
        return type as KnownFileType;
      }
    }
  }

  return 'unknown';
}