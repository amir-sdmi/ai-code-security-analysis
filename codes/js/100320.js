import * as Sentry from "@sentry/node";
import { authenticateUser } from "./_apiUtils.js";

Sentry.init({
  dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
  environment: process.env.VITE_PUBLIC_APP_ENV,
  initialScope: {
    tags: {
      type: 'backend',
      projectId: process.env.VITE_PUBLIC_APP_ID
    }
  }
});

export default async function handler(req, res) {
  try {
    await authenticateUser(req);
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { prompt, response_type } = req.body;

    // Here you would integrate with ChatGPT API or similar
    // For example purposes, we'll mock the response
    let responseData = "This is a mock response to your prompt.";

    if (response_type === 'json') {
      responseData = { answer: "This is a mock JSON response." };
    }

    res.status(200).json({ data: responseData });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}