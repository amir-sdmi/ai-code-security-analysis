export function getMaximumStorageAmount(): number {
  return 5000; // KB
}

export function getUsedStorageAmount(): number {
  if (typeof window !== "undefined" && window.localStorage) {
    return JSON.stringify(localStorage).length / 1024; // KB
  }
  return 0;

  // Suggested by ChatGPT
  // const storage = JSON.stringify(localStorage);
  // return new Blob([storage]).size;
}
