const { OpenAI } = require("openai"); // Ensure you have the OpenAI SDK installed
require("dotenv").config();

// Set up OpenAI API instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(subject, recipient, emailBody) {
  try {
    // Generate a subject and body for the email using ChatGPT
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can use a different model if needed
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for generating email responses.",
        },
        {
          role: "user",
          content: `Generate a reply email with the following details into consideration: Body: "${emailBody}", No need to include the recipient's name in the body, and close with "Regards, Push Fam". If the email contains abusive, nonsensical, or irrelevant content, reply in a funny, light-hearted, and polite manner. If the email content does not make sense or is random, reply in a funny, polite, and kind way, keeping it friendly. If there is any reference to 'Push', please consider it as referring to Push Protocol. Please ensure the message is clear and easy to read, using new lines (\n) for spacing and structure. Please return the response in the following format: \n{ \n"Subject": "<subject>", \n"Body": "<body>" \n}`,
        },
      ],
    });

    const emailContent = response.choices[0].message.content;
    console.log("Generated email content:", emailContent);

    const cleanedContent = emailContent.trim();

    // Extract the subject by finding the part of the string after "Subject" and before the next comma
    const subjectMatch = cleanedContent.match(/"Subject":\s?"([^"]+)"/);
    const bodyMatch = cleanedContent.match(/"Body":\s?"([^"]+)"/);

 
      const generatedSubject = subjectMatch[1]; // Extract the subject
      const generatedBody = bodyMatch[1].replace(/\\n/g, "\n"); // Extract the body and replace escaped newlines

      console.log("Generated Subject:", generatedSubject);
      console.log("Generated Body:\n", generatedBody);
  
    return {
      subject: `Re: ${subject}`,
      body: {
        content: generatedBody,
        format: 0,
      },
      attachments: [],
      headers: [{ key: "Priority", value: "High" }],
    };
  } catch (error) {
    console.error("Error generating email content:", error);
    throw error;
  }
}

module.exports = { generateReply };
