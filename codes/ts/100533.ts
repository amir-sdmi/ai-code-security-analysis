const GOOGLE_SHEET_API_KEY = "AIzaSyCmrNrDddp3X6MdkOw-1h9lKfokPXKNYiI";
const CHAT_GPT_API_KEY =
  "sk-None-4ybnqgptkHBHMWVe3JSRT3BlbkFJ9FOna6aaP8QBeKAT9zFQ";

export const fetchSheetData = async () => {
  const sheetId = "1TLAqRHWlX_GIq9etxH8lTiIAe6i4flHFQWSSZ4Y4guc";
  const range = "Sheet1!B13:B22"; // Adjust the range as needed

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${GOOGLE_SHEET_API_KEY}`;

  try {
    const response: any = await fetch(url);
    const res = await response.json();
    return res;
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
  }
};

export const processMessageToChatGPT = async (chatMessages) => {
  const apiMessages = chatMessages.map((messageObject) => {
    const role = messageObject.sender === "ChatGPT" ? "assistant" : "user";
    return { role, content: messageObject.message };
  });

  const apiRequestBody = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "I'm a Student using ChatGPT for learning" },
      ...apiMessages,
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + CHAT_GPT_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(apiRequestBody),
  });

  return response.json();
};
