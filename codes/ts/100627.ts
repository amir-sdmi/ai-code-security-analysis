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

export function validatePayload(payload: any, requiredFields: any) {
  let missingFields: any = "";

  requiredFields.forEach((field: any) => {
    if (
      payload[field] === null ||
      payload[field] === undefined ||
      payload[field] === ""
    ) {
      console.error(
        !payload.hasOwnProperty(field),
        payload[field] === null,
        payload[field] === undefined,
        payload[field] === "",
      );
      missingFields = missingFields + " " + field;
    }
  });

  if (missingFields.length > 0) {
    return { payloadIsCurrect: false, missingFields: missingFields };
  }

  return { payloadIsCurrect: true, missingFields: missingFields };
}
