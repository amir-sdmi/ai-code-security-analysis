async function sendMessagetoChatGPT(chatMessages) {



//   const apiMessages = chatMessages.map((messageObject) => {
//     const role = messageObject.sender === "ChatGPT" ? "assistant" : "user";
//     return { role, content: messageObject.message };
//   });

  const apiRequestBody = {
    model: "text-davinci-003",
    messages: [
      { role: "system", content: "I'm a Student using ChatGPT for learning" },
     " ...apiMessages,"
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.REACT_APP_OPEN_AI_OLD_API,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(apiRequestBody),
  });

  return response.json();
}

export default sendMessagetoChatGPT;


