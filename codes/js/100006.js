import express from "express";
import { fetchAndProcessPapers, getStoredPapers } from "../controllers/arxivController.js";

const router = express.Router();

// Route to fetch papers from arXiv, process with Gemini and save to DB
router.get("/fetch", fetchAndProcessPapers);

// Route to get stored papers from our database
router.get("/", getStoredPapers);

export default router;