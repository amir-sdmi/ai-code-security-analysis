import axios from "axios";
import { endpoints } from "./axios";

export const apiGetCredentialsFromAccessToken = (accessToken) =>
  axios({
    method: "get",
    url: endpoints.auth.getCredentialGoogleToken + accessToken,
  });
export const apiGetProvinces = () =>
  axios({
    method: "get",
    url: endpoints.external.getProvinces,
  });
export const apiGetDistrictsById = (did) =>
  axios({
    method: "get",
    url: endpoints.external.getDistrictsById + did,
  });
export const apiGetWardsById = (wid) =>
  axios({
    method: "get",
    url: endpoints.external.getWardsById + wid,
  });
export const apiUploadImages = (data) =>
  axios({
    method: "post",
    // url:`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_NAME}/image/upload`,
    url: endpoints.cloudinary.Cloudinary,
    data,
  });
export const apiGetLongitudeAndLatitudeFromAddress = (address) =>
  axios({
    method: "get",
    url: `https://api.geoapify.com/v1/geocode/search?text=${address}&apiKey=${
      import.meta.env.VITE_API_GEOAPIFY
    }`,
  });
export const apiWriteDescriptionWithChatGPT = (prompt) => {
  return axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_API_CHATGPT}`,
    },
    url: import.meta.env.VITE_URL_CHATGPT,
    data: {
      model: "gpt-4o-mini",
      // prompt: prompt,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200, // Limit response length, adjust as needed
    },
  });
};
// Function to check for inappropriate content using ChatGPT API
export const apiCheckForInappropriateContent = async (text) => {
  const prompt = `Please analyze the following text for inappropriate or offensive language and return true if it contains any such content, or false if it does not:   
  "${text}"`;

  const response = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_API_CHATGPT}`,
    },
    url: import.meta.env.VITE_URL_CHATGPT,
    data: {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50, // Adjust the response length if necessary
    },
  });

  if (response.data.choices && response.data.choices.length > 0) {
    const contentResponse = response.data.choices[0].message.content;
    return contentResponse.toLowerCase().includes("true"); // Check if the response indicates inappropriate content
  }
};
