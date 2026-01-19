export const timeChanger = (od: Date): string => {
  let hours: number = od.getHours();
  let minutes: string | number = od.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  const strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
};

export const dateTimeChanger = (od: Date): string => {
  let day: number = od.getDate();
  let month: number = od.getMonth();
  let year: number = od.getFullYear();
  let hours: number = od.getHours();
  let minutes: string | number = od.getMinutes();
  const ampm: string = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  const strTime: string =
    day +
    "/" +
    (typeof month === "string" ? parseInt(month) + 1 : month + 1) +
    "/" +
    year +
    " " +
    hours +
    ":" +
    minutes +
    " " +
    ampm;
  return strTime;
};

export const dateChanger = (od: Date): string => {
  let day = od.getDate();
  let month: string | number = od.getMonth();

  const strTime =
    day + "/" + (typeof month === "string" ? parseInt(month) + 1 : month + 1);

  return strTime;
};

// A function generatated using chatGPT

export const humanReadableTime = (timestamp: string): string => {
  const currentTimestamp = Date.now();
  const duration = currentTimestamp - new Date(timestamp).getTime();
  const date = new Date(timestamp).toLocaleDateString();
  const time = new Date(timestamp).toLocaleTimeString();

  if (duration >= 86400000) {
    // 1 day
    return `${date} ${time}`;
  } else if (duration >= 3600000) {
    // 1 hour
    return `${Math.floor(duration / 3600000)} hours ago`;
  } else if (duration >= 60000) {
    // 1 minute
    return `${Math.floor(duration / 60000)} minutes ago`;
  } else if (duration >= 1000) {
    // 1 second
    return `${Math.floor(duration / 1000)} seconds ago`;
  } else {
    return "just now";
  }
};

// Date formater
export const formatDate = (date: Date): string => {
  const options: any = {
    weekday: "long",
    day: "numeric",
    month: "short",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);
  return formattedDate;
};
