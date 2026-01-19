import multer from "multer";

// Configure storage for multer to save files temporarily in "./public/temp"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Files will be stored in this folder temporarily
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9); // Unique filename to prevent overwriting (suggested by chatgpt)
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

// Export the multer instance for handling file uploads
export const upload = multer({ storage: storage });
