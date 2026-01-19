import { CustomError } from "@/types/customError";
import { resizeImage } from "./resizeImage";
import tempImage from "@/middleware/models/tempImage";
import { serpapi } from "@/services/ai/imageAnalyzer/serpApi_analyzer";
import { chatgptForBrandAndModel } from "@/services/ai/dataAnalyzer/gpt4-Analyzer";
import { chatgptRestOfAnalysis } from "@/services/ai/imageAnalyzer/gpt4-analyzer";
import {
  NewFurnitureDetails,
  OptimizedImage,
  PriceEstimation,
  SerpApiResult,
} from "@/types/schemas";
import { analyzePrice } from "@/services/ai/priceAnalyzer/priceFunction";
import { BaseResponse } from "serpapi";

// This function handles the image resizing and returns the optimized image
export const handleImage = async (file: Express.Multer.File) => {
  try {
    const optimizedImage = await resizeImage(file.buffer);
    return optimizedImage;
  } catch (error) {
    console.error("Error resizing image: ", error);
    throw new CustomError("Image resizing failed", 500);
  }
};

// This function handles saving the tempImage to the database and returns the saved image ID
export const handleSaveTempImage = async (
  optimizedImage: { buffer: Buffer; base64: string; metadata: any },
  file: Express.Multer.File
) => {
  try {
    const imageForEvaluation = new tempImage({
      contentType: file.mimetype,
      image: optimizedImage.buffer,
    });
    const savedImage = await imageForEvaluation.save();
    const savedImageId = savedImage.id;
    return savedImageId;
  } catch (error) {
    console.error("Error saving image to DB: ", error);
    throw new CustomError("Image saving to database failed", 500);
  }
};

// This function handles the analysis of the image using SerpAPI and returns the response
export const handleSerpApiAnalysis = async (tempImageId: string) => {
  try {
    const serpApiResponse = await serpapi(tempImageId);
    return serpApiResponse;
  } catch (error) {
    console.error("Error in SerpAPI analysis: ", error);
    throw new CustomError("SerpAPI analysis failed", 500);
  }
};

// This function handles the serpAPI analysis of the image using ChatGPT and returns the response
export const handleChatGptAnalysis = async (
  serpApiResponse: BaseResponse,
  optimizedImage: OptimizedImage
) => {
  try {
    const [chatgptResponse, restGptAnalysis] = await Promise.all([
      chatgptForBrandAndModel(serpApiResponse),
      chatgptRestOfAnalysis(optimizedImage.buffer),
    ]);
    return { chatgptResponse, restGptAnalysis };
  } catch (error) {
    console.error("Error in ChatGPT analysis: ", error);
    throw new CustomError("ChatGPT analysis failed", 500);
  }
};

// This function handles the price analysis using the image buffer and returns the price estimation
export const handlePriceAnalysis = async (
  restGptAnalysis: NewFurnitureDetails,
  chatgptResponse: SerpApiResult,
  imageBuffer: Buffer
): Promise<PriceEstimation> => {
  try {
    const priceEstimation = await analyzePrice(
      restGptAnalysis,
      chatgptResponse,
      imageBuffer
    );
    return priceEstimation;
  } catch (error) {
    console.error("Error in price analysis: ", error);
    throw new CustomError("Price analysis failed", 500);
  }
};
