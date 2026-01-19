// Miscellaneous functions for image handling, formatting, conversion
// Code mostly from conversations with ChatGPT

/**
 * Resize an image, keep aspect ratio.
 * @param image Original image
 * @param maxWidth Maximum allowed width
 * @param maxHeight Maximum allowed height
 * @return The image in Data URI format
 */
export function resizeImage(
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): string {
  const canvas = document.createElement("canvas");
  let width = image.width;
  let height = image.height;

  if (width > maxWidth || height > maxHeight) {
    if (width > height) {
      height = Math.round((height / width) * maxWidth);
      width = maxWidth;
    } else {
      width = Math.round((width / height) * maxHeight);
      height = maxHeight;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    context.drawImage(image, 0, 0, width, height);
  }

  return canvas.toDataURL("image/jpeg");
}

/**
 * Convert image in Data URI format to a File format. The File can be uploaded to the server as multipart data.
 * @param dataURI Image in Data URI format
 * @param fileName Name of the destination file
 * @return The resulting image file
 */
export function dataURItoFile(dataURI: string, fileName: string): File {
  const blob = dataURItoBlob(dataURI);
  return new File([blob], fileName, { type: blob.type });
}

/**
 * Convert an image in Data URI format to a Blob
 * @param dataURI Image in a Data URI format
 * @return The same image in Blob format
 */
function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
}
