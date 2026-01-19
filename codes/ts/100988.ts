import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
dotenv.config();
const uploadPath: string = process.env.UPLOAD_PATH || "uploads";
//Copyright of script: https://medium.com/@bviveksingh96/uploading-images-files-with-multer-in-node-js-f942e9319600

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadFolderPath = getUploadFolderPath(file.fieldname);

    // Check if the folder exists, create it if it doesn't
    if (!fs.existsSync(uploadFolderPath)) {
      fs.mkdirSync(uploadFolderPath, { recursive: true });
    }

    cb(null, uploadFolderPath);
  },

  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});
const fileFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Image uploaded is not of type jpg/jpeg or png"), false);
  }
};
// This function is created with chatgpt
function getUploadFolderPath(fieldName: string): string {
  //const uploadPath = process.env.UPLOAD_PATH || "uploads"; // Get upload path from .env file or use default 'uploads'
  const uploadPath = "uploads";
  const backendPath = path.join(__dirname, "../../Backend"); // Assuming 'FileUpload.ts' is in the 'utils' directory

  if (fieldName === "profilePicture") {
    return path.join(backendPath, uploadPath, "users");
  } else if (fieldName === "thumbnail") {
    return path.join(backendPath, uploadPath, "events");
  } else {
    return path.join(backendPath, uploadPath); // Default upload folder for other cases
  }
}

export function deleteProfilePicture(filePath: string): void {
  try {
    const fullPath = path.join(__dirname, "../../Backend", filePath); // Assuming 'FileUpload.ts' is in the 'utils' directory
    fs.unlinkSync(fullPath);
  } catch (error) {
    throw error;
  }
}

export function deleteEventThumbnail(filePath: string): void {
  /** 
  try {
    const fullPath = path.join(__dirname, "../../Backend", filePath); // Assuming 'FileUpload.ts' is in the 'utils' directory
    fs.unlinkSync(fullPath);
  } catch (error) {
    throw error;
  }
  */
}

// file size : 10 MB limit
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
